/**
 * GET /api/gopay/notify?id={gopay_payment_id}
 *
 * Webhook volaný GoPay po změně stavu platby.
 * GoPay volá tento endpoint opakovaně dokud nevrátíme 200.
 *
 * Docs: https://doc.gopay.com/#notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPayment } from '@/lib/gopay';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

export async function GET(req: NextRequest) {
  try {
    const gopayId = req.nextUrl.searchParams.get('id');
    if (!gopayId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // ── 1. Zjisti stav platby z GoPay ─────────────────────────────────────
    const gopayPayment = await getPayment(Number(gopayId));

    // Zajímá nás jen PAID (nebo AUTHORIZED pro předautorizace)
    if (gopayPayment.state !== 'PAID') {
      // Vrátíme 200 aby GoPay přestal opakovat, ale nic neaktivujeme
      return NextResponse.json({ status: gopayPayment.state });
    }

    // ── 2. Najdi pending_payment v DB ─────────────────────────────────────
    const supabase = createServiceClient();

    const { data: payment, error: findError } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('gopay_id', Number(gopayId))
      .eq('status', 'pending')
      .single();

    if (findError || !payment) {
      // Platba buď neexistuje nebo už zpracována — vrátíme 200
      return NextResponse.json({ status: 'already_processed' });
    }

    // ── 3. Ověř výši platby (tolerance ±1 Kč) ────────────────────────────
    const paidKc = gopayPayment.amount / 100; // GoPay vrací haléře
    if (Math.abs(paidKc - payment.amount) > 1) {
      console.error(`[gopay/notify] Částka nesedí: expected ${payment.amount}, got ${paidKc}`);
      // Nezpracujeme — ale vrátíme 200 aby GoPay neopakoval
      return NextResponse.json({ status: 'amount_mismatch' });
    }

    // ── 4. Aktivuj předplatné ─────────────────────────────────────────────
    const plan = SUBSCRIPTION_PLANS[payment.plan as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      console.error(`[gopay/notify] Neznámý plán: ${payment.plan}`);
      return NextResponse.json({ status: 'unknown_plan' });
    }

    // Spočítej subscription_until (prodlužování od konce stávajícího předplatného)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_until')
      .eq('id', payment.user_id)
      .single();

    let subscriptionUntil: string | null = null;
    if (plan.days !== null) {
      const base =
        profile?.subscription_status === 'pro' && profile.subscription_until
          ? new Date(profile.subscription_until)
          : new Date();
      subscriptionUntil = new Date(base.getTime() + plan.days * 86400_000).toISOString();
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'pro',
        subscription_plan: payment.plan,
        subscription_until: subscriptionUntil,
      })
      .eq('id', payment.user_id);

    if (profileError) {
      console.error('[gopay/notify] Profile update failed:', profileError);
      return NextResponse.json({ error: 'profile_update_failed' }, { status: 500 });
    }

    // ── 5. Označ platbu jako matched ─────────────────────────────────────
    await supabase
      .from('pending_payments')
      .update({
        status: 'matched',
        matched_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // ── 6. Zpracuj referral odměnu ────────────────────────────────────────
    if (payment.referral_code) {
      const { data: refCode } = await supabase
        .from('referral_codes')
        .select('owner_id, reward_pct')
        .eq('code', payment.referral_code)
        .single();

      if (refCode) {
        const originalAmount = payment.original_amount ?? payment.amount;
        const discountAmount = originalAmount - payment.amount;
        const rewardAmount   = Math.round(originalAmount * refCode.reward_pct / 100);

        await supabase.from('referral_uses').insert({
          code: payment.referral_code,
          owner_id: refCode.owner_id,
          used_by: payment.user_id,
          plan: payment.plan,
          original_amount: originalAmount,
          discount_amount: discountAmount,
          reward_amount: rewardAmount,
          payment_id: payment.id,
          paid_out: false,
        });
      }
    }

    console.log(`[gopay/notify] Aktivováno: user=${payment.user_id} plan=${payment.plan}`);
    return NextResponse.json({ status: 'ok' });

  } catch (err) {
    console.error('[gopay/notify] Error:', err);
    // Vrátíme 500 → GoPay to zkusí znovu
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
