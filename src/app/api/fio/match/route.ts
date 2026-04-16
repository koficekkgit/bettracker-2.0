import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

const FIO_URL = `https://fioapi.fio.cz/v1/rest/last/${process.env.FIO_API_TOKEN}/transactions.json`;

export async function GET(req: NextRequest) {
  // Ověř, že volání přišlo od Vercel Cron (nebo ručně se správným secret)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin Supabase client — obchází RLS, nutný pro update cizích profilů
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const result = { matched: 0, expired: 0, skipped: 0, errors: [] as string[] };

  // 1. Vyexpiruj staré pending platby
  const { error: expErr, count } = await supabase
    .from('pending_payments')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString());

  if (expErr) {
    result.errors.push(`Expire: ${expErr.message}`);
  } else {
    result.expired = count ?? 0;
  }

  // 2. Stáhni transakce z Fio API
  let fioData: any;
  try {
    const res = await fetch(FIO_URL, {
      headers: { Accept: 'application/json' },
      // next: no-store — nechceme cache u finančních dat
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Fio API returned ${res.status}` },
        { status: 500 }
      );
    }
    fioData = await res.json();
  } catch (e: any) {
    return NextResponse.json({ error: `Fio fetch failed: ${e.message}` }, { status: 500 });
  }

  const transactions: any[] =
    fioData?.accountStatement?.transactionList?.transaction ?? [];

  // 3. Zpracuj každou transakci
  for (const tx of transactions) {
    // Vyber VS a částku z dynamických sloupců (Fio vrací sloupce jako column0..columnN)
    let vs: number | null = null;
    let amount: number | null = null;

    for (const col of Object.values(tx) as any[]) {
      if (!col || typeof col !== 'object') continue;
      if (col.name === 'VS' && col.value != null) vs = Number(col.value);
      if (col.name === 'Objem' && col.value != null) amount = Number(col.value);
    }

    // Přeskočíme odchozí platby a transakce bez VS
    if (!vs || !amount || amount <= 0) {
      result.skipped++;
      continue;
    }

    // Najdi pending platbu se stejným VS
    const { data: payment, error: findErr } = await supabase
      .from('pending_payments')
      .select('*')
      .eq('variable_symbol', vs)
      .eq('status', 'pending')
      .maybeSingle();

    if (findErr) {
      result.errors.push(`Find VS ${vs}: ${findErr.message}`);
      continue;
    }
    if (!payment) {
      result.skipped++;
      continue;
    }

    // Ověř částku (tolerance 1 Kč kvůli případným poplatkům)
    if (Math.abs(amount - payment.amount) > 1) {
      result.errors.push(`VS ${vs}: částka nesedí (přišlo ${amount}, očekáváno ${payment.amount})`);
      continue;
    }

    // Označ platbu jako spárovanou
    const { error: matchErr } = await supabase
      .from('pending_payments')
      .update({ status: 'matched', matched_at: new Date().toISOString() })
      .eq('id', payment.id);

    if (matchErr) {
      result.errors.push(`Match VS ${vs}: ${matchErr.message}`);
      continue;
    }

    // Aktivuj / prodluž předplatné
    const plan = SUBSCRIPTION_PLANS[payment.plan as keyof typeof SUBSCRIPTION_PLANS];

    let newUntil: string | null = null;
    if (plan.days !== null) {
      // Pokud má user ještě aktivní pro, prodlužujeme od konce, ne od teď
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_until')
        .eq('id', payment.user_id)
        .single();

      const base =
        profile?.subscription_until && new Date(profile.subscription_until) > new Date()
          ? new Date(profile.subscription_until)
          : new Date();

      base.setDate(base.getDate() + plan.days);
      newUntil = base.toISOString();
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'pro',
        subscription_plan: payment.plan,
        subscription_until: newUntil,
      })
      .eq('id', payment.user_id);

    if (updateErr) {
      result.errors.push(`Profile update ${payment.user_id}: ${updateErr.message}`);
      continue;
    }

    // Zaloguj referral použití, pokud byl kód použit
    if (payment.referral_code) {
      const { data: refCode } = await supabase
        .from('referral_codes')
        .select('owner_id, reward_pct')
        .eq('code', payment.referral_code)
        .maybeSingle();

      if (refCode) {
        const originalAmount = payment.original_amount ?? payment.amount;
        const discountAmount = originalAmount - payment.amount;
        const rewardPct = (refCode as { owner_id: string; reward_pct: number }).reward_pct ?? 10;
        const rewardAmount = Math.round(originalAmount * rewardPct / 100);

        await supabase.from('referral_uses').insert({
          code: payment.referral_code,
          owner_id: refCode.owner_id,
          used_by: payment.user_id,
          plan: payment.plan,
          original_amount: originalAmount,
          discount_amount: discountAmount,
          reward_amount: rewardAmount,
          payment_id: payment.id,
        });
      }
    }

    result.matched++;
  }

  return NextResponse.json({ ok: true, ...result });
}
