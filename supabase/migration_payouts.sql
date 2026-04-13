-- =====================================================================
-- MIGRACE: Vyrovnávačky (payouts)
-- Spustit v Supabase SQL Editoru
-- =====================================================================

-- Admin flag pro zapnutí featury vybraným userům
alter table public.profiles
  add column if not exists payouts_enabled boolean not null default false;

-- =====================================================================
-- 1) SKUPINY
-- =====================================================================
create table if not exists public.payout_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- Profit split (procenta)
  profit_split_member numeric(5,2) not null check (profit_split_member between 0 and 100),
  profit_split_owner numeric(5,2) not null check (profit_split_owner between 0 and 100),
  -- Loss split (procenta) - může být jiné než profit
  loss_split_member numeric(5,2) not null default 50 check (loss_split_member between 0 and 100),
  loss_split_owner numeric(5,2) not null default 50 check (loss_split_owner between 0 and 100),
  -- Refer share = % z owner profit podílu (např. 25 znamená že refer bere čtvrtinu owner části)
  referrer_share_pct numeric(5,2) not null default 0 check (referrer_share_pct between 0 and 100),
  created_at timestamptz not null default now(),
  check (profit_split_member + profit_split_owner = 100),
  check (loss_split_member + loss_split_owner = 100)
);

create index if not exists idx_payout_groups_owner on public.payout_groups(owner_id);

-- =====================================================================
-- 2) ČLENOVÉ SKUPINY (linked nebo unlinked)
-- =====================================================================
create table if not exists public.payout_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.payout_groups(id) on delete cascade,
  -- Linked: user_id na profiles, display_name volitelné
  -- Unlinked: user_id null, display_name povinné
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  -- Refer = jiný member ze stejné skupiny
  referrer_member_id uuid references public.payout_group_members(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (user_id is not null or display_name is not null),
  unique (group_id, user_id)  -- linked user může být ve skupině jen jednou
);

create index if not exists idx_payout_members_group on public.payout_group_members(group_id);
create index if not exists idx_payout_members_user on public.payout_group_members(user_id);
create index if not exists idx_payout_members_referrer on public.payout_group_members(referrer_member_id);

-- =====================================================================
-- 3) UZAVŘENÁ OBDOBÍ
-- =====================================================================
create table if not exists public.payout_periods (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.payout_groups(id) on delete cascade,
  label text not null,  -- volné, např. "Duben 2026" nebo "Týden 14"
  closed_at timestamptz not null default now(),
  closed_by uuid not null references auth.users(id),
  notes text
);

create index if not exists idx_payout_periods_group on public.payout_periods(group_id);

-- =====================================================================
-- 4) ŘÁDKY VÝPOČTU (snapshot pro každého člena v daném období)
-- =====================================================================
create table if not exists public.payout_period_entries (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.payout_periods(id) on delete cascade,
  member_id uuid not null references public.payout_group_members(id) on delete cascade,
  -- Vstup od majitele
  member_pnl numeric(12,2) not null,  -- ručně zadaný P/L člena za období
  -- Výpočet
  member_share numeric(12,2) not null,    -- co zůstává/platí člen
  owner_share numeric(12,2) not null,     -- co inkasuje/platí majitel
  referrer_member_id uuid references public.payout_group_members(id) on delete set null,
  referrer_share numeric(12,2) not null default 0,  -- co reálně teklo do referovy peněženky (kladné nebo záporné)
  -- Status
  is_paid boolean not null default false,  -- vyplaceno mezi majitelem a členem
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_payout_entries_period on public.payout_period_entries(period_id);
create index if not exists idx_payout_entries_member on public.payout_period_entries(member_id);

-- =====================================================================
-- 5) REFER BALANCE - kumulativní zůstatek + výběry
-- =====================================================================
-- Pohyby na refer balance (audit trail). Aktuální balance = sum(amount).
create table if not exists public.payout_referrer_ledger (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.payout_groups(id) on delete cascade,
  referrer_member_id uuid not null references public.payout_group_members(id) on delete cascade,
  amount numeric(12,2) not null,  -- + přírůstek, - výběr
  kind text not null check (kind in ('period','withdrawal','adjustment')),
  period_id uuid references public.payout_periods(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists idx_referrer_ledger_member on public.payout_referrer_ledger(referrer_member_id);
create index if not exists idx_referrer_ledger_group on public.payout_referrer_ledger(group_id);

-- View: aktuální balance refera v dané skupině
create or replace view public.payout_referrer_balances as
  select
    referrer_member_id,
    group_id,
    coalesce(sum(amount), 0) as balance
  from public.payout_referrer_ledger
  group by referrer_member_id, group_id;

-- =====================================================================
-- 6) FUNKCE: uzavření období se snapshotem všech výpočtů
-- =====================================================================
-- Vstup: group_id, label, notes, JSONB pole {member_id, member_pnl}
-- Výstup: period_id (uuid)
-- Logika:
--   1. Pro každého člena vezme jeho P/L
--   2. Spočítá member_share / owner_share podle pravidel skupiny (profit vs loss split)
--   3. Pokud má refera a profit_split, spočítá refer_share = owner_share * (refer_pct/100)
--      a odečte ho z owner_share
--   4. Pro každého refera s neutralizovaným balance:
--      - Profit ze členů → kladný zápis do ledger
--      - Ztráty ze členů → záporný zápis do ledger
--      - Pokud má refer záporný balance (z minulosti), kladné podíly se použijí
--        nejdřív na splacení dluhu a teprve zbytek se připíše referovi.
--        V tom případě splacená částka jde majiteli místo referovi.
--   5. Vše uloží jako snapshot do period_entries + ledger
create or replace function public.close_payout_period(
  p_group_id uuid,
  p_label text,
  p_notes text,
  p_entries jsonb  -- [{"member_id": "uuid", "pnl": 1234.56}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_group public.payout_groups%rowtype;
  v_period_id uuid;
  v_entry jsonb;
  v_member_id uuid;
  v_pnl numeric(12,2);
  v_member_share numeric(12,2);
  v_owner_share numeric(12,2);
  v_referrer_id uuid;
  v_referrer_raw_share numeric(12,2);  -- původně vypočítaný podíl refera (před carry-forward úpravou)
  v_referrer_actual numeric(12,2);     -- co reálně tekne do refer ledgeru
  v_referrer_balance numeric(12,2);
  v_owner_extra numeric(12,2);         -- kolik si majitel "vezme" navíc kvůli oddlužení refera
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_group from public.payout_groups where id = p_group_id;
  if not found then
    raise exception 'group_not_found';
  end if;
  if v_group.owner_id <> v_uid then
    raise exception 'not_owner';
  end if;

  -- Vytvoříme období
  insert into public.payout_periods (group_id, label, closed_by, notes)
  values (p_group_id, p_label, v_uid, p_notes)
  returning id into v_period_id;

  -- Projdeme všechny zadané entries
  for v_entry in select * from jsonb_array_elements(p_entries)
  loop
    v_member_id := (v_entry->>'member_id')::uuid;
    v_pnl := (v_entry->>'pnl')::numeric(12,2);

    -- Ověření, že member patří do téhle skupiny
    select referrer_member_id into v_referrer_id
    from public.payout_group_members
    where id = v_member_id and group_id = p_group_id;
    if not found then
      raise exception 'member_not_in_group: %', v_member_id;
    end if;

    -- Výpočet base split
    if v_pnl >= 0 then
      v_member_share := v_pnl * v_group.profit_split_member / 100;
      v_owner_share := v_pnl * v_group.profit_split_owner / 100;
    else
      v_member_share := v_pnl * v_group.loss_split_member / 100;
      v_owner_share := v_pnl * v_group.loss_split_owner / 100;
    end if;

    -- Refer logika (jen pokud má refera A skupina má referrer_share_pct > 0)
    v_referrer_raw_share := 0;
    v_referrer_actual := 0;
    v_owner_extra := 0;

    if v_referrer_id is not null and v_group.referrer_share_pct > 0 then
      -- Surový podíl refera = owner_share * pct
      -- (kladný při profitu, záporný při ztrátě)
      v_referrer_raw_share := v_owner_share * v_group.referrer_share_pct / 100;

      if v_pnl < 0 then
        -- Ztráta: refer dostane záporný zápis do balance, ALE majitel platí celých 50%
        -- (refer "půjčí" majiteli, který to v budoucnu inkasuje)
        v_referrer_actual := v_referrer_raw_share;  -- záporné číslo
        -- v_owner_share zůstává beze změny (majitel platí plnou ztrátu)
      else
        -- Profit: nejdřív zkontrolujeme refer balance
        select coalesce(sum(amount), 0) into v_referrer_balance
        from public.payout_referrer_ledger
        where referrer_member_id = v_referrer_id and group_id = p_group_id;

        if v_referrer_balance < 0 then
          -- Refer má dluh - jeho podíl jde nejdřív na umoření dluhu (tj. majiteli)
          if v_referrer_raw_share <= -v_referrer_balance then
            -- Celý podíl jde na splacení dluhu
            v_referrer_actual := v_referrer_raw_share;  -- celý se připíše do ledgeru (sníží dluh)
            v_owner_extra := v_referrer_raw_share;       -- tu samou částku majitel reálně inkasuje
          else
            -- Část jde na dluh, zbytek referovi
            v_owner_extra := -v_referrer_balance;        -- majitel inkasuje jen do nuly dluhu
            v_referrer_actual := v_referrer_raw_share;  -- celé se připíše referovi
            -- (z toho -v_referrer_balance umoří dluh, zbytek je nový kladný balance)
          end if;
        else
          -- Refer nemá dluh, celý podíl jde jemu
          v_referrer_actual := v_referrer_raw_share;
          v_owner_extra := 0;
        end if;

        -- Snížíme owner_share o to, co reálně dostal refer (raw_share),
        -- a přidáme zpět v_owner_extra, které majitel inkasuje navíc kvůli oddlužení
        v_owner_share := v_owner_share - v_referrer_raw_share + v_owner_extra;
      end if;
    end if;

    -- Uložení entry
    insert into public.payout_period_entries (
      period_id, member_id, member_pnl, member_share, owner_share,
      referrer_member_id, referrer_share
    ) values (
      v_period_id, v_member_id, v_pnl, v_member_share, v_owner_share,
      v_referrer_id, v_referrer_actual
    );

    -- Zápis do refer ledgeru (pokud něco)
    if v_referrer_id is not null and v_referrer_actual <> 0 then
      insert into public.payout_referrer_ledger (
        group_id, referrer_member_id, amount, kind, period_id, created_by
      ) values (
        p_group_id, v_referrer_id, v_referrer_actual, 'period', v_period_id, v_uid
      );
    end if;
  end loop;

  return v_period_id;
end;
$$;

revoke all on function public.close_payout_period(uuid, text, text, jsonb) from public;
grant execute on function public.close_payout_period(uuid, text, text, jsonb) to authenticated;

-- =====================================================================
-- 7) FUNKCE: výběr refer balance
-- =====================================================================
create or replace function public.withdraw_referrer_balance(
  p_group_id uuid,
  p_referrer_member_id uuid
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner_id uuid;
  v_referrer_user_id uuid;
  v_balance numeric(12,2);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Owner skupiny nebo sám refer (pokud je linked) můžou výběr provést
  select g.owner_id, m.user_id
    into v_owner_id, v_referrer_user_id
  from public.payout_groups g
  join public.payout_group_members m on m.group_id = g.id
  where g.id = p_group_id and m.id = p_referrer_member_id;

  if not found then
    raise exception 'not_found';
  end if;
  if v_uid <> v_owner_id and v_uid <> coalesce(v_referrer_user_id, '00000000-0000-0000-0000-000000000000'::uuid) then
    raise exception 'not_authorized';
  end if;

  select coalesce(sum(amount), 0) into v_balance
  from public.payout_referrer_ledger
  where referrer_member_id = p_referrer_member_id and group_id = p_group_id;

  if v_balance <= 0 then
    raise exception 'nothing_to_withdraw';
  end if;

  insert into public.payout_referrer_ledger (
    group_id, referrer_member_id, amount, kind, created_by
  ) values (
    p_group_id, p_referrer_member_id, -v_balance, 'withdrawal', v_uid
  );

  return v_balance;
end;
$$;

revoke all on function public.withdraw_referrer_balance(uuid, uuid) from public;
grant execute on function public.withdraw_referrer_balance(uuid, uuid) to authenticated;

-- =====================================================================
-- 8) RLS POLITIKY
-- =====================================================================
alter table public.payout_groups enable row level security;
alter table public.payout_group_members enable row level security;
alter table public.payout_periods enable row level security;
alter table public.payout_period_entries enable row level security;
alter table public.payout_referrer_ledger enable row level security;

-- payout_groups: owner vidí a edituje své skupiny, member vidí skupiny kde je členem
drop policy if exists payout_groups_owner_all on public.payout_groups;
create policy payout_groups_owner_all on public.payout_groups
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists payout_groups_member_select on public.payout_groups;
create policy payout_groups_member_select on public.payout_groups
  for select using (
    exists (
      select 1 from public.payout_group_members
      where group_id = payout_groups.id and user_id = auth.uid()
    )
  );

-- payout_group_members: owner full access, linked member vidí jen sebe
drop policy if exists payout_members_owner_all on public.payout_group_members;
create policy payout_members_owner_all on public.payout_group_members
  for all using (
    exists (select 1 from public.payout_groups g where g.id = group_id and g.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.payout_groups g where g.id = group_id and g.owner_id = auth.uid())
  );

drop policy if exists payout_members_self_select on public.payout_group_members;
create policy payout_members_self_select on public.payout_group_members
  for select using (user_id = auth.uid());

-- payout_periods: owner full access, member vidí období skupiny, kde je členem
drop policy if exists payout_periods_owner_all on public.payout_periods;
create policy payout_periods_owner_all on public.payout_periods
  for all using (
    exists (select 1 from public.payout_groups g where g.id = group_id and g.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.payout_groups g where g.id = group_id and g.owner_id = auth.uid())
  );

drop policy if exists payout_periods_member_select on public.payout_periods;
create policy payout_periods_member_select on public.payout_periods
  for select using (
    exists (
      select 1 from public.payout_group_members m
      where m.group_id = payout_periods.group_id and m.user_id = auth.uid()
    )
  );

-- payout_period_entries: owner full, linked member vidí jen své vlastní entries
drop policy if exists payout_entries_owner_all on public.payout_period_entries;
create policy payout_entries_owner_all on public.payout_period_entries
  for all using (
    exists (
      select 1 from public.payout_periods p
      join public.payout_groups g on g.id = p.group_id
      where p.id = period_id and g.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.payout_periods p
      join public.payout_groups g on g.id = p.group_id
      where p.id = period_id and g.owner_id = auth.uid()
    )
  );

drop policy if exists payout_entries_self_select on public.payout_period_entries;
create policy payout_entries_self_select on public.payout_period_entries
  for select using (
    exists (
      select 1 from public.payout_group_members m
      where m.id = member_id and m.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.payout_group_members m
      where m.id = referrer_member_id and m.user_id = auth.uid()
    )
  );

-- payout_referrer_ledger: owner full, linked refer vidí svoje
drop policy if exists payout_ledger_owner_all on public.payout_referrer_ledger;
create policy payout_ledger_owner_all on public.payout_referrer_ledger
  for all using (
    exists (select 1 from public.payout_groups g where g.id = group_id and g.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.payout_groups g where g.id = group_id and g.owner_id = auth.uid())
  );

drop policy if exists payout_ledger_self_select on public.payout_referrer_ledger;
create policy payout_ledger_self_select on public.payout_referrer_ledger
  for select using (
    exists (
      select 1 from public.payout_group_members m
      where m.id = referrer_member_id and m.user_id = auth.uid()
    )
  );
