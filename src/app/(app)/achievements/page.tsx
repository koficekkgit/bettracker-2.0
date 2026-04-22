'use client';

import { useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, Crown, Sword, Shield, Star, Zap, TrendingUp, Swords } from 'lucide-react';
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
  twColor: string;
  stroke: string;
  glow: string;
  cardBg: string;
  cardBorder: string;
  gradientFrom: string;
  min: number;
};

const RANKS: Rank[] = [
  {
    label: 'Bronze', sublabel: 'Bettor',
    Icon: Shield,
    twColor: 'text-orange-600', stroke: '#c2410c', glow: 'rgba(194,65,12,0.45)',
    cardBg: 'bg-orange-950/30', cardBorder: 'border-orange-900/60',
    gradientFrom: 'from-orange-950/60',
    min: 0,
  },
  {
    label: 'Silver', sublabel: 'Analyst',
    Icon: Star,
    twColor: 'text-slate-300', stroke: '#cbd5e1', glow: 'rgba(148,163,184,0.3)',
    cardBg: 'bg-slate-900/40', cardBorder: 'border-slate-700/60',
    gradientFrom: 'from-slate-900/60',
    min: 6,
  },
  {
    label: 'Gold', sublabel: 'Strategist',
    Icon: Zap,
    twColor: 'text-yellow-400', stroke: '#facc15', glow: 'rgba(234,179,8,0.4)',
    cardBg: 'bg-yellow-950/30', cardBorder: 'border-yellow-900/60',
    gradientFrom: 'from-yellow-950/60',
    min: 13,
  },
  {
    label: 'Platinum', sublabel: 'Expert',
    Icon: Swords,
    twColor: 'text-cyan-300', stroke: '#67e8f9', glow: 'rgba(103,232,249,0.3)',
    cardBg: 'bg-cyan-950/30', cardBorder: 'border-cyan-900/60',
    gradientFrom: 'from-cyan-950/60',
    min: 21,
  },
  {
    label: 'Diamond', sublabel: 'Legend',
    Icon: Crown,
    twColor: 'text-amber-300', stroke: '#fcd34d', glow: 'rgba(252,211,77,0.5)',
    cardBg: 'bg-amber-950/20', cardBorder: 'border-amber-800/60',
    gradientFrom: 'from-amber-950/50',
    min: 29,
  },
];

function getRank(earned: number) {
  return [...RANKS].reverse().find((r) => earned >= r.min) ?? RANKS[0];
}

function getNextRank(earned: number) {
  return RANKS.find((r) => r.min > earned) ?? null;
}

function CircularProgress({ pct, stroke, glow }: { pct: number; stroke: string; glow: string }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="56" cy="56" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="7" fill="none" />
      <circle
        cx="56" cy="56" r={r}
        stroke={stroke} strokeWidth="7" fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${glow})` }}
      />
    </svg>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center text-center min-w-[60px]">
      <span className="text-2xl font-black text-white tabular-nums leading-none">{value}</span>
      <span className="text-[11px] text-zinc-500 uppercase tracking-wide mt-1 leading-tight">{label}</span>
    </div>
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
        <div className="h-10 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-44 bg-zinc-800/60 rounded-2xl" />
        <div className="h-12 bg-zinc-800/40 rounded-xl" />
        <div className="h-80 bg-zinc-800/40 rounded-2xl" />
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
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">{t('achievements.title')}</h1>
        <p className="text-sm text-zinc-500 mt-1">{t('achievements.subtitle')}</p>
      </div>

      {/* Hero card */}
      <div
        className={cn('relative rounded-2xl border overflow-hidden', rank.cardBg, rank.cardBorder)}
        style={{ boxShadow: `0 0 60px ${rank.glow}` }}
      >
        {/* Gradient background */}
        <div
          className={cn('absolute inset-0 bg-gradient-to-r to-transparent pointer-events-none', rank.gradientFrom)}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative flex flex-wrap items-center gap-6 p-6">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <CircularProgress pct={pct} stroke={rank.stroke} glow={rank.glow} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0">
              <Trophy className={cn('w-5 h-5', rank.twColor)} />
              <span className="text-xl font-black text-white leading-none mt-0.5">{earned}</span>
              <span className="text-[11px] text-zinc-500">/ {total}</span>
            </div>
          </div>

          {/* Rank info */}
          <div className="flex-1 min-w-0">
            {/* Rank badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', rank.cardBg, rank.cardBorder, 'border')}>
                <RankIcon className={cn('w-4 h-4', rank.twColor)} />
              </div>
              <span className={cn('text-2xl font-black', rank.twColor)}>{rank.label}</span>
              <span className="text-xl font-semibold text-zinc-500">{rank.sublabel}</span>
            </div>

            {/* Counts */}
            <p className="text-sm text-zinc-400 mb-4">
              <span className="font-bold text-white">{earned}</span> / {total} badges
              <span className="mx-2 text-zinc-700">•</span>
              <span className="font-bold text-white">{pct}%</span> dokončeno
            </p>

            {/* Progress to next rank */}
            {nextRank ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-zinc-500">
                    Postup na <span className={nextRank.twColor}>{nextRank.label} {nextRank.sublabel}</span>
                  </span>
                  <span className="text-xs text-zinc-500">{nextRank.min - earned} badges chybí</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rankPct}%`, background: `linear-gradient(90deg, ${rank.stroke}88, ${rank.stroke})` }}
                  />
                </div>
              </div>
            ) : (
              <div className={cn('text-sm font-bold flex items-center gap-2', rank.twColor)}>
                <Crown className="w-4 h-4" />
                Maximální rank — jsi legenda!
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 sm:gap-8 flex-shrink-0">
            <StatBox label="Nejdelší série" value={ctx.longestWinStreak} />
            <StatBox label="Akt. série" value={ctx.currentWinStreak} />
            <StatBox label="Sázek celkem" value={ctx.totalBets.toLocaleString()} />
            <StatBox label="Winrate" value={`${Math.round(ctx.winRate)}%`} />
          </div>
        </div>
      </div>

      {/* Rank tier strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {RANKS.map((r) => {
          const RIcon = r.Icon;
          const isActive = r.label === rank.label;
          const isDone = r.min < rank.min;
          return (
            <div
              key={r.label}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap',
                isActive
                  ? cn(r.cardBg, r.cardBorder, r.twColor)
                  : isDone
                    ? 'bg-zinc-900/60 border-zinc-800/50 text-zinc-500'
                    : 'bg-zinc-950 border-zinc-800/40 text-zinc-700',
              )}
              style={isActive ? { boxShadow: `0 0 16px ${r.glow}` } : undefined}
            >
              <RIcon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
              {isDone && <span className="text-zinc-600">✓</span>}
              {isActive && <span>◆</span>}
              <span className={cn('text-[10px] font-normal ml-0.5', isActive ? 'opacity-60' : 'opacity-40')}>
                {r.min}+
              </span>
            </div>
          );
        })}
      </div>

      {/* Badge grid */}
      <BadgeGrid ctx={ctx} earnedIds={earnedIds} />
    </div>
  );
}
