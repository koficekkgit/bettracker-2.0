'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stats/stat-card';
import { PeriodSelector } from '@/components/stats/period-selector';
import { ProfitChart } from '@/components/stats/profit-chart';
import { useBets, useCategories } from '@/hooks/use-bets';
import { useProfile } from '@/hooks/use-profile';
import {
  calculateStats,
  calculateBetProfit,
  calculateProfitTimeline,
  calculateBetTimeline,
  filterBetsByRange,
  type DateRangePreset,
  type CustomRange,
} from '@/lib/stats';
import { formatCurrency, formatNumber, BOOKMAKERS } from '@/lib/utils';
import { InsightsPanel } from '@/components/stats/insights-panel';
import { BetHeatmap } from '@/components/stats/bet-heatmap';
import { useCountUp } from '@/hooks/use-count-up';
import { EmptyState } from '@/components/ui/empty-state';
import { GitCompare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

function makeDefaultCustomRange() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monthAgo), to: fmt(today) };
}

// Helper: compute delta label + direction between two numeric values
function delta(current: number, compare: number, higherIsBetter = true): { label: string; positive: boolean | null } {
  if (compare === 0 && current === 0) return { label: '—', positive: null };
  const diff = current - compare;
  if (Math.abs(diff) < 0.005) return { label: '≈', positive: null };
  const sign = diff > 0 ? '+' : '';
  const positive = diff > 0 ? higherIsBetter : !higherIsBetter;
  return { label: `${sign}${formatNumber(diff, 1)}`, positive };
}
function deltaPercent(current: number, compare: number, higherIsBetter = true): { label: string; positive: boolean | null } {
  if (compare === 0 && current === 0) return { label: '—', positive: null };
  const diff = current - compare;
  if (Math.abs(diff) < 0.005) return { label: '≈', positive: null };
  const sign = diff > 0 ? '+' : '';
  const positive = diff > 0 ? higherIsBetter : !higherIsBetter;
  return { label: `${sign}${formatNumber(diff, 1)}%`, positive };
}

export default function StatsPage() {
  const t = useTranslations();
  const { data: allBets = [], isLoading } = useBets();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();

  // Primary period
  const [period, setPeriod]           = useState<DateRangePreset>('last30days');
  const [chartMode, setChartMode]     = useState<'cumulative' | 'bet-by-bet'>('cumulative');
  const [customRange, setCustomRange] = useState<CustomRange>(makeDefaultCustomRange);

  // Compare mode
  const [compareMode, setCompareMode]               = useState(false);
  const [comparePeriod, setComparePeriod]           = useState<DateRangePreset>('last30days');
  const [compareCustomRange, setCompareCustomRange] = useState<CustomRange>(makeDefaultCustomRange);

  const bets = useMemo(
    () => filterBetsByRange(allBets, period, customRange),
    [allBets, period, customRange],
  );
  const compareBets = useMemo(
    () => compareMode ? filterBetsByRange(allBets, comparePeriod, compareCustomRange) : [],
    [allBets, compareMode, comparePeriod, compareCustomRange],
  );

  const stats        = useMemo(() => calculateStats(bets), [bets]);
  const compareStats = useMemo(() => calculateStats(compareBets), [compareBets]);
  const timeline     = useMemo(() => calculateProfitTimeline(bets), [bets]);
  const betTimeline  = useMemo(() => calculateBetTimeline(bets), [bets]);
  const currency     = profile?.default_currency ?? bets[0]?.currency ?? allBets[0]?.currency ?? 'CZK';

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; count: number }>();
    for (const bet of bets) {
      const cat = categories.find((c) => c.id === bet.category_id);
      const key = cat?.id ?? 'none';
      const cur = map.get(key) ?? { name: cat?.name ?? '—', profit: 0, count: 0 };
      cur.profit += calculateBetProfit(bet);
      cur.count++;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [bets, categories]);

  const byBookmaker = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; count: number }>();
    for (const bet of bets) {
      const bm = BOOKMAKERS.find((b) => b.id === bet.bookmaker);
      const key = bm?.id ?? 'none';
      const cur = map.get(key) ?? { name: bm?.name ?? '—', profit: 0, count: 0 };
      cur.profit += calculateBetProfit(bet);
      cur.count++;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [bets]);

  const byTag = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; count: number }>();
    for (const bet of bets) {
      for (const tag of (bet.tags ?? [])) {
        const cur = map.get(tag) ?? { name: `#${tag}`, profit: 0, count: 0 };
        cur.profit += calculateBetProfit(bet);
        cur.count++;
        map.set(tag, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [bets]);

  const animStaked  = useCountUp(stats.totalStaked,  900,   0);
  const animProfit  = useCountUp(stats.totalProfit,  900,  80);
  const animRoi     = useCountUp(stats.roi,           900, 160);
  const animWinRate = useCountUp(stats.winRate,       900, 240);
  const animBestWin = useCountUp(stats.bestWin,       900, 320);
  const animWorst   = useCountUp(stats.worstLoss,     900, 400);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 w-32 bg-zinc-800 rounded-lg" />
          <div className="h-9 w-36 bg-zinc-800 rounded-lg" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-zinc-800/60 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800/50 rounded-xl" />
          ))}
        </div>
        <div className="h-56 bg-zinc-800/30 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-zinc-800/30 rounded-xl" />
          <div className="h-48 bg-zinc-800/30 rounded-xl" />
        </div>
      </div>
    );
  }

  const isEmpty = bets.length === 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">{t('stats.title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCompareMode((v) => !v)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all',
              compareMode
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary',
            )}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Porovnat
          </button>
          <a
            href="/recap"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-pink-500/30 bg-pink-500/8 text-pink-400 text-sm font-semibold hover:bg-pink-500/15 transition-colors flex-shrink-0"
          >
            <span>✨</span>
            Týdenní Recap
          </a>
        </div>
      </div>

      {/* Primary period selector */}
      <PeriodSelector
        value={period}
        onChange={setPeriod}
        custom={customRange}
        onCustomChange={setCustomRange}
      />

      {/* Compare period selector */}
      {compareMode && (
        <div className="flex items-start gap-3 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
          <div className="flex-1 space-y-2">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Srovnávané období</p>
            <PeriodSelector
              value={comparePeriod}
              onChange={setComparePeriod}
              custom={compareCustomRange}
              onCustomChange={setCompareCustomRange}
            />
          </div>
          <button
            onClick={() => setCompareMode(false)}
            className="mt-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isEmpty ? (
        <Card>
          <CardContent className="p-0">
            {allBets.length === 0 ? (
              <EmptyState
                icon="📊"
                title="Zatím žádná data"
                description="Přidej sázky na stránce Sázky a tady se začnou zobrazovat statistiky."
                action={
                  <a
                    href="/bets"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                  >
                    Přejít na sázky →
                  </a>
                }
              />
            ) : (
              <EmptyState
                icon="🔍"
                title="Žádná data pro toto období"
                description="Zkus jiný časový rozsah nebo přidej sázky v tomto období."
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label={t('stats.totalStaked')}
              value={formatCurrency(animStaked, currency)}
              hint={`${stats.totalBets} ${t('dashboard.totalBets').toLowerCase()}`}
              compareValue={compareMode ? `${formatCurrency(compareStats.totalStaked, currency)} · ${compareStats.totalBets} sázek` : undefined}
              compareDelta={compareMode ? delta(stats.totalStaked, compareStats.totalStaked) : undefined}
            />
            <StatCard
              label={t('dashboard.profit')}
              value={formatCurrency(animProfit, currency)}
              hintColor={stats.totalProfit >= 0 ? 'success' : 'danger'}
              compareValue={compareMode ? formatCurrency(compareStats.totalProfit, currency) : undefined}
              compareDelta={compareMode ? delta(stats.totalProfit, compareStats.totalProfit) : undefined}
            />
            <StatCard
              label={t('dashboard.roi')}
              value={`${formatNumber(animRoi, 1)} %`}
              hintColor={stats.roi >= 0 ? 'success' : 'danger'}
              compareValue={compareMode ? `${formatNumber(compareStats.roi, 1)} %` : undefined}
              compareDelta={compareMode ? deltaPercent(stats.roi, compareStats.roi) : undefined}
            />
            <StatCard
              label={t('dashboard.winRate')}
              value={`${formatNumber(animWinRate, 0)} %`}
              hint={`${stats.wonBets} / ${stats.settledBets}`}
              compareValue={compareMode ? `${formatNumber(compareStats.winRate, 0)} % · ${compareStats.wonBets}/${compareStats.settledBets}` : undefined}
              compareDelta={compareMode ? deltaPercent(stats.winRate, compareStats.winRate) : undefined}
            />
            <StatCard
              label={t('stats.bestWin')}
              value={formatCurrency(animBestWin, currency)}
              hintColor="success"
              compareValue={compareMode ? formatCurrency(compareStats.bestWin, currency) : undefined}
              compareDelta={compareMode ? delta(stats.bestWin, compareStats.bestWin) : undefined}
            />
            <StatCard
              label={t('stats.worstLoss')}
              value={formatCurrency(animWorst, currency)}
              hintColor="danger"
              compareValue={compareMode ? formatCurrency(compareStats.worstLoss, currency) : undefined}
              compareDelta={compareMode ? delta(stats.worstLoss, compareStats.worstLoss, false) : undefined}
            />
            <StatCard
              label={t('stats.longestWinStreak')}
              value={String(stats.longestWinStreak)}
              compareValue={compareMode ? String(compareStats.longestWinStreak) : undefined}
              compareDelta={compareMode ? delta(stats.longestWinStreak, compareStats.longestWinStreak) : undefined}
            />
            <StatCard
              label={t('stats.longestLossStreak')}
              value={String(stats.longestLossStreak)}
              compareValue={compareMode ? String(compareStats.longestLossStreak) : undefined}
              compareDelta={compareMode ? delta(stats.longestLossStreak, compareStats.longestLossStreak, false) : undefined}
            />
          </div>

          {compareMode && (
            <p className="text-xs text-muted-foreground text-center">
              Graf zobrazuje primární období · srovnávané hodnoty jsou v kartičkách níže
            </p>
          )}

          <BetHeatmap bets={allBets} currency={currency} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">{t('dashboard.profitChart')}</CardTitle>
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`px-3 py-1 transition-colors ${chartMode === 'cumulative' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Kumulativní
                </button>
                <button
                  onClick={() => setChartMode('bet-by-bet')}
                  className={`px-3 py-1 transition-colors border-l border-border ${chartMode === 'bet-by-bet' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Průběžný
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <ProfitChart
                data={chartMode === 'cumulative' ? timeline : betTimeline}
                currency={currency}
                mode={chartMode}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">{t('stats.byCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {byCategory.map((row) => (
                        <tr key={row.name} className="border-t border-border first:border-0">
                          <td className="py-2">{row.name}</td>
                          <td className="py-2 text-xs text-muted-foreground text-right">{row.count}×</td>
                          <td className={`py-2 text-right font-medium ${row.profit > 0 ? 'text-success' : row.profit < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                            {row.profit > 0 ? '+' : ''}{formatCurrency(row.profit, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">{t('stats.byBookmaker')}</CardTitle>
              </CardHeader>
              <CardContent>
                {byBookmaker.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {byBookmaker.map((row) => (
                        <tr key={row.name} className="border-t border-border first:border-0">
                          <td className="py-2">{row.name}</td>
                          <td className="py-2 text-xs text-muted-foreground text-right">{row.count}×</td>
                          <td className={`py-2 text-right font-medium ${row.profit > 0 ? 'text-success' : row.profit < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                            {row.profit > 0 ? '+' : ''}{formatCurrency(row.profit, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          {byTag.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">{t('stats.byTag')}</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <tbody>
                    {byTag.map((row) => (
                      <tr key={row.name} className="border-t border-border first:border-0">
                        <td className="py-2">{row.name}</td>
                        <td className="py-2 text-xs text-muted-foreground text-right">{row.count}×</td>
                        <td className={`py-2 text-right font-medium ${row.profit > 0 ? 'text-success' : row.profit < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                          {row.profit > 0 ? '+' : ''}{formatCurrency(row.profit, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <InsightsPanel bets={allBets} />
    </div>
  );
}
