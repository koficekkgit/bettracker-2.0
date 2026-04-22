'use client';

import { useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Shield, Star, Zap, Swords } from 'lucide-react';
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
      <div
        className="rounded-2xl border border-zinc-800 overflow-hidden relative"
        style={{ background: `radial-gradient(ellipse 80% 120% at 10% 50%, ${rank.stroke}14 0%, transparent 60%), #18181b` }}
      >
        {/* Decorative glow blob */}
        <div
          className="absolute -left-10 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${rank.stroke}18` }}
        />

        <div className="relative p-5 lg:p-7 flex flex-col sm:flex-row gap-6">
          {/* Left: rank emblem */}
          <div className="flex items-center gap-5 flex-shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${rank.stroke}20`, boxShadow: `0 0 0 1px ${rank.stroke}30, 0 0 32px ${rank.glow}` }}
            >
              <RankIcon style={{ width: 40, height: 40, color: rank.stroke }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Aktuální rank</p>
              <p className="text-4xl font-black leading-none" style={{ color: rank.stroke }}>{rank.label}</p>
              <p className="text-lg font-semibold text-zinc-400 mt-0.5">{rank.sublabel}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px self-stretch bg-zinc-800 mx-1" />

          {/* Center: progress to next rank */}
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">
                <span className="text-white text-sm font-black">{earned}</span>
                <span className="text-zinc-600"> / {total} badges</span>
              </span>
              {nextRank ? (
                <span className={cn('font-semibold', nextRank.color)}>
                  {nextRank.min - earned} do {nextRank.label}
                </span>
              ) : (
                <span className={cn('font-bold', rank.color)}>Max rank!</span>
              )}
            </div>

            {/* Multi-rank segmented bar */}
            <div className="flex gap-1 h-3">
              {RANKS.map((r, i) => {
                const segMin  = r.min;
                const segMax  = RANKS[i + 1]?.min ?? total;
                const filled  = Math.min(Math.max(earned - segMin, 0), segMax - segMin);
                const segPct  = Math.round((filled / (segMax - segMin)) * 100);
                const isPast  = earned >= segMax;
                const isCurr  = r.label === rank.label;
                return (
                  <div key={r.label} className="flex-1 rounded-full bg-zinc-800 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: isPast ? '100%' : isCurr ? `${segPct}%` : '0%',
                        background: isPast ? r.stroke : `linear-gradient(90deg, ${r.stroke}80, ${r.stroke})`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Rank labels under bar */}
            <div className="flex">
              {RANKS.map((r) => (
                <div key={r.label} className="flex-1 text-center">
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-wide',
                    r.label === rank.label ? '' : earned >= r.min ? 'text-zinc-600' : 'text-zinc-700',
                  )} style={r.label === rank.label ? { color: r.stroke } : {}}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: big % */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-shrink-0 w-24">
            <div className="text-5xl font-black tabular-nums leading-none text-white">{pct}</div>
            <div className="text-lg font-black text-zinc-600 leading-none">%</div>
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">hotovo</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-zinc-800/80 divide-x divide-zinc-800">
          {[
            { label: 'Nejdelší série', value: ctx.longestWinStreak },
            { label: 'Aktuální série', value: ctx.currentWinStreak },
            { label: 'Sázek celkem',   value: ctx.totalBets.toLocaleString() },
            { label: 'Winrate',        value: `${Math.round(ctx.winRate)}%` },
          ].map((s) => (
            <div key={s.label} className="py-4 text-center">
              <div className="text-2xl font-black text-white tabular-nums">{s.value}</div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
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
