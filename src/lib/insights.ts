import type { Bet } from '@/lib/types';
import { calculateBetProfit } from '@/lib/stats';

export type Breakdown = {
  label: string;
  bets: number;
  won: number;
  lost: number;
  staked: number;
  profit: number;
  roi: number;
  winRate: number;
};

export type Insight = {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  titleKey: string;
  params?: Record<string, string | number>;
};

function buildBreakdown(label: string, bets: Bet[]): Breakdown {
  const settled = bets.filter((b) => b.status !== 'pending');
  const won = settled.filter((b) => b.status === 'won' || b.status === 'half_won');
  const lost = settled.filter((b) => b.status === 'lost' || b.status === 'half_lost');
  const staked = settled.reduce((s, b) => s + Number(b.stake), 0);
  const profit = bets.reduce((s, b) => s + calculateBetProfit(b), 0);
  return {
    label,
    bets: bets.length,
    won: won.length,
    lost: lost.length,
    staked,
    profit,
    roi: staked > 0 ? (profit / staked) * 100 : 0,
    winRate: settled.length > 0 ? (won.length / settled.length) * 100 : 0,
  };
}

/** Rozpad podle kategorie (category_id → název) */
export function breakdownByCategory(
  bets: Bet[],
  categoryNames: Map<string, string>
): Breakdown[] {
  const groups = new Map<string, Bet[]>();
  for (const b of bets) {
    const key = b.category_id ?? 'none';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  return Array.from(groups.entries())
    .map(([catId, arr]) => {
      const label = catId === 'none' ? '—' : categoryNames.get(catId) ?? catId.slice(0, 8);
      return buildBreakdown(label, arr);
    })
    .sort((a, b) => b.roi - a.roi);
}

/** Rozpad podle sázkovky */
export function breakdownByBookmaker(bets: Bet[]): Breakdown[] {
  const groups = new Map<string, Bet[]>();
  for (const b of bets) {
    const key = b.bookmaker?.trim() || '—';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  return Array.from(groups.entries())
    .map(([bm, arr]) => buildBreakdown(bm, arr))
    .sort((a, b) => b.roi - a.roi);
}

/** Rozpad podle odds range */
export function breakdownByOddsRange(bets: Bet[]): Breakdown[] {
  const ranges: { label: string; min: number; max: number }[] = [
    { label: '1.00–1.50', min: 1, max: 1.5 },
    { label: '1.50–2.00', min: 1.5, max: 2 },
    { label: '2.00–3.00', min: 2, max: 3 },
    { label: '3.00–5.00', min: 3, max: 5 },
    { label: '5.00+', min: 5, max: Infinity },
  ];
  return ranges
    .map((r) => {
      const inRange = bets.filter((b) => {
        const o = Number(b.odds);
        return o >= r.min && o < r.max;
      });
      return buildBreakdown(r.label, inRange);
    })
    .filter((b) => b.bets > 0);
}

/** Rozpad podle dne v týdnu */
export function breakdownByWeekday(
  bets: Bet[],
  weekdayLabels: string[]  // ['Po','Út',...] délka 7, index 0=Po
): Breakdown[] {
  // getDay() vrací 0=Sun..6=Sat, my chceme 0=Mon..6=Sun
  const groups: Bet[][] = Array.from({ length: 7 }, () => []);
  for (const b of bets) {
    const d = new Date(b.placed_at);
    const idx = (d.getDay() + 6) % 7; // 0=Mon
    groups[idx].push(b);
  }
  return groups.map((arr, i) => buildBreakdown(weekdayLabels[i], arr)).filter((b) => b.bets > 0);
}

/** Automatické insight karty: najde zajímavé body v datech */
export function generateInsights(
  bets: Bet[],
  categoryNames: Map<string, string>
): Insight[] {
  const insights: Insight[] = [];
  const MIN_BETS = 10;  // minimální počet sázek pro smysluplný insight

  // 1. Nejlepší a nejhorší kategorie
  const byCat = breakdownByCategory(bets, categoryNames).filter((b) => b.bets >= MIN_BETS);
  if (byCat.length >= 2) {
    const best = byCat[0];
    const worst = byCat[byCat.length - 1];
    if (best.roi > 5) {
      insights.push({
        id: 'best_category',
        type: 'positive',
        titleKey: 'insights.bestCategory',
        params: { name: best.label, roi: best.roi.toFixed(1), count: best.bets },
      });
    }
    if (worst.roi < -5) {
      insights.push({
        id: 'worst_category',
        type: 'negative',
        titleKey: 'insights.worstCategory',
        params: { name: worst.label, roi: worst.roi.toFixed(1), count: worst.bets },
      });
    }
  }

  // 2. Nejlepší odds range
  const byRange = breakdownByOddsRange(bets).filter((b) => b.bets >= MIN_BETS);
  if (byRange.length > 0) {
    const bestRange = [...byRange].sort((a, b) => b.roi - a.roi)[0];
    if (bestRange.roi > 5) {
      insights.push({
        id: 'best_odds',
        type: 'positive',
        titleKey: 'insights.bestOdds',
        params: { range: bestRange.label, roi: bestRange.roi.toFixed(1) },
      });
    }
  }

  // 3. Nejlepší den v týdnu (pokud už je dost dat)
  const byDay = breakdownByWeekday(
    bets,
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  ).filter((b) => b.bets >= MIN_BETS);
  if (byDay.length >= 3) {
    const bestDay = [...byDay].sort((a, b) => b.winRate - a.winRate)[0];
    if (bestDay.winRate > 55) {
      insights.push({
        id: 'best_day',
        type: 'positive',
        titleKey: 'insights.bestDay',
        params: { day: bestDay.label, winRate: bestDay.winRate.toFixed(0) },
      });
    }
  }

  // 4. Nejlepší sázkovka
  const byBm = breakdownByBookmaker(bets).filter((b) => b.bets >= MIN_BETS);
  if (byBm.length >= 2) {
    const bestBm = byBm[0];
    if (bestBm.roi > 5) {
      insights.push({
        id: 'best_bookmaker',
        type: 'positive',
        titleKey: 'insights.bestBookmaker',
        params: { name: bestBm.label, roi: bestBm.roi.toFixed(1) },
      });
    }
  }

  return insights;
}
