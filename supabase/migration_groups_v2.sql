-- ============================================================
-- Groups fix v2 — simpler, pure SQL (LANGUAGE sql, no plpgsql)
-- Run in Supabase SQL Editor
-- Safe to re-run: uses DROP IF EXISTS + CREATE
-- ============================================================

-- Ensure achievements_count exists on profiles (may already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS achievements_count integer NOT NULL DEFAULT 0;

-- Ensure privacy columns exist (may already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_profit_to_friends boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_bets_to_friends boolean NOT NULL DEFAULT true;

-- ============================================================
-- Fix get_group_leaderboard
-- Changes vs original:
--   • LEFT JOIN from group_members (not INNER JOIN from bets)
--     → members with 0 bets in last 30 days now appear in the table
--   • Removed HAVING clause (no minimum bet count required)
--   • Removed compute_achievements_count() call (uses p.achievements_count)
--   • Removed p.username IS NOT NULL filter
--   • Pure SQL (no plpgsql), simpler and no dollar-quoting issues
-- ============================================================
DROP FUNCTION IF EXISTS public.get_group_leaderboard(uuid);

CREATE FUNCTION public.get_group_leaderboard(p_group_id uuid)
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
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH
  -- All members of the group.
  -- Security: if auth.uid() is not a member, EXISTS returns false → members CTE is empty → result is empty.
  members AS (
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND EXISTS (
        SELECT 1
        FROM public.group_members me
        WHERE me.group_id = p_group_id
          AND me.user_id = auth.uid()
      )
  ),
  -- Aggregate bet stats per member for the last 30 days only
  stats AS (
    SELECT
      b.user_id,
      COUNT(*) FILTER (
        WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
      )::bigint AS settled,
      COUNT(*) FILTER (
        WHERE b.status IN ('won','half_won')
      )::bigint AS won,
      COALESCE(SUM(
        CASE
          WHEN b.payout IS NOT NULL   THEN b.payout - b.stake
          WHEN b.status = 'won'       THEN b.stake * b.odds - b.stake
          WHEN b.status = 'half_won'  THEN b.stake / 2.0 * b.odds - b.stake / 2.0
          WHEN b.status = 'lost'      THEN -b.stake
          WHEN b.status = 'half_lost' THEN -(b.stake / 2.0)
          ELSE 0
        END
      ), 0) AS profit,
      COALESCE(SUM(b.stake) FILTER (
        WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')
      ), 0) AS staked
    FROM public.bets b
    WHERE b.user_id IN (SELECT user_id FROM members)
      AND b.placed_at >= NOW() - INTERVAL '30 days'
    GROUP BY b.user_id
  )
  SELECT
    m.user_id,
    p.username,
    p.display_name,
    COALESCE(p.achievements_count, 0)::integer,
    COALESCE(s.settled, 0)::bigint,
    COALESCE(s.won,     0)::bigint,
    COALESCE(s.profit,  0)::numeric,
    CASE
      WHEN COALESCE(s.staked, 0) > 0
      THEN ROUND(COALESCE(s.profit, 0) / s.staked * 100, 2)::numeric
      ELSE 0::numeric
    END AS roi
  FROM members m
  JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN stats s ON s.user_id = m.user_id
  ORDER BY COALESCE(s.profit, 0) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(uuid) TO authenticated;
