'use client';

import { useMemo } from 'react';
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Props {
  data: { date: string; profit: number }[];
  currency?: string;
}

export function ProfitChart({ data, currency = 'CZK' }: Props) {
  // Spočítej kde je nulová linie v rozsahu [0..1] osy Y (1 = dole, 0 = nahoře)
  // - pro gradient stops potřebujeme vědět, kde leží 0 mezi min a max
  const offset = useMemo(() => {
    if (data.length === 0) return 0.5;
    const values = data.map((d) => d.profit);
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max <= 0) return 0; // celý graf v záporu
    if (min >= 0) return 1; // celý graf v plusu
    return max / (max - min);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
        —
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {/* Gradient pro výplň plochy - zelená nahoře, červená dole */}
            <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="hsl(var(--success))" stopOpacity={0.35} />
              <stop offset={offset} stopColor="hsl(var(--success))" stopOpacity={0.05} />
              <stop offset={offset} stopColor="hsl(var(--danger))" stopOpacity={0.05} />
              <stop offset="1" stopColor="hsl(var(--danger))" stopOpacity={0.35} />
            </linearGradient>
            {/* Gradient pro samotnou čáru - ostrý přechod přesně v nule */}
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
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={50} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
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
