'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Props {
  data: { date: string; profit: number }[];
  currency?: string;
  mode?: 'cumulative' | 'daily';
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  },
};

export function ProfitChart({ data, currency = 'CZK', mode = 'cumulative' }: Props) {
  // Offset for gradient split at zero (only for cumulative area chart)
  const offset = useMemo(() => {
    if (data.length === 0) return 0.5;
    const values = data.map((d) => d.profit);
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        —
      </div>
    );
  }

  const commonAxisProps = {
    stroke: 'hsl(var(--muted-foreground))',
    fontSize: 11,
  } as const;

  if (mode === 'daily') {
    return (
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d).slice(0, 5)}
              {...commonAxisProps}
            />
            <YAxis {...commonAxisProps} width={50} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Tooltip
              {...tooltipStyle}
              labelFormatter={(d) => formatDate(d as string)}
              formatter={(value: number) => [formatCurrency(value, currency), 'Profit']}
            />
            <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Cumulative area chart
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          <XAxis
            dataKey="date"
            tickFormatter={(d) => formatDate(d).slice(0, 5)}
            {...commonAxisProps}
          />
          <YAxis {...commonAxisProps} width={50} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(d) => formatDate(d as string)}
            formatter={(value: number) => [formatCurrency(value, currency), 'Profit']}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="url(#splitStroke)"
            strokeWidth={2}
            fill="url(#splitFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
