'use client';

import { useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Crown, Sword, Shield, Star, Zap } from 'lucide-react';
import { ProGate } from '@/components/subscription/pro-gate';
import { useBets } from '@/hooks/use-bets';
import {
  ACHIEVEMENTS,
  buildAchievementContext,
  getEarnedAchievements,
} from '@/lib/achievements';
import { BadgeGrid } from '@/components/achievements/badge-grid';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function AchievementsPage() {
  return (
    <ProGate feature="achievements">
      <Content />
    </ProGate>
  );
}

type Rank = {
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  stroke: string;
  bg: string;
  border: string;
  glow: string;
  min: number;
  max: number;
};

const RANKS: Rank[] = [
  {
    label: 'Bronze',
    sublabel: 'Bettor',
    icon: Shield,
    color: 'text-orange-600',
    stroke: '#c2410c',
    bg: 'bg-orange-900/30',
    border: 'border-orange-800/60',
    glow: 'rgba(180,90,20,0.4)',
    min: 0, max: 3,
  },
  {
    label: 'Silver',
    sublabel: 'Analyst',
    icon: Star,
    color: 'text-slate-300',
    stroke: '#cbd5e1',
    bg: 'bg-slate-800/40',
    border: 'border-slate-500/50',
    glow: 'rgba(148,163,184,0.3)',
    min: 4, max: 6,
  },
  {
    label: 'Gold',
    sublabel: 'Strategist',
    icon: Zap,
    color: 'text-yellow-400',
    stroke: '#facc15',
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-600/50',
    glow: 'rgba(234,179,8,0.35)',
    min: 7, max: 10,
  },
  {
    label: 'Platinum',
    sublabel: 'Expert',
    icon: Sword,
    color: 'text-cyan-300',
    stroke: '#67e8f9',
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-500/50',
    glow: 'rgba(103,232,249,0.3)',
    min: 11, max: 14,
  },
  {
    label: 'Diamond',
    sublabel: 'Legend',
    icon: Crown,
    color: 'text-amber-300',
    stroke: '#fcd34d',
    bg: 'bg-amber-900/20',
    border: 'border-amber-400/60',
    glow: 'rgba(252,211,77,0.5)',
    min: 15, max: 17,
  },
];

function getRank(earned: number): Rank {
  return RANKS.findLast((r) => earned >= r.min) ?? RANKS[0];
}

function getNextRank(earned: number): Rank | null {
  return RANKS.find((r) => r.min > earned) ?? null;
}

function CircularProgress({ pct, color, glow }: { pct: number; color: string; glow: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width="108" height="108" className="rotate-[-90deg]">
      <circle
        cx="54" cy="54" r={r}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
        fill="none"
      />
      <circle
        cx="54" cy="54" r={r}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 1s ease',
          filter: `drop-shadow(0 0 6px ${glow})`,
        }}
      />
    </svg>
  );
}

function Content() {
  const t = useTranslations();
  const { data: bets, isLoading } = useBets();

  const { ctx, earnedIds } = useMemo(() => {
    if (!bets) return { ctx: null, earnedIds: new Set<string>() };
    const c = buildAchievementContext(bets);
    return { ctx: c, earnedIds: new Set(getEarnedAchievements(c)) };
  }, [bets]);

  const earned = earnedIds.size;

  useEffect(() => {
    if (!ctx) return;
    const supabase = createClient();
    void (async () => {
      const { error } = await supabase.rpc('sync_achievements_count', { p_count: earned });
      if (error) console.error('[achievements] sync failed:', error);
    })();
  }, [ctx, earned]);

  if (isLoading || !ctx) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-40 bg-zinc-800 rounded-2xl" />
        <div className="h-64 bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  const total = ACHIEVEMENTS.length;
  const percent = Math.round((earned / total) * 100);
  const rank = getRank(earned);
  const nextRank = getNextRank(earned);
  const RankIcon = rank.icon;

  const toNext = nextRank ? nextRank.min - earned : 0;
  const rankPct = nextRank
    ? Math.round(((earned - rank.min) / (nextRank.min - rank.min)) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('achievements.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('achievements.subtitle')}</p>
      </div>

      {/* Hero rank card */}
      <div
        className={cn(
          'relative rounded-2xl border overflow-hidden',
          rank.bg,
          rank.border,
        )}
        style={{ boxShadow: `0 0 40px ${rank.glow}` }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 50%, ${rank.glow} 0%, transparent 60%)`,
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative p-6 flex items-center gap-6 flex-wrap">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <CircularProgress pct={percent} color={rank.stroke} glow={rank.glow} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className={cn('w-6 h-6 mb-0.5', rank.color)} />
              <span className="text-lg font-black text-white leading-none">{earned}</span>
              <span className="text-[10px] text-zinc-400">/ {total}</span>
            </div>
          </div>

          {/* Rank info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('p-1.5 rounded-lg border', rank.bg, rank.border)}>
                <RankIcon className={cn('w-4 h-4', rank.color)} />
              </div>
              <span className={cn('text-2xl font-black tracking-tight', rank.color)}>
                {rank.label}
              </span>
              <span className="text-lg font-semibold text-zinc-400">{rank.sublabel}</span>
            </div>

            <div className="text-sm text-zinc-300 mb-3">
              <span className="font-bold text-white">{earned}</span>
              <span className="text-zinc-500"> / {total} </span>
              <span className="text-zinc-400">{t('achievements.earnedCount')}</span>
              <span className="ml-2 text-zinc-500">•</span>
              <span className="ml-2 font-bold text-white">{percent}%</span>
              <span className="text-zinc-500"> dokončeno</span>
            </div>

            {/* Progress to next rank */}
            {nextRank ? (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-500">Postup na <span className={nextRank.color}>{nextRank.label} {nextRank.sublabel}</span></span>
                  <span className="text-zinc-400">{toNext} badges chybí</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${rankPct}%`,
                      background: `linear-gradient(90deg, ${rank.stroke}aa, ${rank.stroke})`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={cn('text-sm font-bold', rank.color)}>
                ✦ Maximální rank dosažen!
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-col gap-3 ml-auto text-right">
            {[
              { label: 'Nejdelší série', value: ctx.longestWinStreak },
              { label: 'Aktuální série', value: ctx.currentWinStreak },
              { label: 'Celkem sázek', value: ctx.totalBets },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-black text-white">{s.value}</div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rank tier strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {RANKS.map((r, i) => {
          const RIcon = r.icon;
          const isActive = r.label === rank.label;
          const isPast = r.max < earned;
          return (
            <div
              key={r.label}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                isActive
                  ? cn(r.bg, r.border, r.color, 'ring-1')
                  : isPast
                    ? 'bg-zinc-900/50 border-zinc-700/40 text-zinc-500'
                    : 'bg-zinc-900/30 border-zinc-800/40 text-zinc-600',
              )}
              style={isActive ? { boxShadow: `0 0 14px ${r.glow}` } : undefined}
            >
              <RIcon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
              {isPast && !isActive && <span className="text-[10px]">✓</span>}
              {isActive && <span className="text-[10px]">◆</span>}
            </div>
          );
        })}
      </div>

      {/* Badge grid */}
      <BadgeGrid ctx={ctx} earnedIds={earnedIds} />
    </div>
  );
}
