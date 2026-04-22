import type { Bet } from '@/lib/types';
import { calculateBetProfit } from '@/lib/stats';

export type AchievementCategory = 'streaks' | 'volume' | 'profit' | 'skill';

export type Achievement = {
  id: string;
  category: AchievementCategory;
  icon: string;        // lucide icon name nebo emoji
  nameKey: string;     // i18n klíč
  descKey: string;     // i18n klíč popisu
  /** Vrátí true pokud user má tento achievement */
  check: (ctx: AchievementContext) => boolean;
  /** Pro progress bar: {current, target} — volitelné */
  progress?: (ctx: AchievementContext) => { current: number; target: number };
};

export type AchievementContext = {
  bets: Bet[];
  totalBets: number;
  wonBets: Bet[];
  lostBets: Bet[];
  totalProfit: number;
  winRate: number;
  longestWinStreak: number;
  currentWinStreak: number;
  currentLossStreak: number;
  bestWin: number;
  worstLoss: number;
  monthlyProfits: { month: string; profit: number }[];
};

/** Spočítá kontext z bets — volá se jednou, pak se používá ve všech checks */
export function buildAchievementContext(bets: Bet[]): AchievementContext {
  const settled = bets.filter((b) => b.status !== 'pending');
  const won = settled.filter((b) => b.status === 'won' || b.status === 'half_won');
  const lost = settled.filter((b) => b.status === 'lost' || b.status === 'half_lost');
  const profits = bets.map(calculateBetProfit);
  const totalProfit = profits.reduce((s, p) => s + p, 0);

  // Streaks — bets arrive DESC from DB, reverse to get chronological order
  // (avoids non-deterministic sort when placed_at timestamps are identical)
  const sortedSettled = [...settled].reverse();
  let curWin = 0, curLoss = 0, maxWin = 0;
  let finalCurWin = 0, finalCurLoss = 0;
  for (const bet of sortedSettled) {
    const isWin = bet.status === 'won' || bet.status === 'half_won';
    const isLoss = bet.status === 'lost' || bet.status === 'half_lost';
    if (isWin) {
      curWin++;
      curLoss = 0;
      if (curWin > maxWin) maxWin = curWin;
    } else if (isLoss) {
      curLoss++;
      curWin = 0;
    }
    // void/cashout doesn't break the streak
    finalCurWin = curWin;
    finalCurLoss = curLoss;
  }

  // Měsíční profity
  const byMonth = new Map<string, number>();
  for (let i = 0; i < bets.length; i++) {
    const b = bets[i];
    const d = new Date(b.placed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + profits[i]);
  }
  const monthlyProfits = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, profit]) => ({ month, profit }));

  return {
    bets,
    totalBets: bets.length,
    wonBets: won,
    lostBets: lost,
    totalProfit,
    winRate: settled.length > 0 ? (won.length / settled.length) * 100 : 0,
    longestWinStreak: maxWin,
    currentWinStreak: finalCurWin,
    currentLossStreak: finalCurLoss,
    bestWin: profits.length > 0 ? Math.max(...profits, 0) : 0,
    worstLoss: profits.length > 0 ? Math.min(...profits, 0) : 0,
    monthlyProfits,
  };
}

/** Všechna dostupná achievements */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== STREAKS =====
  {
    id: 'first_win',
    category: 'streaks',
    icon: 'Sparkles',
    nameKey: 'achievements.firstWin.name',
    descKey: 'achievements.firstWin.desc',
    check: (c) => c.wonBets.length >= 1,
    progress: (c) => ({ current: Math.min(c.wonBets.length, 1), target: 1 }),
  },
  {
    id: 'hot_streak_3',
    category: 'streaks',
    icon: 'Flame',
    nameKey: 'achievements.hotStreak3.name',
    descKey: 'achievements.hotStreak3.desc',
    check: (c) => c.longestWinStreak >= 3,
    progress: (c) => ({ current: Math.min(c.longestWinStreak, 3), target: 3 }),
  },
  {
    id: 'on_fire_5',
    category: 'streaks',
    icon: 'Flame',
    nameKey: 'achievements.onFire5.name',
    descKey: 'achievements.onFire5.desc',
    check: (c) => c.longestWinStreak >= 5,
    progress: (c) => ({ current: Math.min(c.longestWinStreak, 5), target: 5 }),
  },
  {
    id: 'unstoppable_10',
    category: 'streaks',
    icon: 'Zap',
    nameKey: 'achievements.unstoppable10.name',
    descKey: 'achievements.unstoppable10.desc',
    check: (c) => c.longestWinStreak >= 10,
    progress: (c) => ({ current: Math.min(c.longestWinStreak, 10), target: 10 }),
  },
  {
    id: 'legendary_20',
    category: 'streaks',
    icon: 'Crown',
    nameKey: 'achievements.legendary20.name',
    descKey: 'achievements.legendary20.desc',
    check: (c) => c.longestWinStreak >= 20,
    progress: (c) => ({ current: Math.min(c.longestWinStreak, 20), target: 20 }),
  },

  // ===== VOLUME =====
  {
    id: 'rookie_10',
    category: 'volume',
    icon: 'Dice5',
    nameKey: 'achievements.rookie10.name',
    descKey: 'achievements.rookie10.desc',
    check: (c) => c.totalBets >= 10,
    progress: (c) => ({ current: Math.min(c.totalBets, 10), target: 10 }),
  },
  {
    id: 'experienced_100',
    category: 'volume',
    icon: 'Target',
    nameKey: 'achievements.experienced100.name',
    descKey: 'achievements.experienced100.desc',
    check: (c) => c.totalBets >= 100,
    progress: (c) => ({ current: Math.min(c.totalBets, 100), target: 100 }),
  },
  {
    id: 'veteran_500',
    category: 'volume',
    icon: 'Medal',
    nameKey: 'achievements.veteran500.name',
    descKey: 'achievements.veteran500.desc',
    check: (c) => c.totalBets >= 500,
    progress: (c) => ({ current: Math.min(c.totalBets, 500), target: 500 }),
  },
  {
    id: 'master_1000',
    category: 'volume',
    icon: 'Trophy',
    nameKey: 'achievements.master1000.name',
    descKey: 'achievements.master1000.desc',
    check: (c) => c.totalBets >= 1000,
    progress: (c) => ({ current: Math.min(c.totalBets, 1000), target: 1000 }),
  },

  // ===== PROFIT =====
  {
    id: 'first_grand',
    category: 'profit',
    icon: 'Coins',
    nameKey: 'achievements.firstGrand.name',
    descKey: 'achievements.firstGrand.desc',
    check: (c) => c.totalProfit >= 1000,
    progress: (c) => ({ current: Math.max(0, Math.min(c.totalProfit, 1000)), target: 1000 }),
  },
  {
    id: 'five_k',
    category: 'profit',
    icon: 'Coins',
    nameKey: 'achievements.fiveK.name',
    descKey: 'achievements.fiveK.desc',
    check: (c) => c.totalProfit >= 5000,
    progress: (c) => ({ current: Math.max(0, Math.min(c.totalProfit, 5000)), target: 5000 }),
  },
  {
    id: 'ten_k',
    category: 'profit',
    icon: 'Banknote',
    nameKey: 'achievements.tenK.name',
    descKey: 'achievements.tenK.desc',
    check: (c) => c.totalProfit >= 10000,
    progress: (c) => ({ current: Math.max(0, Math.min(c.totalProfit, 10000)), target: 10000 }),
  },
  {
    id: 'fifty_k',
    category: 'profit',
    icon: 'Gem',
    nameKey: 'achievements.fiftyK.name',
    descKey: 'achievements.fiftyK.desc',
    check: (c) => c.totalProfit >= 50000,
    progress: (c) => ({ current: Math.max(0, Math.min(c.totalProfit, 50000)), target: 50000 }),
  },

  // ===== SKILL =====
  {
    id: 'sharp_shooter',
    category: 'skill',
    icon: 'Crosshair',
    nameKey: 'achievements.sharpShooter.name',
    descKey: 'achievements.sharpShooter.desc',
    check: (c) => {
      const settled = c.wonBets.length + c.lostBets.length;
      return settled >= 50 && c.winRate >= 60;
    },
  },
  {
    id: 'underdog_lover',
    category: 'skill',
    icon: 'Dice3',
    nameKey: 'achievements.underdogLover.name',
    descKey: 'achievements.underdogLover.desc',
    check: (c) => c.wonBets.filter((b) => Number(b.odds) >= 5).length >= 3,
    progress: (c) => ({
      current: Math.min(c.wonBets.filter((b) => Number(b.odds) >= 5).length, 3),
      target: 3,
    }),
  },
  {
    id: 'jackpot',
    category: 'skill',
    icon: 'Star',
    nameKey: 'achievements.jackpot.name',
    descKey: 'achievements.jackpot.desc',
    check: (c) => c.bestWin >= 10000,
    progress: (c) => ({ current: Math.min(c.bestWin, 10000), target: 10000 }),
  },
  {
    id: 'consistent',
    category: 'skill',
    icon: 'TrendingUp',
    nameKey: 'achievements.consistent.name',
    descKey: 'achievements.consistent.desc',
    check: (c) => {
      let streak = 0, max = 0;
      for (const m of c.monthlyProfits) {
        if (m.profit > 0) { streak++; if (streak > max) max = streak; }
        else streak = 0;
      }
      return max >= 3;
    },
  },
  {
    id: 'high_roller',
    category: 'skill',
    icon: 'Rocket',
    nameKey: 'achievements.highRoller.name',
    descKey: 'achievements.highRoller.desc',
    check: (c) => c.wonBets.filter((b) => Number(b.odds) >= 10).length >= 1,
    progress: (c) => ({
      current: Math.min(c.wonBets.filter((b) => Number(b.odds) >= 10).length, 1),
      target: 1,
    }),
  },
  {
    id: 'underdog_10',
    category: 'skill',
    icon: 'Dice5',
    nameKey: 'achievements.underdog10.name',
    descKey: 'achievements.underdog10.desc',
    check: (c) => c.wonBets.filter((b) => Number(b.odds) >= 5).length >= 10,
    progress: (c) => ({
      current: Math.min(c.wonBets.filter((b) => Number(b.odds) >= 5).length, 10),
      target: 10,
    }),
  },
  {
    id: 'consistent_5',
    category: 'skill',
    icon: 'BarChart3',
    nameKey: 'achievements.consistent5.name',
    descKey: 'achievements.consistent5.desc',
    check: (c) => {
      let streak = 0, max = 0;
      for (const m of c.monthlyProfits) {
        if (m.profit > 0) { streak++; if (streak > max) max = streak; }
        else streak = 0;
      }
      return max >= 5;
    },
  },

  // ===== VOLUME (extra) =====
  {
    id: 'first_bet',
    category: 'volume',
    icon: 'PlusCircle',
    nameKey: 'achievements.firstBet.name',
    descKey: 'achievements.firstBet.desc',
    check: (c) => c.totalBets >= 1,
    progress: (c) => ({ current: Math.min(c.totalBets, 1), target: 1 }),
  },
  {
    id: 'marathon',
    category: 'volume',
    icon: 'Infinity',
    nameKey: 'achievements.marathon.name',
    descKey: 'achievements.marathon.desc',
    check: (c) => c.totalBets >= 2000,
    progress: (c) => ({ current: Math.min(c.totalBets, 2000), target: 2000 }),
  },
  {
    id: 'grinder',
    category: 'volume',
    icon: 'Cpu',
    nameKey: 'achievements.grinder.name',
    descKey: 'achievements.grinder.desc',
    check: (c) => c.totalBets >= 5000,
    progress: (c) => ({ current: Math.min(c.totalBets, 5000), target: 5000 }),
  },
  {
    id: 'fifty_wins',
    category: 'volume',
    icon: 'CheckCheck',
    nameKey: 'achievements.fiftyWins.name',
    descKey: 'achievements.fiftyWins.desc',
    check: (c) => c.wonBets.length >= 50,
    progress: (c) => ({ current: Math.min(c.wonBets.length, 50), target: 50 }),
  },
  {
    id: 'two_hundred_wins',
    category: 'volume',
    icon: 'Award',
    nameKey: 'achievements.twoHundredWins.name',
    descKey: 'achievements.twoHundredWins.desc',
    check: (c) => c.wonBets.length >= 200,
    progress: (c) => ({ current: Math.min(c.wonBets.length, 200), target: 200 }),
  },
  {
    id: 'five_hundred_wins',
    category: 'volume',
    icon: 'BadgeCheck',
    nameKey: 'achievements.fiveHundredWins.name',
    descKey: 'achievements.fiveHundredWins.desc',
    check: (c) => c.wonBets.length >= 500,
    progress: (c) => ({ current: Math.min(c.wonBets.length, 500), target: 500 }),
  },

  // ===== PROFIT (extra) =====
  {
    id: 'in_the_green',
    category: 'profit',
    icon: 'TrendingUp',
    nameKey: 'achievements.inTheGreen.name',
    descKey: 'achievements.inTheGreen.desc',
    check: (c) => {
      const settled = c.wonBets.length + c.lostBets.length;
      return settled >= 10 && c.totalProfit > 0;
    },
  },
  {
    id: 'hundred_k',
    category: 'profit',
    icon: 'Crown',
    nameKey: 'achievements.hundredK.name',
    descKey: 'achievements.hundredK.desc',
    check: (c) => c.totalProfit >= 100000,
    progress: (c) => ({ current: Math.max(0, Math.min(c.totalProfit, 100000)), target: 100000 }),
  },
  {
    id: 'two_hundred_k',
    category: 'profit',
    icon: 'Gem',
    nameKey: 'achievements.twoHundredK.name',
    descKey: 'achievements.twoHundredK.desc',
    check: (c) => c.totalProfit >= 200000,
    progress: (c) => ({ current: Math.max(0, Math.min(c.totalProfit, 200000)), target: 200000 }),
  },

  // ===== STREAKS (extra) =====
  {
    id: 'win_streak_7',
    category: 'streaks',
    icon: 'Flame',
    nameKey: 'achievements.winStreak7.name',
    descKey: 'achievements.winStreak7.desc',
    check: (c) => c.longestWinStreak >= 7,
    progress: (c) => ({ current: Math.min(c.longestWinStreak, 7), target: 7 }),
  },
  {
    id: 'comeback_kid',
    category: 'streaks',
    icon: 'RefreshCw',
    nameKey: 'achievements.comebackKid.name',
    descKey: 'achievements.comebackKid.desc',
    check: (c) => {
      const settled = c.bets
        .filter((b) => b.status !== 'pending')
        .slice()
        .reverse();
      let lossStreak = 0;
      for (const b of settled) {
        const isLoss = b.status === 'lost' || b.status === 'half_lost';
        const isWin = b.status === 'won' || b.status === 'half_won';
        if (isLoss) { lossStreak++; }
        else if (isWin) { if (lossStreak >= 3) return true; lossStreak = 0; }
      }
      return false;
    },
  },

  // ===== SKILL (extra) =====
  {
    id: 'profitable_month',
    category: 'skill',
    icon: 'CalendarCheck',
    nameKey: 'achievements.profitableMonth.name',
    descKey: 'achievements.profitableMonth.desc',
    check: (c) => c.monthlyProfits.some((m) => m.profit > 0),
  },
  {
    id: 'winrate_55',
    category: 'skill',
    icon: 'Percent',
    nameKey: 'achievements.winrate55.name',
    descKey: 'achievements.winrate55.desc',
    check: (c) => {
      const settled = c.wonBets.length + c.lostBets.length;
      return settled >= 20 && c.winRate >= 55;
    },
  },
  {
    id: 'high_roller_5',
    category: 'skill',
    icon: 'Rocket',
    nameKey: 'achievements.highRoller5.name',
    descKey: 'achievements.highRoller5.desc',
    check: (c) => c.wonBets.filter((b) => Number(b.odds) >= 10).length >= 5,
    progress: (c) => ({
      current: Math.min(c.wonBets.filter((b) => Number(b.odds) >= 10).length, 5),
      target: 5,
    }),
  },
  {
    id: 'big_jackpot',
    category: 'skill',
    icon: 'Sparkles',
    nameKey: 'achievements.bigJackpot.name',
    descKey: 'achievements.bigJackpot.desc',
    check: (c) => c.bestWin >= 50000,
    progress: (c) => ({ current: Math.min(c.bestWin, 50000), target: 50000 }),
  },
];

/** Vrátí pole získaných achievement ID */
export function getEarnedAchievements(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id);
}

/** Level = počet získaných badges */
export function calculateLevel(earnedCount: number): number {
  // Prostý počet — user má "level X" pokud má X badges
  return earnedCount;
}
