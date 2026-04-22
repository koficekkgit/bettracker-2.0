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
  labelColor: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  barColor: string;
  earnedCheckColor: string;
}

const RARITY: Record<Rarity, RarityCfg> = {
  common: {
    label: 'Common',
    labelColor: 'text-zinc-500',
    borderColor: 'border-l-zinc-600',
    iconColor: 'text-zinc-300',
    iconBg: 'bg-zinc-800',
    barColor: 'bg-zinc-500',
    earnedCheckColor: 'text-zinc-400',
  },
  rare: {
    label: 'Rare',
    labelColor: 'text-blue-400',
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    barColor: 'bg-blue-500',
    earnedCheckColor: 'text-blue-400',
  },
  epic: {
    label: 'Epic',
    labelColor: 'text-purple-400',
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    barColor: 'bg-purple-500',
    earnedCheckColor: 'text-purple-400',
  },
  legendary: {
    label: 'Legendary',
    labelColor: 'text-amber-400',
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    barColor: 'bg-amber-500',
    earnedCheckColor: 'text-amber-400',
  },
};

const ACHIEVEMENT_RARITY: Record<string, Rarity> = {
  first_win: 'common',
  first_bet: 'common',
  rookie_10: 'common',
  first_grand: 'common',
  in_the_green: 'common',
  profitable_month: 'common',
  hot_streak_3: 'rare',
  experienced_100: 'rare',
  five_k: 'rare',
  fifty_wins: 'rare',
  comeback_kid: 'rare',
  winrate_55: 'rare',
  on_fire_5: 'epic',
  win_streak_7: 'epic',
  veteran_500: 'epic',
  ten_k: 'epic',
  two_hundred_wins: 'epic',
  sharp_shooter: 'epic',
  underdog_lover: 'epic',
  high_roller: 'epic',
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
  color: string;
  bg: string;
  bar: string;
}> = {
  streaks:  { Icon: Flame,  color: 'text-orange-400', bg: 'bg-orange-400', bar: 'bg-orange-400' },
  volume:   { Icon: Shield, color: 'text-sky-400',    bg: 'bg-sky-400',    bar: 'bg-sky-400'    },
  profit:   { Icon: Zap,    color: 'text-emerald-400',bg: 'bg-emerald-400',bar: 'bg-emerald-400'},
  skill:    { Icon: Star,   color: 'text-violet-400', bg: 'bg-violet-400', bar: 'bg-violet-400' },
};

export function BadgeGrid({ ctx, earnedIds }: { ctx: AchievementContext; earnedIds: Set<string> }) {
  const t = useTranslations();
  const categories: Achievement['category'][] = ['streaks', 'volume', 'profit', 'skill'];

  return (
    <div className="space-y-10">
      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === cat);
        const catEarned = items.filter((a) => earnedIds.has(a.id)).length;
        const { Icon, color, bg, bar } = CATEGORY_META[cat];
        const pct = Math.round((catEarned / items.length) * 100);

        return (
          <section key={cat}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-5">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', bg + '/10')}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <h2 className="font-black text-base tracking-widest uppercase text-white/80">
                {t(`achievements.categories.${cat}`)}
              </h2>
              <div className="flex-1 h-px bg-zinc-800 mx-2" />
              <span className={cn('text-sm font-bold tabular-nums', color)}>
                {catEarned}/{items.length}
              </span>
              <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', bar)} style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Cards — earned first, then by progress %, then locked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[...items].sort((a, b) => {
                const aE = earnedIds.has(a.id), bE = earnedIds.has(b.id);
                if (aE !== bE) return aE ? -1 : 1;
                if (!aE && !bE) {
                  const ap = a.progress?.(ctx), bp = b.progress?.(ctx);
                  const apct = ap ? ap.current / ap.target : 0;
                  const bpct = bp ? bp.current / bp.target : 0;
                  return bpct - apct;
                }
                return 0;
              }).map((a) => (
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

  return (
    <div
      className={cn(
        'flex gap-4 p-4 rounded-xl border-l-4 transition-all duration-200',
        earned
          ? cn('bg-zinc-900 border border-zinc-800/50', cfg.borderColor)
          : 'bg-zinc-900/40 border border-zinc-800/50 border-l-zinc-800 opacity-60 hover:opacity-80',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 relative',
          earned ? cfg.iconBg : 'bg-zinc-800/60',
        )}
      >
        <Icon className={cn('w-7 h-7', earned ? cfg.iconColor : 'text-zinc-600')} />
        {!earned && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className={cn('font-bold text-[15px] leading-snug', earned ? 'text-white' : 'text-zinc-400')}>
            {t(achievement.nameKey)}
          </span>
          <span className={cn('text-[10px] font-bold uppercase tracking-widest flex-shrink-0 mt-0.5', cfg.labelColor)}>
            {cfg.label}
          </span>
        </div>

        {/* Description */}
        <p className={cn('text-sm leading-snug', earned ? 'text-zinc-400' : 'text-zinc-600')}>
          {t(achievement.descKey)}
        </p>

        {/* Bottom */}
        <div className="mt-2.5">
          {earned ? (
            <div className={cn('flex items-center gap-1.5', cfg.earnedCheckColor)}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('achievements.earned')}</span>
            </div>
          ) : prog ? (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', cfg.barColor)}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-600 tabular-nums">
                <span>{Math.floor(prog.current).toLocaleString()} / {prog.target.toLocaleString()}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-zinc-700 italic">Locked</span>
          )}
        </div>
      </div>
    </div>
  );
}
