'use client';

import { useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Crown, Sword, Shield, Star, Zap, Swords, ChevronRight } from 'lucide-react';
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
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  stroke: string;
  glow: string;
  accent: string;
  min: number;
};

const RANKS: Rank[] = [
  { label: 'Bronze',   sublabel: 'Bettor',     Icon: Shield, color: 'text-orange-500', stroke: '#f97316', glow: 'rgba(249,115,22,0.3)',  accent: 'from-orange-500/10', min: 0  },
  { label: 'Silver',   sublabel: 'Analyst',    Icon: Star,   color: 'text-slate-300',  stroke: '#cbd5e1', glow: 'rgba(203,213,225,0.2)', accent: 'from-slate-500/10',  min: 6  },
  { label: 'Gold',     sublabel: 'Strategist', Icon: Zap,    color: 'text-yellow-400', stroke: '#facc15', glow: 'rgba(250,204,21,0.35)', accent: 'from-yellow-500/10', min: 13 },
  { label: 'Platinum', sublabel: 'Expert',     Icon: Swords, color: 'text-cyan-300',   stroke: '#67e8f9', glow: 'rgba(103,232,249,0.25)',accent: 'from-cyan-500/10',   min: 21 },
  { label: 'Diamond',  sublabel: 'Legend',     Icon: Crown,  color: 'text-amber-300',  stroke: '#fcd34d', glow: 'rgba(252,211,77,0.4)',  accent: 'from-amber-500/10',  min: 29 },
];

function getRank(n: number) { return [...RANKS].reverse().find((r) => n >= r.min) ?? RANKS[0]; }
function getNextRank(n: number) { return RANKS.find((r) => r.min > n) ?? null; }

function Ring({ pct, stroke, glow }: { pct: number; stroke: string; glow: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  return (
    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
      <circle cx="50" cy="50" r={r} stroke={stroke} strokeWidth="6" fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (pct / 100) * circ}
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 5px ${glow})` }}
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
      <div className="space-y-5 animate-pulse">
        <div className="h-9 w-40 bg-zinc-800 rounded-lg" />
        <div className="h-40 bg-zinc-800/50 rounded-2xl" />
        <div className="h-10 bg-zinc-800/40 rounded-xl" />
        <div className="h-64 bg-zinc-800/30 rounded-2xl" />
      </div>
    );
  }

  const total = ACHIEVEMENTS.length;
  const pct = Math.round((earned / total) * 100);
  const rank = getRank(earned);
  const nextRank = getNextRank(earned);
  const RankIcon = rank.Icon;
  const rankPct = nextRank
    ? Math.round(((earned - rank.min) / (nextRank.min - rank.min)) * 100)
    : 100;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black">{t('achievements.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('achievements.subtitle')}</p>
      </div>

      {/* Hero */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900',
      )}>
        {/* Subtle radial glow behind rank icon area */}
        <div
          className="absolute left-0 inset-y-0 w-64 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at left, ${rank.glow} 0%, transparent 70%)` }}
        />

        <div className="relative flex flex-wrap items-center gap-8 p-6 lg:p-8">
          {/* Progress ring */}
          <div className="relative flex-shrink-0">
            <Ring pct={pct} stroke={rank.stroke} glow={rank.glow} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className={cn('w-5 h-5', rank.color)} />
              <span className="text-lg font-black text-white leading-none mt-0.5">{earned}</span>
              <span className="text-[11px] text-zinc-600">/{total}</span>
            </div>
          </div>

          {/* Rank + progress */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2.5 mb-1">
              <RankIcon className={cn('w-5 h-5', rank.color)} />
              <span className={cn('text-2xl font-black tracking-tight', rank.color)}>{rank.label}</span>
              <span className="text-xl font-semibold text-zinc-500">{rank.sublabel}</span>
            </div>

            <p className="text-sm text-zinc-400 mb-4">
              <span className="text-white font-semibold">{earned}</span>
              <span className="text-zinc-600"> / {total} badges • </span>
              <span className="text-white font-semibold">{pct}%</span>
              <span className="text-zinc-600"> dokončeno</span>
            </p>

            {nextRank ? (
              <div className="max-w-xs">
                <div className="flex justify-between text-xs text-zinc-600 mb-1.5">
                  <span className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    <span className={nextRank.color}>{nextRank.label} {nextRank.sublabel}</span>
                  </span>
                  <span>{nextRank.min - earned} badges chybí</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rankPct}%`, background: `linear-gradient(90deg, ${rank.stroke}66, ${rank.stroke})` }}
                  />
                </div>
              </div>
            ) : (
              <div className={cn('flex items-center gap-2 text-sm font-bold', rank.color)}>
                <Crown className="w-4 h-4" />
                Maximální rank — jsi legenda!
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
            {[
              { label: 'Nejdelší série', value: ctx.longestWinStreak },
              { label: 'Aktuální série', value: ctx.currentWinStreak },
              { label: 'Sázek celkem',   value: ctx.totalBets.toLocaleString() },
              { label: 'Winrate',        value: `${Math.round(ctx.winRate)}%` },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900 px-5 py-3.5 text-center">
                <div className="text-xl font-black text-white tabular-nums">{s.value}</div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wide mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rank tier strip */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {RANKS.map((r) => {
          const RIcon = r.Icon;
          const isActive = r.label === rank.label;
          const isPast  = r.min < rank.min;
          return (
            <div
              key={r.label}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all',
                isActive
                  ? cn('bg-zinc-900 border-zinc-700', r.color)
                  : isPast
                    ? 'bg-zinc-900/50 border-zinc-800/60 text-zinc-600'
                    : 'bg-transparent border-zinc-800/40 text-zinc-700',
              )}
              style={isActive ? { boxShadow: `0 0 0 1px ${r.stroke}40, 0 0 16px ${r.glow}` } : undefined}
            >
              <RIcon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
              {isPast  && <span className="opacity-50">✓</span>}
              {isActive && <span style={{ color: r.stroke }}>◆</span>}
              <span className="opacity-30 text-[10px]">{r.min}+</span>
            </div>
          );
        })}
      </div>

      {/* Badge grid */}
      <BadgeGrid ctx={ctx} earnedIds={earnedIds} />
    </div>
  );
}
