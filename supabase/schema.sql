-- ============================================================
-- BetTracker v2 - Supabase Setup
-- Spusť celý tento skript v Supabase SQL Editoru jednou
-- ============================================================

-- Profily uživatelů (rozšíření auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  default_currency text not null default 'CZK',
  starting_bankroll numeric(12,2) not null default 0,
  preferred_language text not null default 'cs',
  theme text not null default 'dark',
  created_at timestamptz not null default now()
);

-- Kategorie (sporty / typy sázek - vlastní pro každého usera)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#3b82f6',
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

-- Sázky - hlavní tabulka
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Základní data
  placed_at date not null default current_date,
  description text not null,           -- "Sparta - Slavia" nebo "AKO 4 tipy"
  bet_type text not null default 'single', -- 'single' | 'accumulator'
  pick text,                            -- "1", "Over 2.5", "BTTS Yes" - může být null pro AKO
  
  -- Finance
  stake numeric(12,2) not null check (stake > 0),
  odds numeric(8,3) not null check (odds >= 1),
  currency text not null default 'CZK',
  
  -- Výsledek
  status text not null default 'pending' check (status in ('pending','won','lost','void','cashout','half_won','half_lost')),
  payout numeric(12,2),                 -- skutečná výplata (pro cashout/half win)
  
  -- Metadata
  bookmaker text,                       -- 'tipsport', 'fortuna', 'betano', 'chance', 'synot', 'kingsbet'
  category_id uuid references public.categories(id) on delete set null,
  tags text[] default '{}',
  notes text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexy pro rychlost
create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bets_placed_at on public.bets(placed_at desc);
create index if not exists idx_bets_status on public.bets(status);
create index if not exists idx_bets_category on public.bets(category_id);
create index if not exists idx_categories_user_id on public.categories(user_id);

-- ============================================================
-- Row Level Security - každý vidí jen svoje data
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.bets enable row level security;

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Categories
drop policy if exists "categories_all_own" on public.categories;
create policy "categories_all_own" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bets
drop policy if exists "bets_all_own" on public.bets;
create policy "bets_all_own" on public.bets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Trigger: vytvoř profile a default kategorie automaticky při registraci
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Trigger: updated_at se aktualizuje automaticky
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bets_updated_at on public.bets;
create trigger set_bets_updated_at
  before update on public.bets
  for each row execute procedure public.set_updated_at();
