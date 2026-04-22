import type { Bet } from './types';

export type TaskPeriod = 'daily' | 'weekly';

export interface TaskDef {
  id: string;
  period: TaskPeriod;
  emoji: string;
  name: string;
  description: string;
  coins: number;
  target: number;
  getProgress: (bets: Bet[], periodKey: string) => number;
}

// ── Period key helpers ──────────────────────────────────────

export function getDailyKey(date = new Date()): string {
  return 'd_' + date.toISOString().slice(0, 10);
}

export function getWeeklyKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return 'w_' + d.toISOString().slice(0, 10);
}

export function getPeriodKey(period: TaskPeriod): string {
  return period === 'daily' ? getDailyKey() : getWeeklyKey();
}

export function getNextDailyReset(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getNextWeeklyReset(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

// ── Bet filters ─────────────────────────────────────────────

function betsInDay(bets: Bet[], dayKey: string): Bet[] {
  const day = dayKey.replace('d_', '');
  return bets.filter((b) => b.placed_at.slice(0, 10) === day);
}

function betsInWeek(bets: Bet[], weekKey: string): Bet[] {
  const weekStart = new Date(weekKey.replace('w_', '') + 'T00:00:00');
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return bets.filter((b) => {
    const d = new Date(b.placed_at);
    return d >= weekStart && d < weekEnd;
  });
}

function isWon(b: Bet): boolean {
  return b.status === 'won' || b.status === 'half_won';
}

function isLost(b: Bet): boolean {
  return b.status === 'lost' || b.status === 'half_lost';
}

// ── Task definitions ────────────────────────────────────────

export const TASKS: TaskDef[] = [

  // ╔══════════════════════════════════════════════════════════╗
  // ║  DAILY                                                   ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'd_five_bets',
    period: 'daily',
    emoji: '📋',
    name: 'Denní dávka',
    description: 'Přidej 5 sázek dnes',
    coins: 40,
    target: 5,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).length, 5),
  },
  {
    id: 'd_three_wins',
    period: 'daily',
    emoji: '🏆',
    name: 'Hat-trick',
    description: 'Vyhraj 3 sázky dnes',
    coins: 55,
    target: 3,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).filter(isWon).length, 3),
  },
  {
    id: 'd_accumulator',
    period: 'daily',
    emoji: '🎰',
    name: 'Kombinátor',
    description: 'Přidej akumulátor dnes',
    coins: 35,
    target: 1,
    getProgress: (bets, key) =>
      Math.min(betsInDay(bets, key).filter((b) => b.bet_type === 'accumulator').length, 1),
  },
  {
    id: 'd_big_odds_win',
    period: 'daily',
    emoji: '💥',
    name: 'Risk taker',
    description: 'Vyhraj sázku s kurzem ≥ 2.5',
    coins: 50,
    target: 1,
    getProgress: (bets, key) =>
      Math.min(betsInDay(bets, key).filter((b) => isWon(b) && b.odds >= 2.5).length, 1),
  },
  {
    id: 'd_five_wins',
    period: 'daily',
    emoji: '⚡',
    name: 'Výherní série',
    description: 'Vyhraj 5 sázek dnes',
    coins: 80,
    target: 5,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).filter(isWon).length, 5),
  },
  {
    id: 'd_perfect_day',
    period: 'daily',
    emoji: '✨',
    name: 'Perfektní den',
    description: 'Přidej 3 sázky dnes a neprohraj ani jednu',
    coins: 70,
    target: 3,
    getProgress: (bets, key) => {
      const day = betsInDay(bets, key);
      // Any loss resets progress to 0
      if (day.some(isLost)) return 0;
      return Math.min(day.length, 3);
    },
  },
  {
    id: 'd_eight_bets',
    period: 'daily',
    emoji: '🔥',
    name: 'Denní grind',
    description: 'Přidej 8 sázek dnes',
    coins: 65,
    target: 8,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).length, 8),
  },
  {
    id: 'd_high_odds_trio',
    period: 'daily',
    emoji: '🎯',
    name: 'Vysoké kurzy',
    description: 'Přidej 3 sázky s kurzem ≥ 2.0 dnes',
    coins: 45,
    target: 3,
    getProgress: (bets, key) =>
      Math.min(betsInDay(bets, key).filter((b) => b.odds >= 2.0).length, 3),
  },
  {
    id: 'd_accumulator_win',
    period: 'daily',
    emoji: '🚀',
    name: 'Jackpot',
    description: 'Vyhraj akumulátor dnes',
    coins: 90,
    target: 1,
    getProgress: (bets, key) =>
      Math.min(betsInDay(bets, key).filter((b) => b.bet_type === 'accumulator' && isWon(b)).length, 1),
  },
  {
    id: 'd_seven_wins',
    period: 'daily',
    emoji: '👑',
    name: 'Denní král',
    description: 'Vyhraj 7 sázek dnes',
    coins: 110,
    target: 7,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).filter(isWon).length, 7),
  },

  // ╔══════════════════════════════════════════════════════════╗
  // ║  WEEKLY                                                  ║
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'w_fifteen_bets',
    period: 'weekly',
    emoji: '📊',
    name: 'Aktivní týden',
    description: 'Přidej 15 sázek tento týden',
    coins: 100,
    target: 15,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).length, 15),
  },
  {
    id: 'w_seven_wins',
    period: 'weekly',
    emoji: '🎯',
    name: 'Týdenní střelec',
    description: 'Vyhraj 7 sázek tento týden',
    coins: 140,
    target: 7,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).filter(isWon).length, 7),
  },
  {
    id: 'w_accumulator_wins',
    period: 'weekly',
    emoji: '🎰',
    name: 'Parlay master',
    description: 'Vyhraj 2 akumulátory tento týden',
    coins: 160,
    target: 2,
    getProgress: (bets, key) =>
      Math.min(betsInWeek(bets, key).filter((b) => b.bet_type === 'accumulator' && isWon(b)).length, 2),
  },
  {
    id: 'w_high_odds_wins',
    period: 'weekly',
    emoji: '💥',
    name: 'Kurzy nahoru',
    description: 'Vyhraj 5 sázek s kurzem ≥ 2.0 tento týden',
    coins: 170,
    target: 5,
    getProgress: (bets, key) =>
      Math.min(betsInWeek(bets, key).filter((b) => isWon(b) && b.odds >= 2.0).length, 5),
  },
  {
    id: 'w_twenty_five_bets',
    period: 'weekly',
    emoji: '💪',
    name: 'Grind týden',
    description: 'Přidej 25 sázek tento týden',
    coins: 200,
    target: 25,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).length, 25),
  },
  {
    id: 'w_ten_wins',
    period: 'weekly',
    emoji: '👑',
    name: 'Týdenní legenda',
    description: 'Vyhraj 10 sázek tento týden',
    coins: 190,
    target: 10,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).filter(isWon).length, 10),
  },
];

export const DAILY_TASKS  = TASKS.filter((t) => t.period === 'daily');
export const WEEKLY_TASKS = TASKS.filter((t) => t.period === 'weekly');
