-- =====================================================================
-- MIGRACE: Bankroll & Bookmaker Accounts
-- Spustit v Supabase SQL Editoru PO odzálohování databáze (doporučeno)
-- =====================================================================

-- =====================================================================
-- 1) Tabulky
-- =====================================================================

create table if not exists public.bookmaker_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  template_key text,                                -- např. 'tipsport', 'fortuna', null pro custom
  currency text not null default 'CZK',
  hard_limit boolean not null default false,        -- tvrdý limit: nelze vsadit víc než balance
  low_balance_threshold numeric(12,2),              -- alert práh, null = bez alertu
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookmaker_accounts_user on public.bookmaker_accounts(user_id);

-- Každý pohyb na účtu. Balance = suma amount za account_id.
create table if not exists public.bankroll_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.bookmaker_accounts(id) on delete cascade,
  kind text not null check (kind in ('deposit','withdrawal','bonus','adjustment','bet_placed','bet_settled')),
  amount numeric(12,2) not null,  -- signed: + přírůstek, - úbytek
  bet_id uuid references public.bets(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_bankroll_tx_account on public.bankroll_transactions(account_id);
create index if not exists idx_bankroll_tx_bet on public.bankroll_transactions(bet_id);
create index if not exists idx_bankroll_tx_created on public.bankroll_transactions(created_at);

-- View: aktuální balance per účet (vše odvozeno z transakcí, nikdy neukládáme kešovaný balance)
create or replace view public.bookmaker_account_balances as
  select
    a.id as account_id,
    a.user_id,
    coalesce(sum(t.amount), 0) as balance
  from public.bookmaker_accounts a
  left join public.bankroll_transactions t on t.account_id = a.id
  group by a.id, a.user_id;

-- =====================================================================
-- 2) FK na bets (bookmaker_account_id) - sloupec bookmaker string zůstává
-- =====================================================================

alter table public.bets
  add column if not exists bookmaker_account_id uuid references public.bookmaker_accounts(id) on delete set null;

create index if not exists idx_bets_bookmaker_account on public.bets(bookmaker_account_id);

-- =====================================================================
-- 3) Trigger funkce: synchronizace bets → bankroll_transactions
-- =====================================================================
-- Logika:
--   INSERT bet (status = 'pending'): vytvoří bet_placed transakci -stake
--   INSERT bet (status settled): vytvoří bet_placed -stake + bet_settled podle výsledku
--   UPDATE bet: smaže staré transakce (bet_placed, bet_settled) a vytvoří nové
--   DELETE bet: smaže všechny transakce přes ON DELETE CASCADE (FK bet_id)

create or replace function public.bet_settled_amount(b public.bets)
returns numeric language plpgsql immutable as $$
declare
  v_stake numeric(12,2) := b.stake;
  v_odds numeric(8,3) := b.odds;
  v_payout numeric(12,2) := coalesce(b.payout, 0);
begin
  -- bet_settled = kolik se reálně vrátí na účet (před tím stejný stake byl odečten jako bet_placed)
  case b.status
    when 'won' then return v_stake * v_odds;           -- plná výhra
    when 'lost' then return 0;                          -- nic se nevrací
    when 'void' then return v_stake;                    -- vsazené peníze zpět
    when 'cashout' then return v_payout;                -- co user dostal
    when 'half_won' then return v_stake + (v_stake * (v_odds - 1)) / 2;  -- půl výhra
    when 'half_lost' then return v_stake / 2;           -- polovina stakes zpět
    else return 0;  -- pending nebo neznámý
  end case;
end;
$$;

create or replace function public.sync_bankroll_for_bet()
returns trigger language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_old_account_id uuid;
  v_settled_amount numeric(12,2);
begin
  -- DELETE řeší FK cascade automaticky, ale necháme jako no-op
  if tg_op = 'DELETE' then
    return old;
  end if;

  v_account_id := new.bookmaker_account_id;

  -- Pokud sázka nemá account, nic neděláme (legacy sázka bez bookmakeru)
  if v_account_id is null then
    -- Při UPDATE: smazat staré transakce, pokud byly
    if tg_op = 'UPDATE' and old.bookmaker_account_id is not null then
      delete from public.bankroll_transactions
      where bet_id = new.id;
    end if;
    return new;
  end if;

  -- Při UPDATE: smazat staré transakce (přepočet)
  if tg_op = 'UPDATE' then
    delete from public.bankroll_transactions where bet_id = new.id;
  end if;

  -- bet_placed: vždy odečte stake (peníze blokované od okamžiku vsazení)
  insert into public.bankroll_transactions (account_id, kind, amount, bet_id, created_by)
  values (v_account_id, 'bet_placed', -new.stake, new.id, new.user_id);

  -- bet_settled: jen pokud status není pending
  if new.status <> 'pending' then
    v_settled_amount := public.bet_settled_amount(new);
    insert into public.bankroll_transactions (account_id, kind, amount, bet_id, created_by)
    values (v_account_id, 'bet_settled', v_settled_amount, new.id, new.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_bankroll_for_bet on public.bets;
create trigger trg_sync_bankroll_for_bet
  after insert or update of status, stake, odds, payout, bookmaker_account_id on public.bets
  for each row execute function public.sync_bankroll_for_bet();

-- =====================================================================
-- 4) Automatická migrace existujících sázek
-- =====================================================================
-- Pro každý unikátní (user_id, bookmaker) vytvoří bookmaker_account
-- a propojí sázky. Sázky bez bookmakeru se přiřadí k účtu 'Ostatní'.

do $$
declare
  v_user record;
  v_bookmaker record;
  v_account_id uuid;
begin
  -- Pro každého usera vytvoříme default "Ostatní" účet, pokud ho ještě nemá
  for v_user in
    select distinct user_id from public.bets
  loop
    -- Pro každou unikátní sázkovku usera
    for v_bookmaker in
      select distinct coalesce(nullif(trim(bookmaker), ''), 'ostatni') as bm
      from public.bets
      where user_id = v_user.user_id
    loop
      -- Existuje už takový account? (match podle template_key)
      select id into v_account_id
      from public.bookmaker_accounts
      where user_id = v_user.user_id
        and (template_key = v_bookmaker.bm or (template_key is null and v_bookmaker.bm = 'ostatni' and name = 'Ostatní'))
      limit 1;

      if v_account_id is null then
        insert into public.bookmaker_accounts (user_id, name, template_key)
        values (
          v_user.user_id,
          case v_bookmaker.bm
            when 'tipsport' then 'Tipsport'
            when 'fortuna' then 'Fortuna'
            when 'betano' then 'Betano'
            when 'chance' then 'Chance'
            when 'synot' then 'Synot Tip'
            when 'kingsbet' then 'Kingsbet'
            when 'ifortuna' then 'iFortuna'
            when 'ostatni' then 'Ostatní'
            else initcap(v_bookmaker.bm)
          end,
          case when v_bookmaker.bm = 'ostatni' then null else v_bookmaker.bm end
        )
        returning id into v_account_id;
      end if;

      -- Propojit všechny sázky s tímto bookmakerem
      update public.bets
      set bookmaker_account_id = v_account_id
      where user_id = v_user.user_id
        and coalesce(nullif(trim(bookmaker), ''), 'ostatni') = v_bookmaker.bm
        and bookmaker_account_id is null;
    end loop;
  end loop;
end $$;

-- Retrospektivně vygenerovat transakce pro existující sázky
-- (Trigger výše je "after insert or update", takže se nespustí pro existující řádky.
-- Musíme je vygenerovat ručně tímhle dotazem.)
insert into public.bankroll_transactions (account_id, kind, amount, bet_id, created_by, created_at)
select
  b.bookmaker_account_id,
  'bet_placed',
  -b.stake,
  b.id,
  b.user_id,
  b.created_at
from public.bets b
where b.bookmaker_account_id is not null
  and not exists (
    select 1 from public.bankroll_transactions t
    where t.bet_id = b.id and t.kind = 'bet_placed'
  );

insert into public.bankroll_transactions (account_id, kind, amount, bet_id, created_by, created_at)
select
  b.bookmaker_account_id,
  'bet_settled',
  public.bet_settled_amount(b),
  b.id,
  b.user_id,
  b.updated_at
from public.bets b
where b.bookmaker_account_id is not null
  and b.status <> 'pending'
  and not exists (
    select 1 from public.bankroll_transactions t
    where t.bet_id = b.id and t.kind = 'bet_settled'
  );

-- =====================================================================
-- 5) RLS politiky
-- =====================================================================

alter table public.bookmaker_accounts enable row level security;
alter table public.bankroll_transactions enable row level security;

-- bookmaker_accounts: user vidí a edituje jen své účty
drop policy if exists bookmaker_accounts_self on public.bookmaker_accounts;
create policy bookmaker_accounts_self on public.bookmaker_accounts
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- bankroll_transactions: user vidí/edituje jen své (přes FK na účet)
drop policy if exists bankroll_tx_self on public.bankroll_transactions;
create policy bankroll_tx_self on public.bankroll_transactions
  for all using (
    exists (
      select 1 from public.bookmaker_accounts a
      where a.id = account_id and a.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.bookmaker_accounts a
      where a.id = account_id and a.user_id = auth.uid()
    )
  );

-- View dědí RLS z podkladové tabulky bookmaker_accounts (nepotřebuje vlastní policy)
-- ale musíme povolit SELECT na view pro authenticated roli:
grant select on public.bookmaker_account_balances to authenticated;

-- =====================================================================
-- 6) Helper RPC: manuální deposit/withdrawal
-- =====================================================================

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

  insert into public.bankroll_transactions (account_id, kind, amount, notes, created_by)
  values (p_account_id, p_kind, p_amount, p_notes, v_uid)
  returning id into v_tx_id;

  return v_tx_id;
end;
$$;

revoke all on function public.bankroll_add_transaction(uuid, text, numeric, text) from public;
grant execute on function public.bankroll_add_transaction(uuid, text, numeric, text) to authenticated;
