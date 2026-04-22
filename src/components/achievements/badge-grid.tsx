'use client';

import { useTranslations } from 'next-intl';
import * as Icons from 'lucide-react';
import { Lock, Flame, Shield, Zap, Star, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/lib/achievements';
import { cn } from '@/lib/utils';

type LucideIcon = React.ComponentType<{ className?: string }>;
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface RarityCfg {
  label: string;
  dotColor: string;
  labelColor: string;
  iconBg: string;
  iconColor: string;
  gradient: string;      // gradient border for earned
  progressGradient: string;
  glowColor: string;
  earnedBg: string;
}

const RARITY: Record<Rarity, RarityCfg> = {
  common: {
    label: 'Common',
    dotColor: 'bg-zinc-500',
    labelColor: 'text-zinc-500',
    iconBg: 'bg-zinc-800',
    iconColor: 'text-zinc-300',
    gradient: 'from-zinc-600 via-zinc-500 to-zinc-600',
    progressGradient: 'from-zinc-500 to-zinc-400',
    glowColor: '',
    earnedBg: 'bg-zinc-900',
  },
  rare: {
    label: 'Rare',
    dotColor: 'bg-blue-500',
    labelColor: 'text-blue-400',
    iconBg: 'bg-blue-950',
    iconColor: 'text-blue-400',
    gradient: 'from-blue-700 via-blue-400 to-blue-700',
    progressGradient: 'from-blue-600 to-blue-400',
    glowColor: '0 0 20px rgba(96,165,250,0.25)',
    earnedBg: 'bg-blue-950/30',
  },
  epic: {
    label: 'Epic',
    dotColor: 'bg-purple-500',
    labelColor: 'text-purple-400',
    iconBg: 'bg-purple-950',
    iconColor: 'text-purple-400',
    gradient: 'from-purple-700 via-purple-400 to-purple-700',
    progressGradient: 'from-purple-600 to-purple-400',
    glowColor: '0 0 24px rgba(168,85,247,0.3)',
    earnedBg: 'bg-purple-950/30',
  },
  legendary: {
    label: 'Legendary',
    dotColor: 'bg-amber-500',
    labelColor: 'text-amber-400',
    iconBg: 'bg-amber-950',
    iconColor: 'text-amber-400',
    gradient: 'from-amber-700 via-amber-400 to-amber-700',
    progressGradient: 'from-amber-600 to-amber-400',
    glowColor: '0 0 28px rgba(251,191,36,0.35)',
    earnedBg: 'bg-amber-950/20',
  },
};

const ACHIEVEMENT_RARITY: Record<string, Rarity> = {
  // common
  first_win: 'common',
  first_bet: 'common',
  rookie_10: 'common',
  first_grand: 'common',
  in_the_green: 'common',
  profitable_month: 'common',
  // rare
  hot_streak_3: 'rare',
  experienced_100: 'rare',
  five_k: 'rare',
  fifty_wins: 'rare',
  comeback_kid: 'rare',
  winrate_55: 'rare',
  // epic
  on_fire_5: 'epic',
  win_streak_7: 'epic',
  veteran_500: 'epic',
  ten_k: 'epic',
  two_hundred_wins: 'epic',
  sharp_shooter: 'epic',
  underdog_lover: 'epic',
  high_roller: 'epic',
  // legendary
  unstoppable_10: 'legendary',
  legendary_20: 'legendary',
  master_1000: 'legendary',
  marathon: 'legendary',
  grinder: 'legendary',
  five_hundred_wins: 'legendary',
  fifty_k: 'legendary',
  hundred_k: 'legendary',
  two_hundred_k: 'legendary',
  jackpot: 'legendary',
  big_jackpot: 'legendary',
  consistent: 'legendary',
  consistent_5: 'legendary',
  underdog_10: 'legendary',
  high_roller_5: 'legendary',
};

const CATEGORY_META: Record<Achievement['category'], {
  Icon: LucideIcon;
  accentColor: string;
  bgAccent: string;
  barColor: string;
}> = {
  streaks:  { Icon: Flame,  accentColor: 'text-orange-400', bgAccent: 'border-orange-500/30 bg-orange-500/5',  barColor: 'bg-orange-400' },
  volume:   { Icon: Shield, accentColor: 'text-sky-400',    bgAccent: 'border-sky-500/30 bg-sky-500/5',        barColor: 'bg-sky-400'    },
  profit:   { Icon: Zap,    accentColor: 'text-emerald-400',bgAccent: 'border-emerald-500/30 bg-emerald-500/5',barColor: 'bg-emerald-400'},
  skill:    { Icon: Star,   accentColor: 'text-violet-400', bgAccent: 'border-violet-500/30 bg-violet-500/5',  barColor: 'bg-violet-400' },
};

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
    <div className="space-y-10">
      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === cat);
        const catEarned = items.filter((a) => earnedIds.has(a.id)).length;
        const { Icon, accentColor, bgAccent, barColor } = CATEGORY_META[cat];
        const pct = Math.round((catEarned / items.length) * 100);

        return (
          <section key={cat}>
            {/* Category header */}
            <div className={cn('flex items-center gap-3 px-5 py-3.5 rounded-xl border mb-5', bgAccent)}>
              <Icon className={cn('w-5 h-5 flex-shrink-0', accentColor)} />
              <span className="font-bold text-sm tracking-widest uppercase text-white/90 flex-1">
                {t(`achievements.categories.${cat}`)}
              </span>
              {/* mini progress */}
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                  <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                </div>
                <span className={cn('text-xs font-bold tabular-nums', accentColor)}>
                  {catEarned}<span className="text-white/30">/{items.length}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((a) => (
                <BadgeCard
                  key={a.id}
                  achievement={a}
                  earned={earnedIds.has(a.id)}
                  ctx={ctx}
                />
              ))}
            </div>
          </section>
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

  const rarity = ACHIEVEMENT_RARITY[achievement.id] ?? 'common';
  const cfg = RARITY[rarity];

  const cardContent = (
    <div
      className={cn(
        'rounded-[11px] p-4 h-full flex flex-col gap-3 transition-all duration-200',
        earned ? cfg.earnedBg : 'bg-zinc-950',
        !earned && 'opacity-55 hover:opacity-75',
      )}
    >
      {/* Top row: icon + rarity pill */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          'relative w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
          earned ? cfg.iconBg : 'bg-zinc-900',
        )}>
          <Icon className={cn('w-7 h-7', earned ? cfg.iconColor : 'text-zinc-600')} />
          {!earned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-zinc-500" />
            </div>
          )}
        </div>

        {/* Rarity label */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dotColor)} />
          <span className={cn('text-[11px] font-semibold uppercase tracking-wider', cfg.labelColor)}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Name + description */}
      <div className="flex-1">
        <div className={cn(
          'font-bold text-base leading-tight mb-1',
          earned ? 'text-white' : 'text-zinc-400',
        )}>
          {t(achievement.nameKey)}
        </div>
        <div className="text-sm text-zinc-500 leading-snug">
          {t(achievement.descKey)}
        </div>
      </div>

      {/* Bottom: progress or earned */}
      {earned ? (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className={cn('w-4 h-4', cfg.iconColor)} />
          <span className={cn('text-sm font-bold', cfg.iconColor)}>
            {t('achievements.earned')}
          </span>
        </div>
      ) : prog ? (
        <div className="space-y-1.5">
          <div className="h-2 rounded-full overflow-hidden bg-white/[0.06]">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', cfg.progressGradient)}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 tabular-nums">
              {Math.floor(prog.current).toLocaleString()} / {prog.target.toLocaleString()}
            </span>
            <span className="text-zinc-600 font-medium">{Math.round(progressPct)}%</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-600 italic">Zamčeno</div>
      )}
    </div>
  );

  if (earned) {
    return (
      <div
        className={cn('p-[1px] rounded-xl bg-gradient-to-br', cfg.gradient)}
        style={cfg.glowColor ? { boxShadow: cfg.glowColor } : undefined}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/70">
      {cardContent}
    </div>
  );
}
