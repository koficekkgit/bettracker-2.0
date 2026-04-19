-- Groups feature migration
-- Run in Supabase SQL Editor (Run without RLS)

-- Tables
CREATE TABLE IF NOT EXISTS public.groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  invite_code text        UNIQUE NOT NULL,
  created_by  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'member',
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON public.group_members(user_id);

ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_auth"   ON public.groups;
DROP POLICY IF EXISTS "groups_update_owner"  ON public.groups;
DROP POLICY IF EXISTS "groups_delete_owner"  ON public.groups;

CREATE POLICY "groups_select_member" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
CREATE POLICY "groups_insert_auth" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert" ON public.group_members;
DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;

CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );
CREATE POLICY "group_members_insert" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM public.groups WHERE created_by = auth.uid())
  );

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $f1$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text := '';
  i     int;
BEGIN
  FOR i IN 1..4 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  code := code || '-';
  FOR i IN 1..4 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$f1$;

CREATE OR REPLACE FUNCTION create_group(p_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $f2$
DECLARE
  v_user_id  uuid;
  v_code     text;
  v_group_id uuid;
  v_attempts int := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  LOOP
    v_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RETURN json_build_object('success', false, 'error', 'code_collision');
    END IF;
  END LOOP;
  INSERT INTO public.groups (name, invite_code, created_by)
  VALUES (trim(p_name), v_code, v_user_id)
  RETURNING id INTO v_group_id;
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'owner');
  RETURN json_build_object('success', true, 'group_id', v_group_id, 'invite_code', v_code);
END;
$f2$;

CREATE OR REPLACE FUNCTION join_group_by_code(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $f3$
DECLARE
  v_group   public.groups%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  SELECT * INTO v_group FROM public.groups WHERE invite_code = upper(trim(p_code));
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invalid_code');
  END IF;
  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = v_group.id AND user_id = v_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'already_member');
  END IF;
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group.id, v_user_id, 'member');
  RETURN json_build_object('success', true, 'group_id', v_group.id, 'group_name', v_group.name);
END;
$f3$;

CREATE OR REPLACE FUNCTION get_my_groups()
RETURNS TABLE (
  id           uuid,
  name         text,
  invite_code  text,
  created_by   uuid,
  created_at   timestamptz,
  role         text,
  member_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $f4$
BEGIN
  RETURN QUERY
  SELECT
    g.id, g.name, g.invite_code, g.created_by, g.created_at,
    gm.role,
    (SELECT COUNT(*) FROM public.group_members WHERE group_id = g.id)::bigint
  FROM public.groups g
  JOIN public.group_members gm ON gm.group_id = g.id AND gm.user_id = auth.uid()
  ORDER BY g.created_at DESC;
END;
$f4$;

CREATE OR REPLACE FUNCTION get_group_members(p_group_id uuid)
RETURNS TABLE (
  user_id      uuid,
  username     text,
  display_name text,
  role         text,
  joined_at    timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $f5$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_member';
  END IF;
  RETURN QUERY
  SELECT p.id, p.username, p.display_name, gm.role, gm.joined_at
  FROM public.group_members gm
  JOIN public.profiles p ON p.id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY gm.role DESC, gm.joined_at ASC;
END;
$f5$;

CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id uuid)
RETURNS TABLE (
  user_id            uuid,
  username           text,
  display_name       text,
  achievements_count integer,
  settled_bets       bigint,
  won_bets           bigint,
  total_profit       numeric,
  roi                numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $f6$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_member';
  END IF;
  RETURN QUERY
  SELECT
    b.user_id,
    p.username,
    p.display_name,
    compute_achievements_count(b.user_id),
    COUNT(*) FILTER (WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost'))::bigint,
    COUNT(*) FILTER (WHERE b.status IN ('won','half_won'))::bigint,
    COALESCE(SUM(
      CASE
        WHEN b.payout IS NOT NULL THEN b.payout - b.stake
        WHEN b.status = 'won'       THEN b.stake * b.odds - b.stake
        WHEN b.status = 'half_won'  THEN b.stake / 2 * b.odds - b.stake / 2
        WHEN b.status = 'lost'      THEN -b.stake
        WHEN b.status = 'half_lost' THEN -(b.stake / 2)
        ELSE 0
      END
    ), 0),
    CASE
      WHEN SUM(b.stake) > 0 THEN ROUND(
        COALESCE(SUM(
          CASE
            WHEN b.payout IS NOT NULL THEN b.payout - b.stake
            WHEN b.status = 'won'       THEN b.stake * b.odds - b.stake
            WHEN b.status = 'half_won'  THEN b.stake / 2 * b.odds - b.stake / 2
            WHEN b.status = 'lost'      THEN -b.stake
            WHEN b.status = 'half_lost' THEN -(b.stake / 2)
            ELSE 0
          END
        ), 0) / SUM(b.stake) * 100, 2)
      ELSE 0
    END
  FROM public.bets b
  JOIN public.profiles p ON p.id = b.user_id
  WHERE b.placed_at >= NOW() - INTERVAL '30 days'
    AND p.username IS NOT NULL
    AND b.user_id IN (
      SELECT user_id FROM public.group_members WHERE group_id = p_group_id
    )
  GROUP BY b.user_id, p.username, p.display_name
  HAVING COUNT(*) FILTER (WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')) >= 1
  ORDER BY total_profit DESC;
END;
$f6$;

CREATE OR REPLACE FUNCTION kick_group_member(p_group_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $f7$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_kick_self';
  END IF;
  DELETE FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$f7$;

GRANT EXECUTE ON FUNCTION create_group(text)           TO authenticated;
GRANT EXECUTE ON FUNCTION join_group_by_code(text)     TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_groups()              TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_members(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_leaderboard(uuid)  TO authenticated;
GRANT EXECUTE ON FUNCTION kick_group_member(uuid,uuid) TO authenticated;
