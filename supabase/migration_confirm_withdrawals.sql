-- =====================================================================
-- PATCH: Potvrzování výběrů
-- Spustit v Supabase SQL Editoru
-- =====================================================================
-- Logika: Nepotvrzený withdrawal je "plánovaný" — neovlivňuje potvrzený
-- balance, ale ukazuje se v "očekávaném" balance. Teprve když user
-- klikne "potvrdit", withdrawal se započítá do potvrzeného balance.
--
-- Ostatní transakce (deposit, bet_placed, bet_settled, bonus, adjustment)
-- jsou vždy "potvrzené" a započítávají se do obou balance stejně.

alter table public.bankroll_transactions
  add column if not exists confirmed boolean not null default true,
  add column if not exists confirmed_at timestamptz;

-- Existující transakce jsou všechny confirmed (výchozí true).
-- Nové výběry se budou zakládat s confirmed=false, ostatní s true.

-- Update view: vracíme DVA balance sloupce
drop view if exists public.bookmaker_account_balances;
create view public.bookmaker_account_balances as
  select
    a.id as account_id,
    a.user_id,
    -- Potvrzený balance: ignoruje nepotvrzené výběry
    coalesce(
      sum(case
        when t.kind = 'withdrawal' and t.confirmed = false then 0
        else t.amount
      end), 0
    ) as balance,
    -- Očekávaný balance: počítá vše včetně nepotvrzených
    coalesce(sum(t.amount), 0) as balance_expected,
    -- Počet čekajících výběrů
    count(*) filter (where t.kind = 'withdrawal' and t.confirmed = false) as pending_withdrawals
  from public.bookmaker_accounts a
  left join public.bankroll_transactions t on t.account_id = a.id
  group by a.id, a.user_id;

grant select on public.bookmaker_account_balances to authenticated;

-- Upravit RPC pro přidání transakce: withdrawals se vytváří defaultně nepotvrzené,
-- ostatní confirmed=true
create or replace function public.bankroll_add_transaction(
  p_account_id uuid,
  p_kind text,
  p_amount numeric(12,2),
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_tx_id uuid;
  v_confirmed boolean;
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

  if p_kind not in ('deposit','withdrawal','bonus','adjustment') then
    raise exception 'invalid_kind';
  end if;

  -- Withdrawal = defaultně nepotvrzený, ostatní potvrzené
  v_confirmed := (p_kind <> 'withdrawal');

  insert into public.bankroll_transactions (
    account_id, kind, amount, notes, created_by, confirmed, confirmed_at
  )
  values (
    p_account_id, p_kind, p_amount, p_notes, v_uid,
    v_confirmed,
    case when v_confirmed then now() else null end
  )
  returning id into v_tx_id;

  return v_tx_id;
end;
$$;

-- RPC pro potvrzení/odvolání withdrawal
create or replace function public.bankroll_confirm_transaction(
  p_transaction_id uuid,
  p_confirmed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select a.user_id into v_owner
  from public.bankroll_transactions t
  join public.bookmaker_accounts a on a.id = t.account_id
  where t.id = p_transaction_id;

  if v_owner is null then
    raise exception 'transaction_not_found';
  end if;
  if v_owner <> v_uid then
    raise exception 'not_authorized';
  end if;

  update public.bankroll_transactions
  set confirmed = p_confirmed,
      confirmed_at = case when p_confirmed then now() else null end
  where id = p_transaction_id;
end;
$$;

revoke all on function public.bankroll_confirm_transaction(uuid, boolean) from public;
grant execute on function public.bankroll_confirm_transaction(uuid, boolean) to authenticated;
