-- ============================================================
-- BetTracker v2 - Referral system migration
-- Spusť v Supabase SQL Editoru
-- ============================================================

-- Referral kódy (každý user může mít jeden)
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_codes_owner on public.referral_codes(owner_id);
create index if not exists idx_referral_codes_code on public.referral_codes(code);

-- Záznamy o použití kódů
create table if not exists public.referral_uses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  owner_id uuid not null references auth.users(id),   -- kdo dostane odměnu
  used_by uuid not null references auth.users(id),    -- kdo kód použil
  plan text not null,
  original_amount integer not null,   -- cena bez slevy
  discount_amount integer not null,   -- kolik ušetřil kupující (10 %)
  reward_amount integer not null,     -- kolik dostane referrer (10 %)
  payment_id bigint references public.pending_payments(id),
  paid_out boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_uses_owner on public.referral_uses(owner_id);
create index if not exists idx_referral_uses_used_by on public.referral_uses(used_by);

-- Přidej referral_code + original_amount do pending_payments
alter table public.pending_payments
  add column if not exists referral_code text,
  add column if not exists original_amount integer;

-- ============================================================
-- RLS
-- ============================================================

alter table public.referral_codes enable row level security;
alter table public.referral_uses enable row level security;

-- Každý vidí všechny aktivní kódy (potřebujeme pro validaci při platbě)
drop policy if exists "referral_codes_select_all" on public.referral_codes;
create policy "referral_codes_select_all" on public.referral_codes
  for select using (true);

-- Každý může vložit jen svůj kód
drop policy if exists "referral_codes_insert_own" on public.referral_codes;
create policy "referral_codes_insert_own" on public.referral_codes
  for insert with check (auth.uid() = owner_id);

-- Update jen svého kódu
drop policy if exists "referral_codes_update_own" on public.referral_codes;
create policy "referral_codes_update_own" on public.referral_codes
  for update using (auth.uid() = owner_id);

-- Referral uses: user vidí svoje (jako owner i jako kupující)
drop policy if exists "referral_uses_select_own" on public.referral_uses;
create policy "referral_uses_select_own" on public.referral_uses
  for select using (auth.uid() = owner_id or auth.uid() = used_by);

-- Admin vidí vše
drop policy if exists "referral_uses_select_admin" on public.referral_uses;
create policy "referral_uses_select_admin" on public.referral_uses
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "referral_codes_select_admin" on public.referral_codes;
create policy "referral_codes_select_admin" on public.referral_codes
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- Helper funkce - validuj referral kód
-- ============================================================
create or replace function public.validate_referral_code(input_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code referral_codes%rowtype;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  select * into v_code
    from public.referral_codes
    where upper(trim(code)) = upper(trim(input_code))
      and is_active = true;

  if not found then
    return json_build_object('valid', false, 'error', 'invalid_code');
  end if;

  -- Nesmí použít vlastní kód
  if v_code.owner_id = v_user_id then
    return json_build_object('valid', false, 'error', 'own_code');
  end if;

  return json_build_object('valid', true, 'code', v_code.code, 'owner_id', v_code.owner_id);
end;
$$;

grant execute on function public.validate_referral_code(text) to authenticated;

-- ============================================================
-- Helper funkce - vytvoř referral kód pro usera (pokud ještě nemá)
-- ============================================================
create or replace function public.ensure_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_username text;
  v_code text;
  v_existing text;
begin
  v_user_id := auth.uid();

  -- Zkontroluj, zda už kód má
  select code into v_existing
    from public.referral_codes
    where owner_id = v_user_id
    limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  -- Vygeneruj kód z username
  select upper(regexp_replace(coalesce(username, split_part(id::text, '-', 1)), '[^a-zA-Z0-9]', '', 'g'))
    into v_username
    from public.profiles
    where id = v_user_id;

  v_code := left(v_username, 8);

  -- Pokud kód už existuje, přidej náhodné číslo
  if exists (select 1 from public.referral_codes where code = v_code) then
    v_code := v_code || floor(random() * 900 + 100)::text;
  end if;

  insert into public.referral_codes (code, owner_id)
    values (v_code, v_user_id);

  return v_code;
end;
$$;

grant execute on function public.ensure_referral_code() to authenticated;
