'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Flame, Trophy, Skull, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useBets } from '@/hooks/use-bets';
import { buildAchievementContext, getEarnedAchievements, ACHIEVEMENTS } from '@/lib/achievements';
import { useMemo } from 'react';

export function StreakCard() {
  const t = useTranslations();
  const { data: bets } = useBets();

  const ctx = useMemo(() => (bets ? buildAchievementContext(bets) : null), [bets]);
  const earnedCount = useMemo(
    () => (ctx ? getEarnedAchievements(ctx).length : 0),
    [ctx]
  );

  if (!ctx) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-muted-foreground">
            {t('achievements.streaks')}
          </div>
          <Link
            href="/achievements"
            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
          >
            {t('achievements.viewAll')}
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StreakStat
            icon={Flame}
            value={ctx.currentWinStreak}
            label={t('achievements.currentWin')}
            color="text-orange-500"
          />
          <StreakStat
            icon={Trophy}
            value={ctx.longestWinStreak}
            label={t('achievements.bestStreak')}
            color="text-yellow-500"
          />
          <StreakStat
            icon={Skull}
            value={ctx.currentLossStreak}
            label={t('achievements.currentLoss')}
            color="text-muted-foreground"
          />
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('achievements.level')}</span>
          <span className="font-semibold">
            {earnedCount} / {ACHIEVEMENTS.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StreakStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
