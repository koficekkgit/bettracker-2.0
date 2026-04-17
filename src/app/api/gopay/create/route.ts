/**
 * POST /api/gopay/create
 *
 * Vytvoří GoPay platbu a vrátí redirect URL na platební bránu.
 *
 * Body: { plan: PlanId, referral_code?: string }
 * Response: { gw_url: string, gopay_id: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayment, kczToHalere, type Recurrence } from '@/lib/gopay';
import { SUBSCRIPTION_PLANS, type PlanId } from '@/lib/payments';

/** Mapování tarifu → nastavení opakování GoPay */
const RECURRENCE_MAP: Partial<Record<PlanId, Recurrence>> = {
  monthly:   { recurrence_cycle: 'MONTH', recurrence_period: 1 },
  quarterly: { recurrence_cycle: 'MONTH', recurrence_period: 3 },
  yearly:    { recurrence_cycle: 'MONTH', recurrence_period: 12 },
  // lifetime → žádné opakování
};

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bettracker.cz';

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Vstup ──────────────────────────────────────────────────────────
    const body = await req.json() as { plan: PlanId; referral_code?: string };
    const plan = SUBSCRIPTION_PLANS[body.plan];
    if (!plan) {
      return NextResponse.json({ error: 'Neplatný plán' }, { status: 400 });
    }

    // ── 3. Profil uživatele ───────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, username')
      .eq('id', user.id)
      .single();

    // ── 4. Unikátní VS pro párování ───────────────────────────────────────
    const { data: vsData, error: vsError } = await supabase
      .rpc('next_payment_vs');
    if (vsError || !vsData) {
      throw new Error('Nepodařilo se vygenerovat VS: ' + vsError?.message);
    }
    const variableSymbol = String(vsData);

    // ── 5. Sleva z referral kódu ──────────────────────────────────────────
    let finalAmount = plan.price;
    let discountPct = 0;

    if (body.referral_code) {
      const { data: codeData } = await supabase
        .rpc('validate_referral_code', { code: body.referral_code });
      if (codeData?.valid && codeData.discount_pct > 0) {
        discountPct = codeData.discount_pct;
        finalAmount = Math.round(plan.price * (1 - discountPct / 100));
      }
    }

    // ── 6. Uložení pending payment do DB ──────────────────────────────────
    // Zruš případné staré pending platby
    await supabase
      .from('pending_payments')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    const { data: payment, error: paymentError } = await supabase
      .from('pending_payments')
      .insert({
        user_id: user.id,
        variable_symbol: variableSymbol,
        plan: body.plan,
        amount: finalAmount,
        original_amount: plan.price,
        currency: 'CZK',
        status: 'pending',
        referral_code: body.referral_code ?? null,
        // gopay_id bude doplněno níže
      })
      .select()
      .single();

    if (paymentError || !payment) {
      throw new Error('Nepodařilo se uložit platbu: ' + paymentError?.message);
    }

    // ── 7. Vytvoř platbu v GoPay ──────────────────────────────────────────
    const gopayPayment = await createPayment({
      order_number: variableSymbol,
      order_description: `BetTracker Pro - ${plan.name}`,
      amount: kczToHalere(finalAmount),
      currency: 'CZK',
      buyer_email: profile?.email ?? user.email ?? '',
      buyer_name: profile?.username ?? undefined,
      return_url: `${ORIGIN}/gopay/return?vs=${variableSymbol}`,
      notify_url: `${ORIGIN}/api/gopay/notify`,
      items: [
        {
          type: 'ITEM',
          name: `BetTracker Pro - ${plan.name}`,
          amount: kczToHalere(finalAmount),
          count: 1,
          vat_rate: 0,
        },
      ],
      recurrence: RECURRENCE_MAP[body.plan],
    });

    // ── 8. Ulož GoPay ID do DB ────────────────────────────────────────────
    await supabase
      .from('pending_payments')
      .update({ gopay_id: gopayPayment.id })
      .eq('id', payment.id);

    // ── 9. Vrať URL na platební bránu ─────────────────────────────────────
    return NextResponse.json({
      gw_url: gopayPayment.gw_url,
      gopay_id: gopayPayment.id,
    });

  } catch (err) {
    console.error('[gopay/create]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Interní chyba' },
      { status: 500 }
    );
  }
}
