-- Friends leaderboard RPC
-- Run AFTER migration_achievements_live.sql (needs compute_achievements_count)
-- Run without RLS in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_friends_leaderboard()
RETURNS TABLE (
  user_id           uuid,
  username          text,
  display_name      text,
  achievements_count integer,
  settled_bets      bigint,
  won_bets          bigint,
  total_profit      numeric,
  roi               numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
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
        ), 0) / SUM(b.stake) * 100
      , 2)
      ELSE 0
    END
  FROM bets b
  JOIN profiles p ON p.id = b.user_id
  WHERE b.placed_at >= NOW() - INTERVAL '30 days'
    AND p.username IS NOT NULL
    AND (
      b.user_id = auth.uid()
      OR b.user_id IN (
        SELECT CASE
          WHEN requester_id = auth.uid() THEN addressee_id
          ELSE requester_id
        END
        FROM friendships
        WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
          AND status = 'accepted'
      )
    )
  GROUP BY b.user_id, p.username, p.display_name
  HAVING COUNT(*) FILTER (WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')) >= 1
  ORDER BY total_profit DESC;
END;
$func$;
