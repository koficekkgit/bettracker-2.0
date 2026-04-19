'use client';

import { useTranslations } from 'next-intl';
import * as Icons from 'lucide-react';
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/lib/achievements';
import { cn } from '@/lib/utils';

type LucideIcon = React.ComponentType<{ className?: string }>;

export function BadgeGrid({
  ctx,
  earnedIds,
}: {
  ctx: AchievementContext;
  earnedIds: Set<string>;
}) {
  const t = useTranslations();
  const categories: Achievement['category'][] = ['streaks', 'volume', 'profit', 'skill'];

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === cat);
        return (
          <div key={cat}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t(`achievements.categories.${cat}`)}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((a) => (
                <BadgeCard
                  key={a.id}
                  achievement={a}
                  earned={earnedIds.has(a.id)}
                  ctx={ctx}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BadgeCard({
  achievement,
  earned,
  ctx,
}: {
  achievement: Achievement;
  earned: boolean;
  ctx: AchievementContext;
}) {
  const t = useTranslations();
  const Icon = ((Icons as unknown) as Record<string, LucideIcon>)[achievement.icon] ??
    (Icons as unknown as Record<string, LucideIcon>).Star;

  const prog = achievement.progress?.(ctx);
  const progressPct = prog && prog.target > 0 ? Math.min(100, (prog.current / prog.target) * 100) : 0;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 transition',
        earned
          ? 'border-amber-500/50 bg-amber-500/5'
          : 'border-border bg-card opacity-70'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
            earned ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{t(achievement.nameKey)}</div>
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {t(achievement.descKey)}
          </div>
        </div>
      </div>

      {prog && !earned && (
        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {Math.floor(prog.current)} / {prog.target}
          </div>
        </div>
      )}

      {earned && (
        <div className="mt-2 text-[10px] text-amber-500 font-semibold uppercase tracking-wide">
          ✓ {t('achievements.earned')}
        </div>
      )}
    </div>
  );
}
