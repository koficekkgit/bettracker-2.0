-- Oprava leaderboard_30d view — profit kalkulace stejná jako calculateBetProfit v stats.ts
-- Pokud je payout vyplněný, použije se payout - stake (cashout, half_won s payoutem atd.)

DROP VIEW IF EXISTS leaderboard_30d;

CREATE VIEW leaderboard_30d AS
SELECT
  b.user_id,
  p.username,
  p.display_name,
  p.achievements_count,
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
GROUP BY b.user_id, p.username, p.display_name, p.achievements_count
HAVING COUNT(*) FILTER (WHERE b.status IN ('won','lost','void','cashout','half_won','half_lost')) >= 3
ORDER BY total_profit DESC;
