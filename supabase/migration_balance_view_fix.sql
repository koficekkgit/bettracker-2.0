-- =====================================================================
-- FIX: balance view sčítal data všech userů (sdílelo se napříč usery)
-- + onboarding sloupec pro jistotu
-- Spustit v Supabase SQL Editoru
-- =====================================================================

-- 1) Sloupec pro onboarding (idempotentní, pokud máš spustí no-op)
alter table public.profiles
  add column if not exists bankroll_onboarded_at timestamptz;

-- 2) Recreate view s explicitním user filtrem + security_invoker
drop view if exists public.bookmaker_account_balances;

create view public.bookmaker_account_balances
with (security_invoker = true) as
  select
    a.id as account_id,
    a.user_id,
    coalesce(
      sum(case
        when t.kind = 'withdrawal' and t.confirmed = false then 0
        else t.amount
      end), 0
    ) as balance,
    coalesce(sum(t.amount), 0) as balance_expected,
    count(*) filter (where t.kind = 'withdrawal' and t.confirmed = false) as pending_withdrawals
  from public.bookmaker_accounts a
  left join public.bankroll_transactions t on t.account_id = a.id
  where a.user_id = auth.uid()
  group by a.id, a.user_id;

grant select on public.bookmaker_account_balances to authenticated;
