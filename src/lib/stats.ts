import type { Bet } from './types';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'thisYear'
  | 'all'
  | 'custom';

export interface CustomRange {
  from: string;
  to: string;
}

/**
 * Vrátí začátek a konec rozsahu pro daný preset (obě hraniční hodnoty inclusive, ve formátu YYYY-MM-DD).
 * null = bez omezení.
 */
export function getDateRange(preset: DateRangePreset, custom?: CustomRange): { from: string | null; to: string | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case 'last7days': {
      const f = new Date(today);
      f.setDate(f.getDate() - 6);
      return { from: fmt(f), to: fmt(today) };
    }
    case 'last30days': {
      const f = new Date(today);
      f.setDate(f.getDate() - 29);
      return { from: fmt(f), to: fmt(today) };
    }
    case 'last90days': {
      const f = new Date(today);
      f.setDate(f.getDate() - 89);
      return { from: fmt(f), to: fmt(today) };
    }
    case 'thisMonth': {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(f), to: fmt(today) };
    }
    case 'thisYear': {
      const f = new Date(now.getFullYear(), 0, 1);
      return { from: fmt(f), to: fmt(today) };
    }
    case 'custom':
      return { from: custom?.from ?? null, to: custom?.to ?? null };
    case 'all':
    default:
      return { from: null, to: null };
  }
}

export function filterBetsByRange(bets: Bet[], preset: DateRangePreset, custom?: CustomRange): Bet[] {
  const { from, to } = getDateRange(preset, custom);
  if (!from && !to) return bets;
  return bets.filter((b) => {
    if (from && b.placed_at < from) return false;
    if (to && b.placed_at > to) return false;
    return true;
  });
}

export interface BetStats {
  totalBets: number;
  settledBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  totalStaked: number;
  totalProfit: number;
  roi: number;          // % - profit / staked
  yield: number;        // alias pro ROI
  winRate: number;      // % wins / settled
  avgOdds: number;      // prostý průměr kurzu všech sázek (vyhodnocených i pendingů)
  longestWinStreak: number;
  longestLossStreak: number;
  bestWin: number;
  worstLoss: number;
}

/**
 * Vypočítá zisk/ztrátu jedné sázky.
 * Pokud je payout vyplněný (cashout, half_won), použije se ten.
 */
export function calculateBetProfit(bet: Bet): number {
  if (bet.payout !== null && bet.payout !== undefined) {
    return Number(bet.payout) - Number(bet.stake);
  }

  const stake = Number(bet.stake);
  const odds = Number(bet.odds);

  switch (bet.status) {
    case 'won':
      return stake * odds - stake;
    case 'lost':
      return -stake;
    case 'half_won':
      return (stake * odds - stake) / 2;
    case 'half_lost':
      return -stake / 2;
    case 'void':
    case 'pending':
    default:
      return 0;
  }
}

export function calculateStats(bets: Bet[]): BetStats {
  const settled = bets.filter((b) => b.status !== 'pending');
  const won = settled.filter((b) => b.status === 'won' || b.status === 'half_won');
  const lost = settled.filter((b) => b.status === 'lost' || b.status === 'half_lost');
  const pending = bets.filter((b) => b.status === 'pending');

  const totalStaked = settled.reduce((sum, b) => sum + Number(b.stake), 0);
  const profits = bets.map(calculateBetProfit);
  const totalProfit = profits.reduce((sum, p) => sum + p, 0);

  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;
  const avgOdds = bets.length > 0 ? bets.reduce((s, b) => s + Number(b.odds), 0) / bets.length : 0;

  // Streaks
  const sortedSettled = [...settled].sort(
    (a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()
  );
  let curWin = 0, curLoss = 0, maxWin = 0, maxLoss = 0;
  for (const bet of sortedSettled) {
    if (bet.status === 'won') {
      curWin++;
      curLoss = 0;
      maxWin = Math.max(maxWin, curWin);
    } else if (bet.status === 'lost') {
      curLoss++;
      curWin = 0;
      maxLoss = Math.max(maxLoss, curLoss);
    }
  }

  const bestWin = Math.max(0, ...profits);
  const worstLoss = Math.min(0, ...profits);

  return {
    totalBets: bets.length,
    settledBets: settled.length,
    wonBets: won.length,
    lostBets: lost.length,
    pendingBets: pending.length,
    totalStaked,
    totalProfit,
    roi,
    yield: roi,
    winRate,
    avgOdds,
    longestWinStreak: maxWin,
    longestLossStreak: maxLoss,
    bestWin,
    worstLoss,
  };
}

/**
 * Vrátí kumulativní profit v čase pro graf.
 */
export function calculateProfitTimeline(bets: Bet[]): { date: string; profit: number }[] {
  const settled = [...bets]
    .filter((b) => b.status !== 'pending')
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());

  // Aggregate profit by calendar day (YYYY-MM-DD)
  const byDay = new Map<string, number>();
  for (const bet of settled) {
    const day = bet.placed_at.slice(0, 10); // "YYYY-MM-DD"
    byDay.set(day, (byDay.get(day) ?? 0) + calculateBetProfit(bet));
  }

  // Build cumulative timeline, one point per day
  let cumulative = 0;
  return Array.from(byDay.entries()).map(([day, dayProfit]) => {
    cumulative += dayProfit;
    return {
      date: day,
      profit: Math.round(cumulative * 100) / 100,
    };
  });
}

// Bet-by-bet cumulative timeline (one point per settled bet, preserves timestamp)
export function calculateBetTimeline(bets: Bet[]): { ts: string; profit: number }[] {
  const settled = [...bets]
    .filter((b) => b.status !== 'pending')
    .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());

  let cumulative = 0;
  return settled.map((bet) => {
    cumulative += calculateBetProfit(bet);
    return {
      ts: bet.placed_at, // full ISO timestamp
      profit: Math.round(cumulative * 100) / 100,
    };
  });
}
