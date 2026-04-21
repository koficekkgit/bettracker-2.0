'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/stats/stat-card';
import { ProfitChart } from '@/components/stats/profit-chart';
import { StatusBadge } from '@/components/bets/status-badge';
import { useFriendBets, useFriendProfileByUsername } from '@/hooks/use-friends';
import { calculateStats, calculateProfitTimeline, calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { Bet } from '@/lib/types';

/** Blurred overlay with lock icon — wraps any card content */
function PrivacyBlur({
  children,
  hidden,
  title,
  desc,
}: {
  children: React.ReactNode;
  hidden: boolean;
  title: string;
  desc: string;
}) {
  if (!hidden) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-md">
      {/* Blurred content underneath */}
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
        {children}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function FriendDashboardPage() {
  const t = useTranslations();
  const params = useParams<{ username: string }>();
  const username = params.username;

  const { data: profile, isLoading: loadingProfile } = useFriendProfileByUsername(username);

  // Respect privacy settings — default to showing everything while profile loads
  const betsHidden   = profile ? !profile.show_bets_to_friends   : false;
  const profitHidden = profile ? !profile.show_profit_to_friends  : false;

  // Only fetch bets if the friend allows it — no data sent to client when hidden
  const { data: bets = [], isLoading: loadingBets } = useFriendBets(
    betsHidden ? '' : (profile?.id ?? '')
  );

  const stats    = useMemo(() => calculateStats(bets),          [bets]);
  const timeline = useMemo(() => calculateProfitTimeline(bets), [bets]);
  const recent   = useMemo(() => bets.slice(0, 10),             [bets]);
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

      {/* Stat cards — blur profit-related when hidden */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PrivacyBlur
          hidden={profitHidden}
          title={t('friends.privacyProfitHidden')}
          desc={t('friends.privacyProfitHiddenDesc')}
        >
          <StatCard
            label={t('dashboard.profit')}
            value={formatCurrency(stats.totalProfit, currency)}
            hint={`${stats.totalBets} ${t('dashboard.totalBets').toLowerCase()}`}
            hintColor={stats.totalProfit >= 0 ? 'success' : 'danger'}
          />
        </PrivacyBlur>

        <PrivacyBlur
          hidden={profitHidden}
          title={t('friends.privacyProfitHidden')}
          desc={t('friends.privacyProfitHiddenDesc')}
        >
          <StatCard
            label={t('dashboard.roi')}
            value={`${formatNumber(stats.roi, 1)} %`}
            hint={`${formatCurrency(stats.totalStaked, currency)}`}
          />
        </PrivacyBlur>

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

      {/* Profit chart — blur when profit hidden */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('dashboard.profitChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PrivacyBlur
            hidden={profitHidden}
            title={t('friends.privacyProfitHidden')}
            desc={t('friends.privacyProfitHiddenDesc')}
          >
            {loadingBets ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
            ) : (
              <ProfitChart data={timeline} currency={currency} />
            )}
          </PrivacyBlur>
        </CardContent>
      </Card>

      {/* Recent bets — blur when bets hidden */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{t('dashboard.recentBets')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PrivacyBlur
            hidden={betsHidden}
            title={t('friends.privacyBetsHidden')}
            desc={t('friends.privacyBetsHiddenDesc')}
          >
            {/* Placeholder rows shown under the blur when bets hidden, real data otherwise */}
            {betsHidden ? (
              <BetsPlaceholder currency={currency} />
            ) : loadingBets ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t('common.loading')}</p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">{t('dashboard.noBets')}</p>
            ) : (
              <BetsTable recent={recent} currency={currency} profitHidden={profitHidden} t={t} />
            )}
          </PrivacyBlur>
        </CardContent>
      </Card>
    </div>
  );
}

/** Realistic-looking placeholder rows rendered under the blur overlay */
function BetsPlaceholder({ currency }: { currency: string }) {
  const rows = [
    { desc: 'Manchester City - Arsenal', pick: 'Domácí výhra', odds: 1.85, stake: 1000, win: true },
    { desc: 'Barcelona - Real Madrid',   pick: 'Oba skórují',  odds: 1.72, stake: 500,  win: false },
    { desc: 'Chelsea - Liverpool',       pick: 'Over 2.5',     odds: 2.10, stake: 750,  win: true },
    { desc: 'Bayern - Dortmund',         pick: '1',            odds: 1.55, stake: 2000, win: true },
    { desc: 'PSG - Lyon',               pick: 'BTTS',          odds: 1.90, stake: 300,  win: false },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground text-xs">
          <tr className="text-left">
            <th className="pb-2 font-normal">Datum</th>
            <th className="pb-2 font-normal">Popis / zápas</th>
            <th className="pb-2 font-normal text-right">Kurz</th>
            <th className="pb-2 font-normal text-right">Vklad</th>
            <th className="pb-2 font-normal">Stav</th>
            <th className="pb-2 font-normal text-right">Zisk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const profit = r.win ? r.stake * (r.odds - 1) : -r.stake;
            return (
              <tr key={i} className="border-t border-border">
                <td className="py-3 text-muted-foreground">21. 4. 2026</td>
                <td className="py-3">
                  <div className="font-medium">{r.desc}</div>
                  <div className="text-xs text-muted-foreground">{r.pick}</div>
                </td>
                <td className="py-3 text-right">{r.odds.toFixed(2)}</td>
                <td className="py-3 text-right">{formatCurrency(r.stake, currency)}</td>
                <td className="py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${r.win ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {r.win ? 'Výhra' : 'Prohra'}
                  </span>
                </td>
                <td className={`py-3 text-right font-medium ${profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profit > 0 ? '+' : ''}{formatCurrency(profit, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Real bets table — profit column hidden separately if profitHidden */
function BetsTable({
  recent,
  currency,
  profitHidden,
  t,
}: {
  recent: Bet[];
  currency: string;
  profitHidden: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
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
                <td className="py-3 text-right">
                  {profitHidden ? (
                    <span className="text-muted-foreground select-none">—</span>
                  ) : (
                    <span className={`font-medium ${profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                      {profit > 0 ? '+' : ''}{formatCurrency(profit, bet.currency)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
