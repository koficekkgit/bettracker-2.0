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
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="p-6 lg:p-8 flex items-center gap-6">

          {/* Rank badge circle */}
          <div
            className="shrink-0 w-[72px] h-[72px] rounded-full flex items-center justify-center"
            style={{ background: `${rank.stroke}18`, boxShadow: `0 0 0 2px ${rank.stroke}35, 0 0 28px ${rank.glow}` }}
          >
            <RankIcon style={{ width: 32, height: 32, color: rank.stroke }} />
          </div>

          {/* Name + progress */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="text-5xl font-black leading-none tracking-tight" style={{ color: rank.stroke }}>
                {rank.label}
              </span>
              <span className="text-xl font-semibold text-zinc-500 leading-none">{rank.sublabel}</span>
              <span className="text-sm text-zinc-600 leading-none ml-auto tabular-nums">
                <span className="text-white font-bold">{earned}</span> / {total} badges
              </span>
            </div>

            {nextRank ? (
              <div className="space-y-1.5">
                <div className="h-[5px] rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rankPct}%`, background: `linear-gradient(90deg, ${rank.stroke}70, ${rank.stroke})` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: rank.stroke }}>{rank.label}</span>
                  <span className="text-xs text-zinc-500">
                    ještě <span className={cn('font-bold', nextRank.color)}>{nextRank.min - earned}</span> do {nextRank.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: rank.stroke }}>
                <Crown className="w-4 h-4" />
                Maximální rank — jsi legenda!
              </div>
            )}
          </div>

          {/* Completion % */}
          <div className="shrink-0 text-right hidden sm:block">
            <div className="text-6xl font-black leading-none tabular-nums" style={{ color: rank.stroke }}>
              {pct}
              <span className="text-3xl text-zinc-700">%</span>
            </div>
            <div className="text-[11px] text-zinc-600 uppercase tracking-widest mt-1.5">dokončeno</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-zinc-800">
          {[
            { label: 'Nejdelší série', value: ctx.longestWinStreak },
            { label: 'Aktuální série', value: ctx.currentWinStreak },
            { label: 'Sázek celkem',   value: ctx.totalBets.toLocaleString() },
            { label: 'Winrate',        value: `${Math.round(ctx.winRate)}%` },
          ].map((s) => (
            <div key={s.label} className="py-5 text-center">
              <div className="text-3xl font-black text-white tabular-nums">{s.value}</div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
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
