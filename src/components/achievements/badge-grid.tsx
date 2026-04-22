'use client';

import { useTranslations } from 'next-intl';
import * as Icons from 'lucide-react';
import { Lock, Flame, Shield, Zap, Star } from 'lucide-react';
import { ACHIEVEMENTS, type Achievement, type AchievementContext } from '@/lib/achievements';
import { cn } from '@/lib/utils';

type LucideIcon = React.ComponentType<{ className?: string }>;

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

const RARITY_CFG: Record<Rarity, {
  label: string;
  cardBg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  progressFrom: string;
  progressTo: string;
  earnedGlow: string;
  badge: string;
}> = {
  common: {
    label: 'Common',
    cardBg: 'bg-zinc-900',
    border: 'border-zinc-700/60',
    iconBg: 'bg-zinc-800',
    iconColor: 'text-zinc-400',
    progressFrom: '#6b7280',
    progressTo: '#9ca3af',
    earnedGlow: '',
    badge: 'text-zinc-500',
  },
  rare: {
    label: 'Rare',
    cardBg: 'bg-blue-950/40',
    border: 'border-blue-500/40',
    iconBg: 'bg-blue-900/50',
    iconColor: 'text-blue-400',
    progressFrom: '#1d4ed8',
    progressTo: '#60a5fa',
    earnedGlow: '0 0 20px rgba(96,165,250,0.35)',
    badge: 'text-blue-400',
  },
  epic: {
    label: 'Epic',
    cardBg: 'bg-purple-950/40',
    border: 'border-purple-500/50',
    iconBg: 'bg-purple-900/50',
    iconColor: 'text-purple-400',
    progressFrom: '#7e22ce',
    progressTo: '#c084fc',
    earnedGlow: '0 0 24px rgba(192,132,252,0.4)',
    badge: 'text-purple-400',
  },
  legendary: {
    label: 'Legendary',
    cardBg: 'bg-amber-950/30',
    border: 'border-amber-500/60',
    iconBg: 'bg-amber-900/40',
    iconColor: 'text-amber-400',
    progressFrom: '#b45309',
    progressTo: '#fbbf24',
    earnedGlow: '0 0 28px rgba(251,191,36,0.45)',
    badge: 'text-amber-400',
  },
};

const ACHIEVEMENT_RARITY: Record<string, Rarity> = {
  first_win: 'common',
  rookie_10: 'common',
  first_grand: 'common',
  hot_streak_3: 'rare',
  experienced_100: 'rare',
  five_k: 'rare',
  on_fire_5: 'epic',
  veteran_500: 'epic',
  ten_k: 'epic',
  sharp_shooter: 'epic',
  underdog_lover: 'epic',
  unstoppable_10: 'legendary',
  master_1000: 'legendary',
  fifty_k: 'legendary',
  legendary_20: 'legendary',
  jackpot: 'legendary',
  consistent: 'legendary',
};

const CATEGORY_ICONS: Record<Achievement['category'], LucideIcon> = {
  streaks: Flame,
  volume: Shield,
  profit: Zap,
  skill: Star,
};

const CATEGORY_COLORS: Record<Achievement['category'], string> = {
  streaks: 'text-orange-400',
  volume: 'text-blue-400',
  profit: 'text-green-400',
  skill: 'text-purple-400',
};

const CATEGORY_ACCENT: Record<Achievement['category'], string> = {
  streaks: 'from-orange-500/20 to-transparent',
  volume: 'from-blue-500/20 to-transparent',
  profit: 'from-green-500/20 to-transparent',
  skill: 'from-purple-500/20 to-transparent',
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
    <div className="space-y-8">
      {categories.map((cat) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === cat);
        const catEarned = items.filter((a) => earnedIds.has(a.id)).length;
        const CatIcon = CATEGORY_ICONS[cat];
        const catColor = CATEGORY_COLORS[cat];
        const catAccent = CATEGORY_ACCENT[cat];

        return (
          <div key={cat}>
            {/* Category header */}
            <div className={cn(
              'relative flex items-center gap-3 mb-4 px-4 py-3 rounded-xl overflow-hidden',
              'bg-gradient-to-r border border-white/5',
              catAccent,
            )}>
              <div className={cn('p-1.5 rounded-lg bg-black/30', catColor)}>
                <CatIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-widest uppercase text-white/80">
                {t(`achievements.categories.${cat}`)}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-white/40">{catEarned}/{items.length}</span>
                <div className="h-1.5 w-20 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', catColor.replace('text-', 'bg-'))}
                    style={{ width: `${Math.round((catEarned / items.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

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

  const rarity = ACHIEVEMENT_RARITY[achievement.id] ?? 'common';
  const cfg = RARITY_CFG[rarity];

  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all duration-300 overflow-hidden',
        cfg.cardBg,
        earned ? cfg.border : 'border-zinc-800/60',
        earned ? 'opacity-100' : 'opacity-60',
      )}
      style={earned && cfg.earnedGlow ? { boxShadow: cfg.earnedGlow } : undefined}
    >
      {/* Earned shimmer overlay */}
      {earned && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)`,
          }}
        />
      )}

      {/* Rarity corner accent */}
      <div
        className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          background: earned
            ? `linear-gradient(225deg, ${cfg.progressTo}33 0%, transparent 60%)`
            : 'transparent',
        }}
      />

      <div className="p-4">
        {/* Icon + lock */}
        <div className="relative mb-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              earned ? cfg.iconBg : 'bg-zinc-800/60',
              earned ? cfg.iconColor : 'text-zinc-600',
            )}
            style={earned && cfg.earnedGlow ? {
              boxShadow: `inset 0 0 16px ${cfg.progressTo}22`,
            } : undefined}
          >
            <Icon className="w-6 h-6" />
          </div>
          {!earned && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-zinc-500" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className={cn(
          'font-bold text-sm leading-tight mb-1',
          earned ? 'text-white' : 'text-zinc-400',
        )}>
          {t(achievement.nameKey)}
        </div>

        {/* Description */}
        <div className="text-[11px] text-zinc-500 leading-snug line-clamp-2 mb-3">
          {t(achievement.descKey)}
        </div>

        {/* Progress or earned badge */}
        {earned ? (
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                cfg.iconColor,
              )}
              style={{ background: `${cfg.progressTo}18` }}
            >
              <span>✦</span>
              <span>{t('achievements.earned')}</span>
            </div>
            <span className={cn('text-[9px] uppercase tracking-widest font-semibold', cfg.badge)}>
              {cfg.label}
            </span>
          </div>
        ) : (
          <div>
            {prog ? (
              <>
                <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background: `linear-gradient(90deg, ${cfg.progressFrom}, ${cfg.progressTo})`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">
                    {Math.floor(prog.current)} / {prog.target}
                  </span>
                  <span className={cn('text-[9px] uppercase tracking-widest font-semibold', cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-end">
                <span className={cn('text-[9px] uppercase tracking-widest font-semibold', cfg.badge)}>
                  {cfg.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
