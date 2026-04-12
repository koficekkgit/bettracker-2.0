-- Migrace: username login
-- Spustit v Supabase SQL Editoru

-- 1) Case-insensitive unique index na username
-- (sloupec profiles.username už ve schématu existuje, jen se nepoužíval)
drop index if exists profiles_username_key;
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

-- 2) CHECK constraint na formát: 3-20 znaků, alfanumerika + _ . -
alter table public.profiles
  drop constraint if exists profiles_username_format_chk;
alter table public.profiles
  add constraint profiles_username_format_chk
  check (username is null or username ~ '^[a-zA-Z0-9_.\-]{3,20}$');

-- 3) Funkce: vrátí email pro dané username (pro login flow)
-- SECURITY DEFINER protože anonymní klient nemá přístup k auth.users
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  if p_username is null or length(p_username) < 3 then
    return null;
  end if;

  select id into v_user_id
  from public.profiles
  where lower(username) = lower(p_username)
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id
  limit 1;

  return v_email;
end;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- 4) Funkce: kontrola dostupnosti username (pro registraci a onboarding)
create or replace function public.is_username_available(p_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_username is null or p_username !~ '^[a-zA-Z0-9_.\-]{3,20}$' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username)
  );
end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- 5) Funkce: nastavení username pro přihlášeného usera (onboarding)
-- Tahle běží jako volající uživatel, takže RLS na profiles to ochrání
create or replace function public.set_my_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_username is null or p_username !~ '^[a-zA-Z0-9_.\-]{3,20}$' then
    raise exception 'invalid_format';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(username) = lower(p_username) and id <> v_uid
  ) then
    raise exception 'username_taken';
  end if;

  update public.profiles
  set username = p_username
  where id = v_uid;
end;
$$;

revoke all on function public.set_my_username(text) from public;
grant execute on function public.set_my_username(text) to authenticated;
