-- ============================================================
-- BetTracker v2 - Subscriptions & License codes migration
-- Spusť tento skript v Supabase SQL Editoru
-- ============================================================

-- ============================================================
-- 1. Rozšíření profiles tabulky o subscription info
-- ============================================================

alter table public.profiles
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text default 'trial' check (subscription_status in ('trial', 'free', 'pro')),
  add column if not exists subscription_plan text check (subscription_plan in ('monthly', 'quarterly', 'yearly', 'lifetime')),
  add column if not exists subscription_until timestamptz,
  add column if not exists is_admin boolean default false;

-- Pro existující uživatele bez trialu nastav 7 dní zpět od teď + 7 dní (efektivně dáme 7 dní trial od dnes)
update public.profiles
  set trial_ends_at = now() + interval '7 days',
      subscription_status = 'trial'
  where trial_ends_at is null;

-- ============================================================
-- 2. Tabulka license codes
-- ============================================================

create table if not exists public.license_codes (
  code text primary key,
  plan text not null check (plan in ('monthly', 'quarterly', 'yearly', 'lifetime')),
  valid_for_days integer,  -- null = lifetime, jinak počet dní
  note text,               -- "Honza Novák, FB skupina, 999 Kč 11.4.2026"
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz
);

create index if not exists idx_license_codes_redeemed_by on public.license_codes(redeemed_by);

-- ============================================================
-- 3. RLS pro license_codes
-- ============================================================

alter table public.license_codes enable row level security;

-- Uživatel vidí jen kódy, které sám použil (pro zobrazení historie)
drop policy if exists "license_codes_select_own" on public.license_codes;
create policy "license_codes_select_own" on public.license_codes
  for select using (auth.uid() = redeemed_by);

-- Admin (is_admin = true) vidí všechny kódy
drop policy if exists "license_codes_select_admin" on public.license_codes;
create policy "license_codes_select_admin" on public.license_codes
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Jen admin může vytvářet kódy
drop policy if exists "license_codes_insert_admin" on public.license_codes;
create policy "license_codes_insert_admin" on public.license_codes
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Update kódu (při redemption) - jen pokud je nepoužitý a uživatel ho nyní redeemuje
-- Tohle se řeší přes RPC funkci níže, takže přes RLS dovolujeme update jen sobě
drop policy if exists "license_codes_update_self" on public.license_codes;
create policy "license_codes_update_self" on public.license_codes
  for update using (redeemed_by is null or redeemed_by = auth.uid());

-- Admin může mazat
drop policy if exists "license_codes_delete_admin" on public.license_codes;
create policy "license_codes_delete_admin" on public.license_codes
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ============================================================
-- 4. RPC funkce - redeem_license_code
-- ============================================================
-- Atomická operace: ověří kód, označí jako použitý, aktualizuje profil

create or replace function public.redeem_license_code(input_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_code license_codes%rowtype;
  v_new_until timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('success', false, 'error', 'not_authenticated');
  end if;

  -- Najdi kód
  select * into v_code from public.license_codes where code = upper(trim(input_code));
  if not found then
    return json_build_object('success', false, 'error', 'code_not_found');
  end if;

  -- Už použitý?
  if v_code.redeemed_by is not null then
    return json_build_object('success', false, 'error', 'code_already_used');
  end if;

  -- Spočítej nové datum platnosti
  -- Pokud má user už aktivní pro subscription, prodlužujeme od jejího konce, ne od teď
  if v_code.valid_for_days is null then
    v_new_until := null; -- lifetime
  else
    declare
      v_current_until timestamptz;
    begin
      select subscription_until into v_current_until
        from public.profiles where id = v_user_id;
      
      if v_current_until is not null and v_current_until > now() then
        v_new_until := v_current_until + (v_code.valid_for_days || ' days')::interval;
      else
        v_new_until := now() + (v_code.valid_for_days || ' days')::interval;
      end if;
    end;
  end if;

  -- Označ kód jako použitý
  update public.license_codes
    set redeemed_by = v_user_id,
        redeemed_at = now()
    where code = v_code.code;

  -- Aktualizuj profil uživatele
  update public.profiles
    set subscription_status = 'pro',
        subscription_plan = v_code.plan,
        subscription_until = v_new_until
    where id = v_user_id;

  return json_build_object(
    'success', true,
    'plan', v_code.plan,
    'valid_until', v_new_until
  );
end;
$$;

-- ============================================================
-- 5. Trigger - 7 denní trial pro nové uživatele
-- ============================================================
-- Aktualizujeme stávající trigger handle_new_user

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, trial_ends_at, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now() + interval '7 days',
    'trial'
  );
  
  -- Default kategorie
  insert into public.categories (user_id, name, color) values
    (new.id, 'Fotbal', '#22c55e'),
    (new.id, 'Hokej', '#3b82f6'),
    (new.id, 'Tenis', '#eab308'),
    (new.id, 'Basketbal', '#f97316');
  
  return new;
end;
$$;

-- Trigger už existuje z předchozí migrace, jen ho znovu definujeme pro jistotu
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 6. Funkce pro automatický downgrade po vypršení
-- ============================================================
-- Tahle funkce vrátí "skutečný" status pro uživatele - kontroluje datumy
-- Používáme ji ve frontendu, ale můžeme i v cron jobu pro hromadný update

create or replace function public.get_subscription_status(user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.subscription_status = 'pro' and (p.subscription_until is null or p.subscription_until > now())
      then 'pro'
    when p.trial_ends_at > now()
      then 'trial'
    else 'free'
  end
  from public.profiles p
  where p.id = user_id;
$$;
