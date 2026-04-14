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
  filterBetsByRange,
  type DateRangePreset,
  type CustomRange,
} from '@/lib/stats';
import { formatCurrency, formatNumber, BOOKMAKERS } from '@/lib/utils';
import { InsightsPanel } from '@/components/stats/insights-panel';

export default function StatsPage() {
  const t = useTranslations();
  const { data: allBets = [], isLoading } = useBets();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();

  const [period, setPeriod] = useState<DateRangePreset>('last30days');
  const [customRange, setCustomRange] = useState<CustomRange>(() => {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { from: fmt(monthAgo), to: fmt(today) };
  });

  const bets = useMemo(
    () => filterBetsByRange(allBets, period, customRange),
    [allBets, period, customRange]
  );
  const stats = useMemo(() => calculateStats(bets), [bets]);
  const timeline = useMemo(() => calculateProfitTimeline(bets), [bets]);
  const currency = profile?.default_currency ?? bets[0]?.currency ?? allBets[0]?.currency ?? 'CZK';

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; count: number }>();
    for (const bet of bets) {
      const cat = categories.find((c) => c.id === bet.category_id);
      const key = cat?.id ?? 'none';
      const name = cat?.name ?? '—';
      const cur = map.get(key) ?? { name, profit: 0, count: 0 };
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
      const name = bm?.name ?? '—';
      const cur = map.get(key) ?? { name, profit: 0, count: 0 };
      cur.profit += calculateBetProfit(bet);
      cur.count++;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [bets]);

  const byTag = useMemo(() => {
    const map = new Map<string, { name: string; profit: number; count: number }>();
    for (const bet of bets) {
      const tags = bet.tags ?? [];
      if (tags.length === 0) continue;
      for (const tag of tags) {
        const cur = map.get(tag) ?? { name: `#${tag}`, profit: 0, count: 0 };
        cur.profit += calculateBetProfit(bet);
        cur.count++;
        map.set(tag, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [bets]);

  if (isLoading) {
    return <div className="text-muted-foreground">{t('common.loading')}</div>;
  }

  const isEmpty = bets.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('stats.title')}</h1>
      </div>

      <PeriodSelector
        value={period}
        onChange={setPeriod}
        custom={customRange}
        onCustomChange={setCustomRange}
      />

      {isEmpty ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {t('stats.noDataPeriod')}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label={t('stats.totalStaked')}
              value={formatCurrency(stats.totalStaked, currency)}
              hint={`${stats.totalBets} ${t('dashboard.totalBets').toLowerCase()}`}
            />
            <StatCard
              label={t('dashboard.profit')}
              value={formatCurrency(stats.totalProfit, currency)}
              hintColor={stats.totalProfit >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              label={t('dashboard.roi')}
              value={`${formatNumber(stats.roi, 1)} %`}
              hintColor={stats.roi >= 0 ? 'success' : 'danger'}
            />
            <StatCard
              label={t('dashboard.winRate')}
              value={`${formatNumber(stats.winRate, 0)} %`}
              hint={`${stats.wonBets} / ${stats.settledBets}`}
            />
            <StatCard
              label={t('stats.bestWin')}
              value={formatCurrency(stats.bestWin, currency)}
              hintColor="success"
            />
            <StatCard
              label={t('stats.worstLoss')}
              value={formatCurrency(stats.worstLoss, currency)}
              hintColor="danger"
            />
            <StatCard
              label={t('stats.longestWinStreak')}
              value={String(stats.longestWinStreak)}
            />
            <StatCard
              label={t('stats.longestLossStreak')}
              value={String(stats.longestLossStreak)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">{t('dashboard.profitChart')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfitChart data={timeline} currency={currency} />
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
                            {row.profit > 0 ? '+' : ''}
                            {formatCurrency(row.profit, currency)}
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
                            {row.profit > 0 ? '+' : ''}
                            {formatCurrency(row.profit, currency)}
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
                          {row.profit > 0 ? '+' : ''}
                          {formatCurrency(row.profit, currency)}
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
