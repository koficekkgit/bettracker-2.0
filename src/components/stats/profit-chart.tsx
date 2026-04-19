'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate, formatCurrency } from '@/lib/utils';

// ── Cumulative by day ──────────────────────────────────────────────────────────
interface DayData {
  date: string; // YYYY-MM-DD
  profit: number;
}

// ── Bet-by-bet (intra-day / průběžný) ─────────────────────────────────────────
interface BetData {
  ts: string; // full ISO timestamp
  profit: number;
}

interface Props {
  data: DayData[] | BetData[];
  currency?: string;
  mode?: 'cumulative' | 'bet-by-bet';
}

function isBetData(d: DayData[] | BetData[]): d is BetData[] {
  return d.length > 0 && 'ts' in d[0];
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  },
};

export function ProfitChart({ data, currency = 'CZK', mode = 'cumulative' }: Props) {
  const values = data.map((d) => d.profit);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;

  // Gradient split offset — where zero sits between min and max (0 = top, 1 = bottom)
  const offset = useMemo(() => {
    if (!values.length) return 0.5;
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [values, max, min]);

  // X-axis label formatter for bet-by-bet mode
  const betTickFormatter = useMemo(() => {
    if (!isBetData(data) || data.length === 0) return (_: string) => '';
    const first = new Date(data[0].ts);
    const last = new Date(data[data.length - 1].ts);
    const sameDay = first.toDateString() === last.toDateString();

    return (ts: string) => {
      const d = new Date(ts);
      if (sameDay) {
        // HH:mm
        return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      }
      // D.M. HH:mm when multi-day
      return `${d.getDate()}.${d.getMonth() + 1}. ${d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
    };
  }, [data]);

  const betTooltipLabel = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('cs-CZ', {
      day: 'numeric', month: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        —
      </div>
    );
  }

  const gradient = (
    <defs>
      <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="hsl(var(--success))" stopOpacity={0.35} />
        <stop offset={offset} stopColor="hsl(var(--success))" stopOpacity={0.05} />
        <stop offset={offset} stopColor="hsl(var(--danger))" stopOpacity={0.05} />
        <stop offset="1" stopColor="hsl(var(--danger))" stopOpacity={0.35} />
      </linearGradient>
      <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="hsl(var(--success))" />
        <stop offset={offset} stopColor="hsl(var(--success))" />
        <stop offset={offset} stopColor="hsl(var(--danger))" />
        <stop offset="1" stopColor="hsl(var(--danger))" />
      </linearGradient>
    </defs>
  );

  const axisProps = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11 } as const;
  const refLine = <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />;
  const area = (
    <Area
      type="monotone"
      dataKey="profit"
      stroke="url(#splitStroke)"
      strokeWidth={2}
      fill="url(#splitFill)"
    />
  );

  // ── Bet-by-bet chart ─────────────────────────────────────────────────────────
  if (mode === 'bet-by-bet' && isBetData(data)) {
    return (
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {gradient}
            <XAxis dataKey="ts" tickFormatter={betTickFormatter} {...axisProps} />
            <YAxis {...axisProps} width={50} />
            {refLine}
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(ts) => betTooltipLabel(ts as string)}
              formatter={(value: number) => [formatCurrency(value, currency), 'Profit']}
            />
            {area}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ── Cumulative by day ────────────────────────────────────────────────────────
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {gradient}
          <XAxis
            dataKey="date"
            tickFormatter={(d) => formatDate(d).slice(0, 5)}
            {...axisProps}
          />
          <YAxis {...axisProps} width={50} />
          {refLine}
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(d) => formatDate(d as string)}
            formatter={(value: number) => [formatCurrency(value, currency), 'Profit']}
          />
          {area}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
