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

// Next reset times for countdown display
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

// ── Task definitions ────────────────────────────────────────

export const TASKS: TaskDef[] = [
  // ── Daily ──────────────────────────────────────────────────
  {
    id: 'd_first_bet',
    period: 'daily',
    emoji: '📋',
    name: 'První sázka dne',
    description: 'Přidej alespoň 1 sázku dnes',
    coins: 15,
    target: 1,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).length, 1),
  },
  {
    id: 'd_win',
    period: 'daily',
    emoji: '🏆',
    name: 'Denní výhra',
    description: 'Vyhraj alespoň 1 sázku dnes',
    coins: 25,
    target: 1,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).filter(isWon).length, 1),
  },
  {
    id: 'd_triple',
    period: 'daily',
    emoji: '🔥',
    name: 'Tripl',
    description: 'Přidej 3 sázky dnes',
    coins: 45,
    target: 3,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).length, 3),
  },
  {
    id: 'd_double_win',
    period: 'daily',
    emoji: '⚡',
    name: 'Dvojitá výhra',
    description: 'Vyhraj 2 sázky dnes',
    coins: 50,
    target: 2,
    getProgress: (bets, key) => Math.min(betsInDay(bets, key).filter(isWon).length, 2),
  },

  // ── Weekly ─────────────────────────────────────────────────
  {
    id: 'w_five_bets',
    period: 'weekly',
    emoji: '📊',
    name: 'Aktivní týden',
    description: 'Přidej 5 sázek tento týden',
    coins: 80,
    target: 5,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).length, 5),
  },
  {
    id: 'w_three_wins',
    period: 'weekly',
    emoji: '🎯',
    name: 'Týdenní střelec',
    description: 'Vyhraj 3 sázky tento týden',
    coins: 100,
    target: 3,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).filter(isWon).length, 3),
  },
  {
    id: 'w_ten_bets',
    period: 'weekly',
    emoji: '💪',
    name: 'Grind týden',
    description: 'Přidej 10 sázek tento týden',
    coins: 150,
    target: 10,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).length, 10),
  },
  {
    id: 'w_five_wins',
    period: 'weekly',
    emoji: '👑',
    name: 'Týdenní král',
    description: 'Vyhraj 5 sázek tento týden',
    coins: 130,
    target: 5,
    getProgress: (bets, key) => Math.min(betsInWeek(bets, key).filter(isWon).length, 5),
  },
];

export const DAILY_TASKS  = TASKS.filter((t) => t.period === 'daily');
export const WEEKLY_TASKS = TASKS.filter((t) => t.period === 'weekly');
