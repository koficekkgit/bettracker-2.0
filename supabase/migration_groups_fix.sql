-- ============================================================
-- Groups fix + Privacy settings migration
-- Run in Supabase SQL Editor (Run without RLS)
-- ============================================================

-- ============================================================
-- 1. Add privacy columns to profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_profit_to_friends boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_bets_to_friends   boolean NOT NULL DEFAULT true;

-- ============================================================
-- 2. Rewrite get_group_leaderboard
--    FIXES:
--    - Was JOINing from bets (inner join) so members with 0 bets disappeared
--    - Called compute_achievements_count() which may not exist
--    - Required p.username IS NOT NULL (unnecessary)
--    - Had HAVING >= 1 which excluded new members
--    ADDS:
--    - Privacy: masks profit/roi for opted-out users (returns NULL)
--    - Always shows own stats regardless of privacy setting
-- ============================================================
DROP FUNCTION IF EXISTS get_group_leaderboard(uuid);

CREATE FUNCTION get_group_leaderboard(p_group_id uuid)
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
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = v_caller
  ) THEN
    RAISE EXCEPTION 'not_member';
  END IF;

  RETURN QUERY
  WITH member_stats AS (
    SELECT
      gm.user_id                                                AS ms_user_id,
      p.username                                                AS ms_username,
      p.display_name                                            AS ms_display_name,
      COALESCE(p.achievements_count, 0)::integer                AS ms_achievements,
      COALESCE(p.show_profit_to_friends, true)                  AS ms_show_profit,
      COALESCE(p.show_bets_to_friends,   true)                  AS ms_show_bets,
      COUNT(b.id) FILTER (
        WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
      )::bigint                                                 AS ms_settled,
      COUNT(b.id) FILTER (
        WHERE b.status IN ('won','half_won')
      )::bigint                                                 AS ms_won,
      COALESCE(SUM(
        CASE
          WHEN b.payout IS NOT NULL  THEN b.payout - b.stake
          WHEN b.status = 'won'      THEN b.stake * b.odds - b.stake
          WHEN b.status = 'half_won' THEN (b.stake / 2) * b.odds - (b.stake / 2)
          WHEN b.status = 'lost'     THEN -b.stake
          WHEN b.status = 'half_lost'THEN -(b.stake / 2)
          ELSE 0
        END
      ), 0)                                                     AS ms_profit,
      COALESCE(SUM(b.stake) FILTER (
        WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
      ), 0)                                                     AS ms_staked
    FROM public.group_members gm
    JOIN public.profiles p ON p.id = gm.user_id
    LEFT JOIN public.bets b
      ON b.user_id = gm.user_id
      AND b.placed_at >= NOW() - INTERVAL '30 days'
    WHERE gm.group_id = p_group_id
    GROUP BY
      gm.user_id, p.username, p.display_name, p.achievements_count,
      p.show_profit_to_friends, p.show_bets_to_friends
  )
  SELECT
    ms_user_id,
    ms_username,
    ms_display_name,
    ms_achievements,
    CASE WHEN ms_show_bets   OR ms_user_id = v_caller THEN ms_settled ELSE 0::bigint  END,
    CASE WHEN ms_show_bets   OR ms_user_id = v_caller THEN ms_won     ELSE 0::bigint  END,
    CASE WHEN ms_show_profit OR ms_user_id = v_caller THEN ms_profit  ELSE NULL::numeric END,
    CASE
      WHEN ms_show_profit OR ms_user_id = v_caller THEN
        CASE WHEN ms_staked > 0 THEN ROUND(ms_profit / ms_staked * 100, 2) ELSE 0 END
      ELSE NULL::numeric
    END
  FROM member_stats
  ORDER BY
    CASE WHEN ms_show_profit OR ms_user_id = v_caller THEN ms_profit ELSE -999999 END DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_group_leaderboard(uuid) TO authenticated;

-- ============================================================
-- 3. Rewrite get_friends_leaderboard
--    FIXES:
--    - Called compute_achievements_count() so use p.achievements_count
--    ADDS:
--    - Privacy: masks profit/bets for opted-out users (returns NULL)
--    - Always shows own stats
-- ============================================================
DROP FUNCTION IF EXISTS get_friends_leaderboard();

CREATE FUNCTION get_friends_leaderboard()
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
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      b.user_id                                                AS st_user_id,
      p.username                                               AS st_username,
      p.display_name                                           AS st_display_name,
      COALESCE(p.achievements_count, 0)::integer               AS st_achievements,
      COALESCE(p.show_profit_to_friends, true)                 AS st_show_profit,
      COALESCE(p.show_bets_to_friends,   true)                 AS st_show_bets,
      COUNT(*) FILTER (
        WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
      )::bigint                                                AS st_settled,
      COUNT(*) FILTER (
        WHERE b.status IN ('won','half_won')
      )::bigint                                                AS st_won,
      COALESCE(SUM(
        CASE
          WHEN b.payout IS NOT NULL  THEN b.payout - b.stake
          WHEN b.status = 'won'      THEN b.stake * b.odds - b.stake
          WHEN b.status = 'half_won' THEN b.stake / 2 * b.odds - b.stake / 2
          WHEN b.status = 'lost'     THEN -b.stake
          WHEN b.status = 'half_lost'THEN -(b.stake / 2)
          ELSE 0
        END
      ), 0)                                                    AS st_profit,
      COALESCE(SUM(b.stake) FILTER (
        WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
      ), 0)                                                    AS st_staked
    FROM bets b
    JOIN profiles p ON p.id = b.user_id
    WHERE b.placed_at >= NOW() - INTERVAL '30 days'
      AND p.username IS NOT NULL
      AND (
        b.user_id = v_caller
        OR b.user_id IN (
          SELECT CASE
            WHEN requester_id = v_caller THEN addressee_id
            ELSE requester_id
          END
          FROM friendships
          WHERE (requester_id = v_caller OR addressee_id = v_caller)
            AND status = 'accepted'
        )
      )
    GROUP BY
      b.user_id, p.username, p.display_name, p.achievements_count,
      p.show_profit_to_friends, p.show_bets_to_friends
    HAVING COUNT(*) FILTER (
      WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
    ) >= 1
  )
  SELECT
    st_user_id,
    st_username,
    st_display_name,
    st_achievements,
    CASE WHEN st_show_bets   OR st_user_id = v_caller THEN st_settled ELSE 0::bigint  END,
    CASE WHEN st_show_bets   OR st_user_id = v_caller THEN st_won     ELSE 0::bigint  END,
    CASE WHEN st_show_profit OR st_user_id = v_caller THEN st_profit  ELSE NULL::numeric END,
    CASE
      WHEN st_show_profit OR st_user_id = v_caller THEN
        CASE WHEN st_staked > 0 THEN ROUND(st_profit / st_staked * 100, 2) ELSE 0 END
      ELSE NULL::numeric
    END
  FROM stats
  ORDER BY
    CASE WHEN st_show_profit OR st_user_id = v_caller THEN st_profit ELSE -999999 END DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_friends_leaderboard() TO authenticated;
