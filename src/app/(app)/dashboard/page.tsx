'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stats/stat-card';
import { ProfitChart } from '@/components/stats/profit-chart';
import { StatusBadge } from '@/components/bets/status-badge';
import { BetFormDialog } from '@/components/bets/bet-form-dialog';
import { useBets } from '@/hooks/use-bets';
import { calculateStats, calculateProfitTimeline, calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const t = useTranslations();
  const { data: bets = [], isLoading } = useBets();
  const [formOpen, setFormOpen] = useState(false);

  const stats = useMemo(() => calculateStats(bets), [bets]);
  const timeline = useMemo(() => calculateProfitTimeline(bets), [bets]);
  const recent = useMemo(() => bets.slice(0, 5), [bets]);
  const currency = bets[0]?.currency ?? 'CZK';

  if (isLoading) {
    return <div className="text-muted-foreground">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('dashboard.addBet')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t('dashboard.profit')}
          value={formatCurrency(stats.totalProfit, currency)}
          hint={`${stats.totalBets} ${t('dashboard.totalBets').toLowerCase()}`}
          hintColor={stats.totalProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          label={t('dashboard.roi')}
          value={`${formatNumber(stats.roi, 1)} %`}
          hint={`${formatCurrency(stats.totalStaked, currency)} ${t('stats.totalStaked').toLowerCase()}`}
        />
        <StatCard
          label={t('dashboard.winRate')}
          value={`${formatNumber(stats.winRate, 0)} %`}
          hint={`${stats.wonBets} / ${stats.settledBets}`}
        />
        <StatCard
          label={t('dashboard.avgOdds')}
          value={formatNumber(stats.avgOdds, 2)}
          hint={t('dashboard.avgOdds')}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">{t('dashboard.recentBets')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('dashboard.noBets')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="text-left">
                    <th className="pb-2 font-normal">{t('bets.date')}</th>
                    <th className="pb-2 font-normal">{t('bets.description')}</th>
                    <th className="pb-2 font-normal text-right">{t('bets.odds')}</th>
                    <th className="pb-2 font-normal text-right">{t('bets.stake')}</th>
                    <th className="pb-2 font-normal">{t('bets.status')}</th>
                    <th className="pb-2 font-normal text-right">{t('dashboard.profit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((bet) => {
                    const profit = calculateBetProfit(bet);
                    return (
                      <tr key={bet.id} className="border-t border-border">
                        <td className="py-3">{formatDate(bet.placed_at)}</td>
                        <td className="py-3">
                          <div className="font-medium">{bet.description}</div>
                          {bet.pick && <div className="text-xs text-muted-foreground">{bet.pick}</div>}
                        </td>
                        <td className="py-3 text-right">{formatNumber(Number(bet.odds), 2)}</td>
                        <td className="py-3 text-right">{formatCurrency(Number(bet.stake), bet.currency)}</td>
                        <td className="py-3"><StatusBadge status={bet.status} /></td>
                        <td className={`py-3 text-right font-medium ${profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                          {profit > 0 ? '+' : ''}
                          {formatCurrency(profit, bet.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BetFormDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
