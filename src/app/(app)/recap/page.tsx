'use client';

import { useRef, useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { ChevronLeft, ChevronRight, Download, Share2, TrendingUp, TrendingDown } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { useBets } from '@/hooks/use-bets';
import type { Bet } from '@/lib/types';

// ── Stats calculator ─────────────────────────────────────────

function betProfit(b: Bet): number {
  switch (b.status) {
    case 'won':       return b.stake * b.odds - b.stake;
    case 'half_won':  return (b.stake * b.odds - b.stake) / 2;
    case 'lost':      return -b.stake;
    case 'half_lost': return -b.stake / 2;
    case 'cashout':   return b.payout != null ? b.payout - b.stake : 0;
    default:          return 0;
  }
}

function getMondayOfWeek(offset = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d;
}

function calcWeekStats(bets: Bet[], offset: number) {
  const monday = getMondayOfWeek(offset);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  const week     = bets.filter(b => { const d = new Date(b.placed_at); return d >= monday && d < sunday; });
  const settled  = week.filter(b => b.status !== 'pending' && b.status !== 'void');
  const won      = settled.filter(b => b.status === 'won' || b.status === 'half_won');

  const profit      = settled.reduce((s, b) => s + betProfit(b), 0);
  const totalStaked = week.reduce((s, b) => s + b.stake, 0);
  const roi         = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
  const winRate     = settled.length > 0 ? (won.length / settled.length) * 100 : 0;

  const bestBet = settled.length > 0
    ? settled.reduce((best, b) => betProfit(b) > betProfit(best) ? b : best, settled[0])
    : null;

  // Longest win streak in the week
  let streak = 0, maxStreak = 0;
  for (const b of [...settled].sort((a, b) => a.placed_at.localeCompare(b.placed_at))) {
    if (b.status === 'won' || b.status === 'half_won') { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  }

  return { monday, sunday, week, settled, won, profit, totalStaked, roi, winRate, bestBet, maxStreak };
}

// ── Vibe ─────────────────────────────────────────────────────

function getVibe(roi: number, totalBets: number) {
  if (totalBets === 0) return { title: 'Ticho',           sub: 'Tento týden jsi nesázel',    emoji: '😴' };
  if (roi > 30)        return { title: 'Týden snů',       sub: 'Tohle se jen tak nevidí 🔥', emoji: '🏆' };
  if (roi > 15)        return { title: 'Výborný týden',   sub: 'Byl jsi na vlně',             emoji: '🚀' };
  if (roi > 0)         return { title: 'Zelený týden',    sub: 'V plusu, to se počítá',       emoji: '💚' };
  if (roi > -10)       return { title: 'Skoro tam',       sub: 'Příští týden lépe',           emoji: '📊' };
  if (roi > -25)       return { title: 'Těžký týden',     sub: 'Každý profík to zná',         emoji: '💪' };
  return                { title: 'Restart mode',         sub: 'Hlava vzhůru, jedeme dál',    emoji: '🔄' };
}

// ── Gradient by performance ───────────────────────────────────

function getGradient(roi: number, totalBets: number): { bg: string; glow: string } {
  if (totalBets === 0) return {
    bg:   'linear-gradient(160deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
    glow: 'rgba(161,161,170,0.15)',
  };
  if (roi > 20) return {
    bg:   'linear-gradient(160deg, #052e16 0%, #064e3b 50%, #065f46 100%)',
    glow: 'rgba(52,211,153,0.2)',
  };
  if (roi > 0) return {
    bg:   'linear-gradient(160deg, #14532d 0%, #166534 60%, #15803d 100%)',
    glow: 'rgba(74,222,128,0.18)',
  };
  if (roi > -15) return {
    bg:   'linear-gradient(160deg, #1e1b4b 0%, #3730a3 50%, #4338ca 100%)',
    glow: 'rgba(129,140,248,0.2)',
  };
  if (roi > -30) return {
    bg:   'linear-gradient(160deg, #431407 0%, #7c2d12 50%, #9a3412 100%)',
    glow: 'rgba(251,146,60,0.2)',
  };
  return {
    bg:   'linear-gradient(160deg, #4c0519 0%, #881337 50%, #9f1239 100%)',
    glow: 'rgba(251,113,133,0.2)',
  };
}

// ── Currency format ───────────────────────────────────────────

function fmtProfit(val: number, currency: string): string {
  const abs = Math.abs(val);
  const sign = val >= 0 ? '+' : '−';
  return `${sign} ${abs.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} ${currency}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
}

// ── The shareable card ────────────────────────────────────────

function RecapCard({
  cardRef,
  stats,
  currency,
  username,
  offset,
}: {
  cardRef: React.RefObject<HTMLDivElement>;
  stats: ReturnType<typeof calcWeekStats>;
  currency: string;
  username: string;
  offset: number;
}) {
  const { profit, roi, winRate, week, won, settled, bestBet, maxStreak } = stats;
  const vibe = getVibe(roi, week.length);
  const { bg, glow } = getGradient(roi, week.length);
  const isPositive = profit >= 0;
  const bestProfit = bestBet ? betProfit(bestBet) : 0;

  return (
    <div
      ref={cardRef}
      style={{
        width: 390,
        height: 692,
        background: bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        flexShrink: 0,
      }}
    >
      {/* Decorative glow orb */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: glow, filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, right: -60,
        width: 260, height: 260, borderRadius: '50%',
        background: glow, filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>📈</div>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>
            BETTRACKER
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
          {fmtDate(stats.monday)} – {fmtDate(new Date(stats.sunday.getTime() - 86400000))}
        </span>
      </div>

      {/* ── Title ── */}
      <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.15em', fontWeight: 700, margin: 0 }}>
          TÝDENNÍ RECAP
        </p>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '4px 0 0', fontWeight: 500 }}>
          {username}
        </p>
      </div>

      {/* ── Big profit number ── */}
      <div style={{ textAlign: 'center', padding: '24px 24px 0' }}>
        <div style={{
          fontSize: week.length === 0 ? 32 : profit === 0 ? 48 : Math.abs(profit) >= 10000 ? 46 : 56,
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {week.length === 0 ? '—' : fmtProfit(profit, currency)}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 8, fontWeight: 500 }}>
          {week.length === 0 ? 'Žádné sázky' : isPositive ? 'celkový zisk' : 'celková ztráta'}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: 'flex', gap: 10, padding: '20px 24px 0',
      }}>
        {[
          { label: 'Sázky', value: week.length.toString() },
          { label: 'Win rate', value: settled.length > 0 ? `${winRate.toFixed(0)}%` : '—' },
          { label: 'ROI', value: settled.length > 0 ? `${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%` : '—' },
          { label: 'Výhry', value: `${won.length}/${settled.length}` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '12px 8px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1 }}>{value}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, fontWeight: 600, letterSpacing: '0.05em' }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* ── Best bet ── */}
      <div style={{ padding: '14px 24px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: '14px 16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' }}>
            🏆 NEJLEPŠÍ SÁZKA TÝDNE
          </p>
          {bestBet ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: '#fff', fontWeight: 700, fontSize: 14, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}>
                  {bestBet.description || 'Sázka'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '3px 0 0' }}>
                  Kurz {bestBet.odds.toFixed(2)}
                </p>
              </div>
              <div style={{
                color: bestProfit >= 0 ? '#4ade80' : '#f87171',
                fontWeight: 900, fontSize: 18, flexShrink: 0,
              }}>
                {bestProfit >= 0 ? '+' : '−'}{Math.abs(bestProfit).toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} {currency}
              </div>
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>Žádné uzavřené sázky</p>
          )}
        </div>
      </div>

      {/* ── Streak ── */}
      {maxStreak >= 3 && (
        <div style={{ padding: '10px 24px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 700 }}>
              Nejdelší série: {maxStreak} výher v řadě
            </span>
          </div>
        </div>
      )}

      {/* ── Vibe ── */}
      <div style={{ padding: '14px 24px 0', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '14px 28px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 28 }}>{vibe.emoji}</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>{vibe.title}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{vibe.sub}</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 24px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}>
          bettracker.app
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
          {offset === 0 ? 'Aktuální týden' : `Týden ${Math.abs(offset)} zpět`}
        </span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function RecapPage() {
  const { data: profile } = useProfile();
  const { data: bets = [] } = useBets();
  const cardRef   = useRef<HTMLDivElement>(null!);
  const [offset,  setOffset]  = useState(0);
  const [sharing, setSharing] = useState(false);

  const currency = profile?.default_currency ?? 'Kč';
  const username = profile?.display_name || profile?.username || 'Bettor';

  const stats = useMemo(() => calcWeekStats(bets, offset), [bets, offset]);

  async function handleShare() {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, skipFonts: true });

      // Try native share (mobile)
      if (typeof navigator !== 'undefined' && navigator.share) {
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'bettracker-recap.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Můj týdenní betting recap' });
          setSharing(false);
          return;
        }
      }

      // Fallback: download
      const link  = document.createElement('a');
      link.href   = dataUrl;
      link.download = `bettracker-recap-${stats.monday.toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Týdenní Recap</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Shrnutí tvého týdne — ulož nebo sdílej jako obrázek</p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
        <button
          onClick={() => setOffset(o => o - 1)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-sm font-bold text-white">
            {offset === 0 ? 'Aktuální týden' : offset === -1 ? 'Minulý týden' : `${Math.abs(offset)} týdny zpět`}
          </p>
          <p className="text-xs text-zinc-500">
            {stats.monday.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
            {' – '}
            {new Date(stats.sunday.getTime() - 86400000).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <button
          onClick={() => setOffset(o => Math.min(o + 1, 0))}
          disabled={offset === 0}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Card preview */}
      <div className="flex justify-center">
        <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
          <RecapCard
            cardRef={cardRef}
            stats={stats}
            currency={currency}
            username={username}
            offset={offset}
          />
        </div>
      </div>

      {/* Stats quick summary below card */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Celkový zisk/ztráta</p>
          <p className={`text-xl font-black ${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} {currency}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">ROI tento týden</p>
          <p className={`text-xl font-black ${stats.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Sázky / Výhry</p>
          <p className="text-xl font-black text-white">{stats.won.length} / {stats.week.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs mb-1">Win rate</p>
          <p className="text-xl font-black text-white">
            {stats.settled.length > 0 ? `${stats.winRate.toFixed(0)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Share / Download buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-violet-500/20"
        >
          {sharing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {typeof navigator !== 'undefined' && navigator.share
                ? <Share2 className="w-4 h-4" />
                : <Download className="w-4 h-4" />
              }
              {typeof navigator !== 'undefined' && navigator.share ? 'Sdílet' : 'Stáhnout PNG'}
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-zinc-600">
        Obrázek se vygeneruje ve 2× rozlišení — ideální pro Instagram Stories nebo X
      </p>
    </div>
  );
}
