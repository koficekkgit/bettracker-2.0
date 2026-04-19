-- Achievements live computation in SQL
-- Run in Supabase SQL Editor (Run without RLS)

-- Step 1: Function that replicates all 17 achievement checks from achievements.ts
CREATE OR REPLACE FUNCTION compute_achievements_count(uid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_total_bets       integer := 0;
  v_won_bets         integer := 0;
  v_settled_bets     integer := 0;
  v_total_profit     numeric := 0;
  v_win_rate         numeric := 0;
  v_underdog_wins    integer := 0;
  v_jackpot          boolean := false;
  v_longest_streak   integer := 0;
  v_cur_streak       integer := 0;
  v_month_streak     integer := 0;
  v_max_month_streak integer := 0;
  v_count            integer := 0;
  bet_row            record;
  month_row          record;
BEGIN
  -- Basic aggregates
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('won','half_won')),
    COUNT(*) FILTER (WHERE status NOT IN ('pending','void')),
    COALESCE(SUM(
      CASE
        WHEN payout IS NOT NULL  THEN payout - stake
        WHEN status = 'won'      THEN stake * odds - stake
        WHEN status = 'lost'     THEN -stake
        WHEN status = 'half_won' THEN (stake * odds - stake) / 2.0
        WHEN status = 'half_lost'THEN -stake / 2.0
        ELSE 0
      END
    ), 0)
  INTO v_total_bets, v_won_bets, v_settled_bets, v_total_profit
  FROM bets
  WHERE user_id = uid;

  -- Win rate
  IF v_settled_bets > 0 THEN
    v_win_rate := (v_won_bets::numeric / v_settled_bets) * 100.0;
  END IF;

  -- Underdog wins (odds >= 5)
  SELECT COUNT(*)
  INTO v_underdog_wins
  FROM bets
  WHERE user_id = uid
    AND status IN ('won','half_won')
    AND odds >= 5;

  -- Jackpot: single bet profit >= 10000
  SELECT EXISTS(
    SELECT 1 FROM bets
    WHERE user_id = uid
      AND (
        CASE
          WHEN payout IS NOT NULL  THEN payout - stake
          WHEN status = 'won'      THEN stake * odds - stake
          WHEN status = 'half_won' THEN (stake * odds - stake) / 2.0
          ELSE 0
        END
      ) >= 10000
  ) INTO v_jackpot;

  -- Longest win streak (chronological order)
  v_cur_streak     := 0;
  v_longest_streak := 0;
  FOR bet_row IN
    SELECT status
    FROM bets
    WHERE user_id = uid
      AND status NOT IN ('pending','void')
    ORDER BY placed_at ASC, created_at ASC
  LOOP
    IF bet_row.status = 'won' THEN
      v_cur_streak := v_cur_streak + 1;
      IF v_cur_streak > v_longest_streak THEN
        v_longest_streak := v_cur_streak;
      END IF;
    ELSE
      v_cur_streak := 0;
    END IF;
  END LOOP;

  -- Consistent: 3 profitable months in a row
  v_month_streak     := 0;
  v_max_month_streak := 0;
  FOR month_row IN
    SELECT
      to_char(placed_at, 'YYYY-MM') AS month,
      SUM(
        CASE
          WHEN payout IS NOT NULL  THEN payout - stake
          WHEN status = 'won'      THEN stake * odds - stake
          WHEN status = 'lost'     THEN -stake
          WHEN status = 'half_won' THEN (stake * odds - stake) / 2.0
          WHEN status = 'half_lost'THEN -stake / 2.0
          ELSE 0
        END
      ) AS profit
    FROM bets
    WHERE user_id = uid
    GROUP BY to_char(placed_at, 'YYYY-MM')
    ORDER BY month ASC
  LOOP
    IF month_row.profit > 0 THEN
      v_month_streak := v_month_streak + 1;
      IF v_month_streak > v_max_month_streak THEN
        v_max_month_streak := v_month_streak;
      END IF;
    ELSE
      v_month_streak := 0;
    END IF;
  END LOOP;

  -- Count achievements
  IF v_won_bets >= 1          THEN v_count := v_count + 1; END IF;
  IF v_longest_streak >= 3    THEN v_count := v_count + 1; END IF;
  IF v_longest_streak >= 5    THEN v_count := v_count + 1; END IF;
  IF v_longest_streak >= 10   THEN v_count := v_count + 1; END IF;
  IF v_longest_streak >= 20   THEN v_count := v_count + 1; END IF;
  IF v_total_bets >= 10       THEN v_count := v_count + 1; END IF;
  IF v_total_bets >= 100      THEN v_count := v_count + 1; END IF;
  IF v_total_bets >= 500      THEN v_count := v_count + 1; END IF;
  IF v_total_bets >= 1000     THEN v_count := v_count + 1; END IF;
  IF v_total_profit >= 1000   THEN v_count := v_count + 1; END IF;
  IF v_total_profit >= 5000   THEN v_count := v_count + 1; END IF;
  IF v_total_profit >= 10000  THEN v_count := v_count + 1; END IF;
  IF v_total_profit >= 50000  THEN v_count := v_count + 1; END IF;
  IF v_settled_bets >= 50 AND v_win_rate >= 60 THEN v_count := v_count + 1; END IF;
  IF v_underdog_wins >= 3     THEN v_count := v_count + 1; END IF;
  IF v_jackpot                THEN v_count := v_count + 1; END IF;
  IF v_max_month_streak >= 3  THEN v_count := v_count + 1; END IF;

  RETURN v_count;
END;
$func$;

-- Step 2: One-time batch update of all existing users
UPDATE profiles
SET achievements_count = compute_achievements_count(id);

-- Step 3: Keep sync_achievements_count RPC working for client-side updates
CREATE OR REPLACE FUNCTION sync_achievements_count(p_count integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $body$
BEGIN
  UPDATE profiles
  SET achievements_count = p_count
  WHERE id = auth.uid();
END;
$body$;

-- Step 4: Rebuild leaderboard_30d view with live achievement counts
DROP VIEW IF EXISTS leaderboard_30d;

CREATE VIEW leaderboard_30d AS
SELECT
  b.user_id,
  p.username,
  p.display_name,
  compute_achievements_count(b.user_id) AS achievements_count,
  COUNT(*) FILTER (WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')) AS settled_bets,
  COUNT(*) FILTER (WHERE b.status IN ('won','half_won')) AS won_bets,
  COALESCE(SUM(
    CASE
      WHEN b.payout IS NOT NULL THEN b.payout - b.stake
      WHEN b.status = 'won'       THEN b.stake * b.odds - b.stake
      WHEN b.status = 'half_won'  THEN b.stake / 2 * b.odds - b.stake / 2
      WHEN b.status = 'lost'      THEN -b.stake
      WHEN b.status = 'half_lost' THEN -(b.stake / 2)
      ELSE 0
    END
  ), 0) AS total_profit,
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
  END AS roi
FROM bets b
JOIN profiles p ON p.id = b.user_id
WHERE b.placed_at >= NOW() - INTERVAL '30 days'
  AND p.username IS NOT NULL
GROUP BY b.user_id, p.username, p.display_name
HAVING COUNT(*) FILTER (WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')) >= 3
ORDER BY total_profit DESC;
