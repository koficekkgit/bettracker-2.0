'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeaderboard } from '@/hooks/use-friends';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';

const RANK_ICONS = [
  { icon: Trophy, color: 'text-yellow-500' },
  { icon: Medal, color: 'text-gray-400' },
  { icon: Award, color: 'text-amber-600' },
];

export default function LeaderboardPage() {
  const t = useTranslations();
  const { data: rows = [], isLoading } = useLeaderboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          {t('leaderboard.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('leaderboard.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{t('leaderboard.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="text-left border-b border-border">
                    <th className="p-3 font-normal w-12">{t('leaderboard.rank')}</th>
                    <th className="p-3 font-normal">{t('leaderboard.player')}</th>
                    <th className="p-3 font-normal text-right">{t('leaderboard.bets')}</th>
                    <th className="p-3 font-normal text-right">{t('leaderboard.winRate')}</th>
                    <th className="p-3 font-normal text-right">{t('leaderboard.profit')}</th>
                    <th className="p-3 font-normal text-right">{t('leaderboard.roi')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const winRate = row.settled_bets > 0 ? (row.won_bets / row.settled_bets) * 100 : 0;
                    const rankInfo = RANK_ICONS[idx];
                    const Icon = rankInfo?.icon;
                    return (
                      <tr key={row.user_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {Icon ? (
                              <Icon className={cn('w-5 h-5', rankInfo.color)} />
                            ) : (
                              <span className="text-muted-foreground font-medium w-5 text-center">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {row.username ? (
                            <Link href={`/friends/${row.username}`} className="hover:underline">
                              <div className="font-medium">{row.display_name ?? row.username}</div>
                              <div className="text-xs text-muted-foreground">@{row.username}</div>
                            </Link>
                          ) : (
                            <div className="font-medium">{row.display_name ?? '—'}</div>
                          )}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{row.settled_bets}</td>
                        <td className="p-3 text-right">{formatNumber(winRate, 0)} %</td>
                        <td className={cn(
                          'p-3 text-right font-medium',
                          row.total_profit > 0 ? 'text-success' : row.total_profit < 0 ? 'text-danger' : 'text-muted-foreground'
                        )}>
                          {row.total_profit > 0 ? '+' : ''}
                          {formatCurrency(Number(row.total_profit), 'CZK')}
                        </td>
                        <td className={cn(
                          'p-3 text-right font-semibold',
                          row.roi > 0 ? 'text-success' : 'text-danger'
                        )}>
                          {row.roi > 0 ? '+' : ''}
                          {formatNumber(Number(row.roi), 1)} %
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                {t('leaderboard.minBets')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
