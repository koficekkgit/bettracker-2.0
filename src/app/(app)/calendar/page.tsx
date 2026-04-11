'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/bets/status-badge';
import { useBets } from '@/hooks/use-bets';
import { calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import type { Bet } from '@/lib/types';

const MONTHS_CS = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const WEEKDAYS_CS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

interface DayData {
  date: string;
  profit: number;
  count: number;
  bets: Bet[];
}

export default function CalendarPage() {
  const t = useTranslations();
  const { data: bets = [], isLoading } = useBets();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const currency = bets[0]?.currency ?? 'CZK';

  // Mapa den -> data
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const bet of bets) {
      const cur = map.get(bet.placed_at) ?? {
        date: bet.placed_at,
        profit: 0,
        count: 0,
        bets: [],
      };
      cur.profit += calculateBetProfit(bet);
      cur.count++;
      cur.bets.push(bet);
      map.set(bet.placed_at, cur);
    }
    return map;
  }, [bets]);

  // Vytvoření gridu kalendáře pro currentMonth
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Pondělí = 0, neděle = 6
    let firstWeekday = firstDay.getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6;

    const cells: ({ date: string; day: number; data: DayData | null } | null)[] = [];

    // Prázdné buňky před prvním dnem
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(null);
    }

    // Dny v měsíci
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        date: dateStr,
        day,
        data: dayMap.get(dateStr) ?? null,
      });
    }

    return cells;
  }, [currentMonth, dayMap]);

  // Měsíční profit
  const monthProfit = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let profit = 0;
    let count = 0;
    for (const cell of calendarCells) {
      if (cell?.data) {
        profit += cell.data.profit;
        count += cell.data.count;
      }
    }
    return { profit, count };
  }, [calendarCells, currentMonth]);

  // Pro intenzitu barvy potřebuju max abs profit v měsíci
  const maxAbsProfit = useMemo(() => {
    let max = 0;
    for (const cell of calendarCells) {
      if (cell?.data) {
        max = Math.max(max, Math.abs(cell.data.profit));
      }
    }
    return max || 1;
  }, [calendarCells]);

  function getCellColor(profit: number) {
    if (profit === 0) return 'rgba(115, 115, 115, 0.4)';
    const intensity = Math.min(1, Math.abs(profit) / maxAbsProfit);
    if (profit > 0) {
      const opacity = 0.4 + intensity * 0.5;
      return `rgba(34, 197, 94, ${opacity})`;
    } else {
      const opacity = 0.4 + intensity * 0.5;
      return `rgba(239, 68, 68, ${opacity})`;
    }
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(null);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDayData = selectedDay ? dayMap.get(selectedDay) : null;

  if (isLoading) {
    return <div className="text-muted-foreground">{t('common.loading')}</div>;
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
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-base font-medium min-w-[160px] text-center">
              {MONTHS_CS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              {t('calendar.today')}
            </Button>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('calendar.monthlyProfit')}</p>
            <p
              className={cn(
                'text-lg font-semibold',
                monthProfit.profit > 0 ? 'text-success' : monthProfit.profit < 0 ? 'text-danger' : 'text-muted-foreground'
              )}
            >
              {monthProfit.profit > 0 ? '+' : ''}
              {formatCurrency(monthProfit.profit, currency)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {WEEKDAYS_CS.map((d) => (
              <div key={d} className="text-xs text-muted-foreground text-center font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const hasData = !!cell.data;
              const isToday = cell.date === todayStr;
              const isSelected = cell.date === selectedDay;
              const profit = cell.data?.profit ?? 0;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(hasData ? cell.date : null)}
                  disabled={!hasData}
                  className={cn(
                    'aspect-square rounded-md border transition-all flex flex-col items-center justify-center p-1 text-xs',
                    isSelected ? 'border-foreground' : 'border-border',
                    isToday && 'ring-2 ring-foreground/30',
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
                      <span className="text-[10px] leading-tight">
                        {formatNumber(Math.abs(profit), 0)}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDayData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {new Date(selectedDayData.date).toLocaleDateString('cs-CZ', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long',
              })}
            </CardTitle>
            <p className={cn(
              'text-sm font-medium',
              selectedDayData.profit > 0 ? 'text-success' : selectedDayData.profit < 0 ? 'text-danger' : 'text-muted-foreground'
            )}>
              {selectedDayData.profit > 0 ? '+' : ''}
              {formatCurrency(selectedDayData.profit, currency)} · {selectedDayData.count}×
            </p>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {selectedDayData.bets.map((bet) => {
                  const profit = calculateBetProfit(bet);
                  return (
                    <tr key={bet.id} className="border-t border-border first:border-0">
                      <td className="py-2">
                        <div className="font-medium">{bet.description}</div>
                        {bet.pick && <div className="text-xs text-muted-foreground">{bet.pick}</div>}
                      </td>
                      <td className="py-2 text-right">{formatNumber(Number(bet.odds), 2)}</td>
                      <td className="py-2 text-right">{formatCurrency(Number(bet.stake), bet.currency)}</td>
                      <td className="py-2"><StatusBadge status={bet.status} /></td>
                      <td className={cn(
                        'py-2 text-right font-medium',
                        profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground'
                      )}>
                        {profit > 0 ? '+' : ''}
                        {formatCurrency(profit, bet.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
