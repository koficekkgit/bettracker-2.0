'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/bets/status-badge';
import { BetFormDialog } from '@/components/bets/bet-form-dialog';
import { ProGate } from '@/components/subscription/pro-gate';
import { useBets, useDeleteBet } from '@/hooks/use-bets';
import { useProfile } from '@/hooks/use-profile';
import { calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, cn, formatDate } from '@/lib/utils';
import type { Bet } from '@/lib/types';

const MONTHS_CS   = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const WEEKDAYS_CS = ['Po','Út','St','Čt','Pá','So','Ne'];

interface DayData {
  date: string;
  profit: number;
  count: number;
  bets: Bet[];
}

export default function CalendarPage() {
  return (
    <ProGate feature="Kalendářové view">
      <CalendarContent />
    </ProGate>
  );
}

function CalendarContent() {
  const t = useTranslations();
  const { data: bets = [], isLoading } = useBets();
  const { data: profile } = useProfile();
  const deleteBet = useDeleteBet();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingBet, setEditingBet]   = useState<Bet | null>(null);
  const [formOpen, setFormOpen]       = useState(false);

  const currency = profile?.default_currency ?? bets[0]?.currency ?? 'CZK';

  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const bet of bets) {
      const cur = map.get(bet.placed_at) ?? { date: bet.placed_at, profit: 0, count: 0, bets: [] };
      cur.profit += calculateBetProfit(bet);
      cur.count++;
      cur.bets.push(bet);
      map.set(bet.placed_at, cur);
    }
    return map;
  }, [bets]);

  const calendarCells = useMemo(() => {
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay  = new Date(year, month, 1);
    const lastDay   = new Date(year, month + 1, 0);
    let firstWeekday = firstDay.getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6;

    const cells: ({ date: string; day: number; data: DayData | null } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ date: dateStr, day, data: dayMap.get(dateStr) ?? null });
    }
    return cells;
  }, [currentMonth, dayMap]);

  const monthProfit = useMemo(() => {
    let profit = 0, count = 0;
    for (const cell of calendarCells) {
      if (cell?.data) { profit += cell.data.profit; count += cell.data.count; }
    }
    return { profit, count };
  }, [calendarCells]);

  const maxAbsProfit = useMemo(() => {
    let max = 0;
    for (const cell of calendarCells) {
      if (cell?.data) max = Math.max(max, Math.abs(cell.data.profit));
    }
    return max || 1;
  }, [calendarCells]);

  function getCellColor(profit: number) {
    if (profit === 0) return 'rgba(115,115,115,0.4)';
    const intensity = Math.min(1, Math.abs(profit) / maxAbsProfit);
    const opacity = 0.4 + intensity * 0.5;
    return profit > 0
      ? `rgba(34,197,94,${opacity})`
      : `rgba(239,68,68,${opacity})`;
  }

  function prevMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); setSelectedDay(null); }
  function nextMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); setSelectedDay(null); }
  function goToToday() { const now = new Date(); setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDay(null); }

  function handleEditBet(bet: Bet) {
    setEditingBet(bet);
    setFormOpen(true);
  }

  async function handleDeleteBet(id: string) {
    if (confirm(t('bets.deleteConfirm'))) {
      await deleteBet.mutateAsync(id);
    }
  }

  const todayStr       = new Date().toISOString().slice(0, 10);
  const selectedDayData = selectedDay ? dayMap.get(selectedDay) : null;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-[420px] bg-zinc-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('calendar.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('calendar.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <CardTitle className="text-base font-medium min-w-[160px] text-center">
              {MONTHS_CS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>{t('calendar.today')}</Button>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('calendar.monthlyProfit')}</p>
            <p className={cn('text-lg font-semibold', monthProfit.profit > 0 ? 'text-success' : monthProfit.profit < 0 ? 'text-danger' : 'text-muted-foreground')}>
              {monthProfit.profit > 0 ? '+' : ''}{formatCurrency(monthProfit.profit, currency)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAYS_CS.map((d) => (
              <div key={d} className="text-xs text-muted-foreground text-center font-medium py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const hasData   = !!cell.data;
              const isToday   = cell.date === todayStr;
              const isSelected = cell.date === selectedDay;
              const profit    = cell.data?.profit ?? 0;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(hasData ? (cell.date === selectedDay ? null : cell.date) : null)}
                  disabled={!hasData}
                  className={cn(
                    'aspect-square rounded-md border transition-all flex flex-col items-center justify-center p-1 text-xs',
                    isSelected ? 'border-foreground ring-1 ring-foreground/30' : 'border-border',
                    isToday && !isSelected && 'ring-2 ring-foreground/30',
                    hasData ? 'cursor-pointer hover:scale-105' : 'opacity-60 cursor-default',
                  )}
                  style={hasData ? { backgroundColor: getCellColor(profit) } : undefined}
                >
                  <span className={cn('font-medium', hasData && 'text-white', isToday && 'font-bold')}>{cell.day}</span>
                  {hasData && (
                    <div className="flex flex-col items-center mt-0.5 leading-tight text-white">
                      <span className="text-base font-bold leading-none">
                        {profit > 0 ? '+' : profit < 0 ? '−' : '·'}
                      </span>
                      <span className="text-[10px] leading-tight">{formatNumber(Math.abs(profit), 0)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day detail */}
      {selectedDayData && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base font-medium">
                  {new Date(selectedDayData.date + 'T12:00:00').toLocaleDateString('cs-CZ', {
                    day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
                  })}
                </CardTitle>
                <p className={cn('text-sm font-medium mt-0.5', selectedDayData.profit > 0 ? 'text-success' : selectedDayData.profit < 0 ? 'text-danger' : 'text-muted-foreground')}>
                  {selectedDayData.profit > 0 ? '+' : ''}{formatCurrency(selectedDayData.profit, currency)}
                  {' · '}{selectedDayData.count} sázek
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {selectedDayData.bets.map((bet) => {
                const profit = calculateBetProfit(bet);
                return (
                  <div
                    key={bet.id}
                    className="flex items-center gap-3 py-3 border-t border-border first:border-0 group"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{bet.description}</p>
                        <StatusBadge status={bet.status} />
                      </div>
                      {bet.pick && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{bet.pick}</p>
                      )}
                    </div>

                    {/* Odds · Stake */}
                    <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground flex-shrink-0">
                      <span>{formatNumber(Number(bet.odds), 2)}x</span>
                      <span>{formatCurrency(Number(bet.stake), bet.currency)}</span>
                    </div>

                    {/* Profit */}
                    <p className={cn(
                      'text-sm font-medium text-right flex-shrink-0 w-20 tabular-nums',
                      profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground',
                    )}>
                      {profit > 0 ? '+' : ''}{formatCurrency(profit, bet.currency)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditBet(bet)}
                        title="Upravit sázku"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-danger"
                        onClick={() => handleDeleteBet(bet.id)}
                        title="Smazat sázku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <BetFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingBet(null); }}
        initial={editingBet}
        mode="edit"
      />
    </div>
  );
}
