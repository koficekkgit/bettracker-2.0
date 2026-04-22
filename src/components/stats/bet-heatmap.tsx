'use client';

import { useMemo, useState } from 'react';
import { calculateBetProfit } from '@/lib/stats';
import type { Bet } from '@/lib/types';

interface DayData {
  date: string;
  profit: number;
  count: number;
  wins: number;
  losses: number;
}

const MONTHS = ['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro'];
const DAYS   = ['Po','Út','St','Čt','Pá','So','Ne'];

function cellColor(d: DayData): string {
  if (d.count === 0) return '#27272a';
  const p = d.profit;
  if (p > 2000)  return '#4ade80';
  if (p > 500)   return '#16a34a';
  if (p > 100)   return '#166534';
  if (p > 0)     return '#14532d';
  if (p === 0)   return '#92400e';
  if (p > -100)  return '#7f1d1d';
  if (p > -500)  return '#991b1b';
  if (p > -2000) return '#b91c1c';
  return '#ef4444';
}

export function BetHeatmap({ bets, currency }: { bets: Bet[]; currency: string }) {
  const [tooltip, setTooltip] = useState<{ day: DayData; x: number; y: number } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const bet of bets) {
      const key = bet.placed_at.slice(0, 10);
      const cur = map.get(key) ?? { date: key, profit: 0, count: 0, wins: 0, losses: 0 };
      cur.profit += calculateBetProfit(bet);
      cur.count++;
      if (bet.status === 'won' || bet.status === 'half_won') cur.wins++;
      if (bet.status === 'lost' || bet.status === 'half_lost') cur.losses++;
      map.set(key, cur);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Start from Monday 52 full weeks ago
    const monOffset = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - monOffset - 52 * 7);

    const weeks: DayData[][] = [];
    const monthLabels: { weekIdx: number; label: string }[] = [];
    const cur = new Date(start);

    for (let w = 0; w < 53; w++) {
      const week: DayData[] = [];
      for (let d = 0; d < 7; d++) {
        const key = cur.toISOString().slice(0, 10);
        const isFuture = cur > today;
        if (isFuture) {
          week.push({ date: key, profit: 0, count: -1, wins: 0, losses: 0 });
        } else {
          week.push(map.get(key) ?? { date: key, profit: 0, count: 0, wins: 0, losses: 0 });
        }
        if (d === 0 && cur.getDate() <= 7 && !isFuture) {
          monthLabels.push({ weekIdx: w, label: MONTHS[cur.getMonth()] });
        }
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, [bets]);

  const CELL = 11;
  const GAP  = 2;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Aktivita sázek</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Poslední rok · každý čtvereček = jeden den</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>ztráta</span>
          {['#991b1b', '#7f1d1d', '#27272a', '#14532d', '#16a34a', '#4ade80'].map((c) => (
            <div key={c} className="rounded-sm" style={{ width: CELL, height: CELL, background: c, flexShrink: 0 }} />
          ))}
          <span>zisk</span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        <div style={{ display: 'flex', gap: GAP, alignItems: 'flex-start' }}>

          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 20, flexShrink: 0 }}>
            {DAYS.map((day, i) => (
              <div
                key={day}
                style={{ width: 14, height: CELL, fontSize: 9, color: '#52525b', lineHeight: `${CELL}px`, textAlign: 'right' }}
              >
                {i % 2 === 0 ? day : ''}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {/* Month labels row */}
            <div style={{ display: 'flex', gap: GAP, height: 16 }}>
              {weeks.map((_, wi) => {
                const lbl = monthLabels.find((m) => m.weekIdx === wi);
                return (
                  <div key={wi} style={{ width: CELL, flexShrink: 0, position: 'relative' }}>
                    {lbl && (
                      <span style={{ position: 'absolute', left: 0, top: 2, fontSize: 9, color: '#71717a', whiteSpace: 'nowrap' }}>
                        {lbl.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cell grid */}
            <div style={{ display: 'flex', gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {week.map((day, di) => {
                    const isFuture = day.count === -1;
                    const hasData  = day.count > 0;
                    return (
                      <div
                        key={di}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 2,
                          flexShrink: 0,
                          background: isFuture ? 'transparent' : cellColor(day),
                          cursor: hasData ? 'pointer' : 'default',
                          transition: 'opacity 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          if (!hasData) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({ day, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs shadow-2xl min-w-[140px]">
            <p className="font-bold text-white mb-1">{tooltip.day.date}</p>
            <p className="text-zinc-400">{tooltip.day.count} {tooltip.day.count === 1 ? 'sázka' : tooltip.day.count < 5 ? 'sázky' : 'sázek'}</p>
            <p className="text-zinc-400">{tooltip.day.wins}× výhra · {tooltip.day.losses}× prohra</p>
            <p className={`font-bold mt-1 ${tooltip.day.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tooltip.day.profit >= 0 ? '+' : ''}{tooltip.day.profit.toFixed(0)} {currency}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
