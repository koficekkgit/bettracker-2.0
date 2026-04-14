-- =====================================================================
-- PATCH: Funkce pro ruční nastavení aktuálního balance
-- Spustit v Supabase SQL Editoru
-- =====================================================================

-- Uživatel zadá "teď mám na Betanu 8000 Kč" a appka si dopočítá
-- adjustment transakci, která vyrovná rozdíl mezi stávajícím výpočtem
-- a reálnou hodnotou.

create or replace function public.bankroll_set_current_balance(
  p_account_id uuid,
  p_target_balance numeric(12,2),
  p_notes text
)
returns numeric(12,2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_current numeric(12,2);
  v_diff numeric(12,2);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select user_id into v_owner from public.bookmaker_accounts where id = p_account_id;
  if v_owner is null then
    raise exception 'account_not_found';
  end if;
  if v_owner <> v_uid then
    raise exception 'not_authorized';
  end if;

  -- Aktuální vypočítaný balance ze všech transakcí
  select coalesce(sum(amount), 0) into v_current
  from public.bankroll_transactions
  where account_id = p_account_id;

  v_diff := p_target_balance - v_current;

  -- Pokud je rozdíl 0, nic neděláme
  if v_diff = 0 then
    return v_current;
  end if;

  -- Vložíme adjustment transakci, která vyrovná rozdíl
  insert into public.bankroll_transactions (
    account_id, kind, amount, notes, created_by
  ) values (
    p_account_id, 'adjustment', v_diff, coalesce(p_notes, 'Nastavení aktuálního balance'), v_uid
  );

  return p_target_balance;
end;
$$;

revoke all on function public.bankroll_set_current_balance(uuid, numeric, text) from public;
grant execute on function public.bankroll_set_current_balance(uuid, numeric, text) to authenticated;

-- Flag na profilu, jestli user prošel bankroll onboardingem (první nastavení)
alter table public.profiles
  add column if not exists bankroll_onboarded_at timestamptz;
