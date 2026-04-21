'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Users, Copy, Crown, Trophy, Medal, Award, Star,
  ArrowLeft, UserX, LogOut, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProGate } from '@/components/subscription/pro-gate';
import { useProfile } from '@/hooks/use-profile';
import {
  useMyGroups, useGroupLeaderboard, useGroupMembers,
  useKickMember, useLeaveGroup, useDeleteGroup,
} from '@/hooks/use-groups';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { toast } from 'sonner';

const RANK_ICONS = [
  { icon: Trophy, color: 'text-yellow-500' },
  { icon: Medal,  color: 'text-gray-400' },
  { icon: Award,  color: 'text-amber-600' },
];

function memberLabel(count: number, t: ReturnType<typeof useTranslations<'groups'>>) {
  if (count === 1) return `1 ${t('memberCount_one')}`;
  if (count < 5) return `${count} ${t('memberCount_few')}`;
  return `${count} ${t('memberCount_many')}`;
}

export default function GroupDetailPage() {
  return (
    <ProGate feature="groups">
      <GroupDetailContent />
    </ProGate>
  );
}

function GroupDetailContent() {
  const t = useTranslations('groups');
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { data: profile } = useProfile();
  const currency = profile?.default_currency ?? 'CZK';

  const { data: myGroups = [] } = useMyGroups();
  const group = myGroups.find((g) => g.id === groupId);

  const { data: leaderboard = [], isLoading: loadingLb, isError: errorLb } = useGroupLeaderboard(groupId);
  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(groupId);

  const kickMember = useKickMember();
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const [sortBy, setSortBy] = useState<'profit' | 'roi'>('profit');

  const isOwner = group?.role === 'owner';

  const sorted = [...leaderboard].sort((a, b) =>
    sortBy === 'roi'
      ? (b.roi ?? -Infinity) - (a.roi ?? -Infinity)
      : (b.total_profit ?? -Infinity) - (a.total_profit ?? -Infinity)
  );

  if (!group && myGroups.length > 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {t('notFound')}
        <br />
        <Link href="/groups" className="text-foreground underline mt-2 inline-block">
          {t('backToGroups')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/groups')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              {group?.name ?? '...'}
              {isOwner && <Crown className="w-4 h-4 text-amber-500" />}
            </h1>
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 font-mono"
              onClick={() => { navigator.clipboard.writeText(group?.invite_code ?? ''); toast.success(t('codeCopied')); }}
            >
              <Copy className="w-3 h-3" />
              {t('inviteCode')}: {group?.invite_code ?? '...'}
              <span className="text-[10px] normal-case font-sans">{t('inviteCodeHint')}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
              onClick={() => {
                if (confirm(t('deleteConfirm', { name: group?.name ?? '' }))) {
                  deleteGroup.mutate(groupId, { onSuccess: () => router.push('/groups') });
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> {t('delete')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
              onClick={() => {
                if (confirm(t('leaveConfirm', { name: group?.name ?? '' }))) {
                  leaveGroup.mutate(groupId, { onSuccess: () => router.push('/groups') });
                }
              }}
            >
              <LogOut className="w-4 h-4" /> {t('leave')}
            </Button>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          {memberLabel(members.length, t)} · {t('statsLast30')}
        </p>
        <div className="flex rounded-md border border-border overflow-hidden text-sm">
          <button
            onClick={() => setSortBy('profit')}
            className={`px-4 py-1.5 transition-colors ${sortBy === 'profit' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('sortProfit')}
          </button>
          <button
            onClick={() => setSortBy('roi')}
            className={`px-4 py-1.5 border-l border-border transition-colors ${sortBy === 'roi' ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('sortRoi')}
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardContent className="p-0">
          {loadingLb ? (
            <p className="p-8 text-center text-muted-foreground text-sm">{t('loadingLeaderboard')}</p>
          ) : errorLb ? (
            <p className="p-8 text-center text-destructive text-sm">{t('leaderboardError')}</p>
          ) : sorted.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-sm">{t('noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border text-xs text-muted-foreground">
                    <th className="p-3 font-normal w-10">#</th>
                    <th className="p-3 font-normal">{t('colPlayer')}</th>
                    <th className="p-3 font-normal text-right">{t('colBets')}</th>
                    <th className="p-3 font-normal text-right">{t('colWinRate')}</th>
                    <th className="p-3 font-normal text-right">{t('colProfit')}</th>
                    <th className="p-3 font-normal text-right">{t('colRoi')}</th>
                    <th className="p-3 font-normal text-right">{t('colAchievements')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, idx) => {
                    const winRate = row.settled_bets > 0 ? (row.won_bets / row.settled_bets) * 100 : 0;
                    const rankInfo = RANK_ICONS[idx];
                    const Icon = rankInfo?.icon;
                    const memberInfo = members.find((m) => m.user_id === row.user_id);
                    const profit = row.total_profit !== null ? Number(row.total_profit) : null;
                    return (
                      <tr key={row.user_id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="p-3">
                          {Icon ? (
                            <Icon className={cn('w-4 h-4', rankInfo.color)} />
                          ) : (
                            <span className="text-muted-foreground text-xs font-medium">{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium flex items-center gap-1.5">
                                {row.display_name ?? row.username ?? '—'}
                                {memberInfo?.role === 'owner' && <Crown className="w-3 h-3 text-amber-500" />}
                              </div>
                              {row.username && (
                                <div className="text-xs text-muted-foreground">@{row.username}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{row.settled_bets}</td>
                        <td className="p-3 text-right">{formatNumber(winRate, 0)} %</td>
                        <td className={cn(
                          'p-3 text-right font-semibold',
                          profit === null ? 'text-muted-foreground' :
                          profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground'
                        )}>
                          {profit === null ? '—' : `${profit > 0 ? '+' : ''}${formatCurrency(profit, currency)}`}
                        </td>
                        <td className={cn(
                          'p-3 text-right font-semibold',
                          row.roi === null ? 'text-muted-foreground' :
                          row.roi > 0 ? 'text-success' : 'text-danger'
                        )}>
                          {row.roi === null ? '—' : `${row.roi > 0 ? '+' : ''}${formatNumber(Number(row.roi), 1)} %`}
                        </td>
                        <td className="p-3 text-right">
                          {row.achievements_count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {row.achievements_count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                {t('minBets')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members list */}
      {isOwner && members.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('memberManagement')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingMembers ? (
              <p className="p-4 text-sm text-muted-foreground">{t('loadingMembers')}</p>
            ) : (
              <div>
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{m.display_name ?? m.username ?? '—'}</span>
                        {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                      </div>
                      {m.username && <span className="text-xs text-muted-foreground">@{m.username}</span>}
                    </div>
                    {m.role !== 'owner' && (
                      <button
                        className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        onClick={() => {
                          if (confirm(t('kickConfirm', { name: m.display_name ?? m.username ?? '?' }))) {
                            kickMember.mutate({ groupId, userId: m.user_id });
                          }
                        }}
                        title={t('kickTitle')}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
