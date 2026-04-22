import type { AchievementContext } from './achievements';

const RARITY_COINS: Record<string, number> = {
  common:    50,
  rare:      150,
  epic:      300,
  legendary: 500,
};

// Must mirror ACHIEVEMENT_RARITY in badge-grid.tsx
const ACHIEVEMENT_RARITY: Record<string, string> = {
  first_win: 'common', first_bet: 'common', rookie_10: 'common',
  first_grand: 'common', in_the_green: 'common', profitable_month: 'common',
  hot_streak_3: 'rare', experienced_100: 'rare', five_k: 'rare',
  fifty_wins: 'rare', comeback_kid: 'rare', winrate_55: 'rare',
  on_fire_5: 'epic', win_streak_7: 'epic', veteran_500: 'epic',
  ten_k: 'epic', two_hundred_wins: 'epic', sharp_shooter: 'epic',
  underdog_lover: 'epic', high_roller: 'epic',
  unstoppable_10: 'legendary', legendary_20: 'legendary', master_1000: 'legendary',
  marathon: 'legendary', grinder: 'legendary', five_hundred_wins: 'legendary',
  fifty_k: 'legendary', hundred_k: 'legendary', two_hundred_k: 'legendary',
  jackpot: 'legendary', big_jackpot: 'legendary', consistent: 'legendary',
  consistent_5: 'legendary', underdog_10: 'legendary', high_roller_5: 'legendary',
};

const COINS_PER_BET = 2;
const COINS_PER_WIN = 5;

export function calculateTotalEarned(
  ctx: AchievementContext,
  earnedIds: Set<string>,
): number {
  let total = 0;

  for (const id of earnedIds) {
    const rarity = ACHIEVEMENT_RARITY[id] ?? 'common';
    total += RARITY_COINS[rarity] ?? 50;
  }

  total += ctx.totalBets * COINS_PER_BET;
  total += ctx.wonBets.length * COINS_PER_WIN;

  return total;
}
