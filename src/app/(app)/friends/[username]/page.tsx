'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/stats/stat-card';
import { ProfitChart } from '@/components/stats/profit-chart';
import { StatusBadge } from '@/components/bets/status-badge';
import { useFriendBets, useFriendProfileByUsername } from '@/hooks/use-friends';
import { calculateStats, calculateProfitTimeline, calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

export default function FriendDashboardPage() {
  const t = useTranslations();
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data: profile, isLoading: loadingProfile } = useFriendProfileByUsername(username);
  const { data: bets = [], isLoading: loadingBets } = useFriendBets(profile?.id ?? '');

  const stats = useMemo(() => calculateStats(bets), [bets]);
  const timeline = useMemo(() => calculateProfitTimeline(bets), [bets]);
  const recent = useMemo(() => bets.slice(0, 10), [bets]);
  const currency = profile?.default_currency ?? bets[0]?.currency ?? 'CZK';

  if (loadingProfile) {
    return <div className="text-muted-foreground">{t('common.loading')}</div>;
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Link href="/friends">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
            {t('friends.backToFriends')}
          </Button>
        </Link>
        <p className="text-muted-foreground">{t('friends.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/friends">
            <Button variant="ghost" size="sm" className="mb-2 -ml-3">
              <ArrowLeft className="w-4 h-4" />
              {t('friends.backToFriends')}
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">{profile.display_name ?? profile.username}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('friends.viewingFriend')} · @{profile.username}
          </p>
        </div>
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
          hint={`${formatCurrency(stats.totalStaked, currency)}`}
        />
        <StatCard
          label={t('dashboard.winRate')}
          value={`${formatNumber(stats.winRate, 0)} %`}
          hint={`${stats.wonBets} / ${stats.settledBets}`}
        />
        <StatCard
          label={t('dashboard.avgOdds')}
          value={formatNumber(stats.avgOdds, 2)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('dashboard.profitChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBets ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
          ) : (
            <ProfitChart data={timeline} currency={currency} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
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
    </div>
  );
}
