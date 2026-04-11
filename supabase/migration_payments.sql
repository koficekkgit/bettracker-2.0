-- ============================================================
-- BetTracker v2 - Pending payments migration
-- Spusť v Supabase SQL Editoru
-- ============================================================

-- Tabulka pending_payments
-- Když uživatel vygeneruje QR kód, vytvoří se zde záznam.
-- Cron job pak kontroluje příchozí platby v bance a páruje je podle VS.

create table if not exists public.pending_payments (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  variable_symbol bigint not null unique,  -- ID je unikátní pro pairing
  plan text not null check (plan in ('monthly', 'quarterly', 'yearly', 'lifetime')),
  amount integer not null,                  -- v Kč (celé koruny)
  currency text not null default 'CZK',
  status text not null default 'pending' check (status in ('pending', 'matched', 'expired', 'cancelled')),
  matched_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists idx_pending_payments_user_id on public.pending_payments(user_id);
create index if not exists idx_pending_payments_status on public.pending_payments(status);
create index if not exists idx_pending_payments_vs on public.pending_payments(variable_symbol);

-- ============================================================
-- RLS
-- ============================================================
alter table public.pending_payments enable row level security;

-- Uživatel vidí jen své pending payments
drop policy if exists "pending_payments_select_own" on public.pending_payments;
create policy "pending_payments_select_own" on public.pending_payments
  for select using (auth.uid() = user_id);

-- Uživatel může vytvořit pending payment pro sebe
drop policy if exists "pending_payments_insert_own" on public.pending_payments;
create policy "pending_payments_insert_own" on public.pending_payments
  for insert with check (auth.uid() = user_id);

-- Uživatel může zrušit svou pending payment
drop policy if exists "pending_payments_update_own" on public.pending_payments;
create policy "pending_payments_update_own" on public.pending_payments
  for update using (auth.uid() = user_id);

-- Admin vidí všechny
drop policy if exists "pending_payments_select_admin" on public.pending_payments;
create policy "pending_payments_select_admin" on public.pending_payments
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- Sequence pro variabilní symboly
-- ============================================================
-- Začneme od 100000, ať to vypadá líp než od 1
create sequence if not exists public.payment_vs_seq start with 100000 increment by 1;

-- Helper funkce - vygeneruj nový VS
create or replace function public.next_payment_vs()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.payment_vs_seq');
$$;

grant execute on function public.next_payment_vs() to authenticated;
