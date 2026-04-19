'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Trophy, Medal, Award, Star, Globe, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProGate } from '@/components/subscription/pro-gate';
import { useLeaderboard, useFriendsLeaderboard } from '@/hooks/use-friends';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import type { LeaderboardRow } from '@/lib/types';

const RANK_ICONS = [
  { icon: Trophy, color: 'text-yellow-500' },
  { icon: Medal,  color: 'text-gray-400' },
  { icon: Award,  color: 'text-amber-600' },
];

export default function LeaderboardPage() {
  return (
    <ProGate feature="Leaderboard">
      <LeaderboardContent />
    </ProGate>
  );
}

function LeaderboardContent() {
  const t = useTranslations();
  const [tab, setTab]       = useState<'global' | 'friends'>('global');
  const [sortBy, setSortBy] = useState<'profit' | 'roi'>('roi');

  const { data: globalRows  = [], isLoading: loadingGlobal  } = useLeaderboard();
  const { data: friendsRows = [], isLoading: loadingFriends } = useFriendsLeaderboard();

  const isFriendsTab = tab === 'friends';
  const isLoading    = isFriendsTab ? loadingFriends : loadingGlobal;
  const rawRows      = isFriendsTab ? friendsRows    : globalRows;

  // Global tab: sort always by ROI (profit hidden); Friends tab: user-chosen sort
  const sorted = [...rawRows].sort((a, b) =>
    (!isFriendsTab || sortBy === 'roi')
      ? Number(b.roi) - Number(a.roi)
      : Number(b.total_profit) - Number(a.total_profit)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {t('leaderboard.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFriendsTab ? t('leaderboard.subtitleFriends') : t('leaderboard.subtitleGlobal')}
          </p>
        </div>

        {/* Sort — only relevant in friends tab */}
        {isFriendsTab && (
          <div className="flex rounded-md border border-border overflow-hidden text-sm">
            <button
              onClick={() => setSortBy('profit')}
              className={`px-4 py-1.5 transition-colors ${sortBy === 'profit' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('leaderboard.profit')}
            </button>
            <button
              onClick={() => setSortBy('roi')}
              className={`px-4 py-1.5 border-l border-border transition-colors ${sortBy === 'roi' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('leaderboard.roi')}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-border overflow-hidden text-sm w-fit">
        <button
          onClick={() => setTab('global')}
          className={cn(
            'flex items-center gap-2 px-5 py-2 transition-colors',
            tab === 'global'
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Globe className="w-4 h-4" />
          {t('leaderboard.tabGlobal')}
        </button>
        <button
          onClick={() => setTab('friends')}
          className={cn(
            'flex items-center gap-2 px-5 py-2 border-l border-border transition-colors',
            tab === 'friends'
              ? 'bg-secondary text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Users className="w-4 h-4" />
          {t('leaderboard.tabFriends')}
        </button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : sorted.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">
              {isFriendsTab ? t('leaderboard.noFriendsData') : t('leaderboard.noData')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="text-left border-b border-border">
                    <th className="p-3 font-normal w-12">{t('leaderboard.rank')}</th>
                    <th className="p-3 font-normal">{t('leaderboard.player')}</th>
                    <th className="p-3 font-normal text-right">{t('leaderboard.bets')}</th>
                    <th className="p-3 font-normal text-right">{t('leaderboard.winRate')}</th>
                    {/* Profit — pouze v záložce Přátelé */}
                    {isFriendsTab && (
                      <th className="p-3 font-normal text-right">{t('leaderboard.profit')}</th>
                    )}
                    <th className="p-3 font-normal text-right">{t('leaderboard.roi')}</th>
                    <th className="p-3 font-normal text-right">Úspěchy</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, idx) => (
                    <LeaderboardRow
                      key={row.user_id}
                      row={row}
                      idx={idx}
                      showProfit={isFriendsTab}
                    />
                  ))}
                </tbody>
              </table>
              <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                {t('leaderboard.minBets')}
                {!isFriendsTab && (
                  <span className="ml-2 text-amber-500/80">· {t('leaderboard.profit')} {String.fromCodePoint(0x1F512)} skryt</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LeaderboardRow({
  row,
  idx,
  showProfit,
}: {
  row: LeaderboardRow;
  idx: number;
  showProfit: boolean;
}) {
  const winRate = row.settled_bets > 0 ? (row.won_bets / row.settled_bets) * 100 : 0;
  const rankInfo = RANK_ICONS[idx];
  const Icon = rankInfo?.icon;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-secondary/50">
      {/* Rank */}
      <td className="p-3">
        {Icon ? (
          <Icon className={cn('w-5 h-5', rankInfo.color)} />
        ) : (
          <span className="text-muted-foreground font-medium w-5 inline-block text-center">
            {idx + 1}
          </span>
        )}
      </td>

      {/* Player */}
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

      {/* Bets */}
      <td className="p-3 text-right text-muted-foreground">{row.settled_bets}</td>

      {/* Win rate */}
      <td className="p-3 text-right">{formatNumber(winRate, 0)} %</td>

      {/* Profit — only friends tab */}
      {showProfit && (
        <td className={cn(
          'p-3 text-right font-medium',
          row.total_profit > 0 ? 'text-success' : row.total_profit < 0 ? 'text-danger' : 'text-muted-foreground'
        )}>
          {row.total_profit > 0 ? '+' : ''}
          {formatCurrency(Number(row.total_profit), 'CZK')}
        </td>
      )}

      {/* ROI */}
      <td className={cn(
        'p-3 text-right font-semibold',
        row.roi > 0 ? 'text-success' : 'text-danger'
      )}>
        {row.roi > 0 ? '+' : ''}
        {formatNumber(Number(row.roi), 1)} %
      </td>

      {/* Achievements */}
      <td className="p-3 text-right">
        {row.achievements_count > 0 ? (
          <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-500" />
            {row.achievements_count}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
