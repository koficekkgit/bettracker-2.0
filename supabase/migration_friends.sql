-- ============================================================
-- BetTracker v2 - Friends & Leaderboard migration
-- Spusť tento skript v Supabase SQL Editoru POTÉ co máš základní schema.sql
-- ============================================================

-- ============================================================
-- 1. Tabulka friendships
-- ============================================================
-- Reprezentuje vztah mezi dvěma uživateli.
-- requester = kdo poslal žádost, addressee = komu přišla
-- Status: pending (čeká), accepted (přijato)

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index if not exists idx_friendships_requester on public.friendships(requester_id);
create index if not exists idx_friendships_addressee on public.friendships(addressee_id);

alter table public.friendships enable row level security;

-- Vidíš friendships kde figuruješ jako requester nebo addressee
drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Vytvořit žádost můžeš jen jako requester (sám sebe)
drop policy if exists "friendships_insert_own" on public.friendships;
create policy "friendships_insert_own" on public.friendships
  for insert with check (auth.uid() = requester_id);

-- Aktualizovat (přijmout) můžeš jen pokud jsi addressee
drop policy if exists "friendships_update_addressee" on public.friendships;
create policy "friendships_update_addressee" on public.friendships
  for update using (auth.uid() = addressee_id);

-- Smazat (odmítnout / odebrat z přátel) může kdokoliv ze dvou stran
drop policy if exists "friendships_delete_own" on public.friendships;
create policy "friendships_delete_own" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);


-- ============================================================
-- 2. Helper funkce - jsi přítel s daným userem?
-- ============================================================
-- Definer, aby šla volat z RLS policies bez nekonečné rekurze

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and (
        (requester_id = user_a and addressee_id = user_b) or
        (requester_id = user_b and addressee_id = user_a)
      )
  );
$$;


-- ============================================================
-- 3. Rozšíření RLS policies - přátelé vidí tvoje data
-- ============================================================

-- BETS: Můžeš číst svoje sázky NEBO sázky kamarádů
drop policy if exists "bets_select_own_or_friends" on public.bets;
drop policy if exists "bets_all_own" on public.bets;

create policy "bets_select_own_or_friends" on public.bets
  for select using (
    auth.uid() = user_id 
    or public.are_friends(auth.uid(), user_id)
  );

create policy "bets_insert_own" on public.bets
  for insert with check (auth.uid() = user_id);

create policy "bets_update_own" on public.bets
  for update using (auth.uid() = user_id);

create policy "bets_delete_own" on public.bets
  for delete using (auth.uid() = user_id);

-- CATEGORIES: Stejně - kamoši vidí kategorie pro správné zobrazení statistik
drop policy if exists "categories_all_own" on public.categories;
drop policy if exists "categories_select_own_or_friends" on public.categories;

create policy "categories_select_own_or_friends" on public.categories
  for select using (
    auth.uid() = user_id 
    or public.are_friends(auth.uid(), user_id)
  );

create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);

create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- PROFILES: Profil je viditelný pro všechny přihlášené (kvůli vyhledávání podle username)
-- Citlivá data jako starting_bankroll necháme jen pro vlastníka
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_all_authenticated" on public.profiles;

create policy "profiles_select_all_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');


-- ============================================================
-- 4. View pro leaderboard
-- ============================================================
-- Top hráči podle profitu za posledních 30 dní
-- Počítáno ve view, aby šlo snadno seřadit a stránkovat

create or replace view public.leaderboard_30d as
select
  p.id as user_id,
  p.username,
  p.display_name,
  count(b.id) as total_bets,
  count(b.id) filter (where b.status in ('won', 'half_won')) as won_bets,
  count(b.id) filter (where b.status not in ('pending')) as settled_bets,
  coalesce(sum(b.stake) filter (where b.status not in ('pending')), 0) as total_staked,
  coalesce(sum(
    case
      when b.payout is not null then b.payout - b.stake
      when b.status = 'won' then b.stake * b.odds - b.stake
      when b.status = 'lost' then -b.stake
      when b.status = 'half_won' then (b.stake * b.odds - b.stake) / 2
      when b.status = 'half_lost' then -b.stake / 2
      else 0
    end
  ), 0) as total_profit,
  case
    when coalesce(sum(b.stake) filter (where b.status not in ('pending')), 0) > 0
    then (
      sum(
        case
          when b.payout is not null then b.payout - b.stake
          when b.status = 'won' then b.stake * b.odds - b.stake
          when b.status = 'lost' then -b.stake
          when b.status = 'half_won' then (b.stake * b.odds - b.stake) / 2
          when b.status = 'half_lost' then -b.stake / 2
          else 0
        end
      ) / sum(b.stake) filter (where b.status not in ('pending'))
    ) * 100
    else 0
  end as roi
from public.profiles p
left join public.bets b 
  on b.user_id = p.id 
  and b.placed_at >= current_date - interval '30 days'
group by p.id, p.username, p.display_name
having count(b.id) filter (where b.status not in ('pending')) >= 5
order by roi desc;

-- View dědí RLS z podkladových tabulek, takže respektuje policies
grant select on public.leaderboard_30d to authenticated;
