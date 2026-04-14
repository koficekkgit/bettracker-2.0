'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { BookmakerAccount, BankrollTransaction } from '@/lib/bankroll';

/**
 * Načte všechny transakce všech účtů (pro 'all' scope) nebo jen jednoho účtu
 * a zkonstruuje časovou řadu kumulativního balance.
 */
function useAllTransactions() {
  const supabase = createClient();
  return useQuery({
    queryKey: ['bankroll-transactions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bankroll_transactions')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as BankrollTransaction[];
    },
  });
}

export function BalanceChart({
  scope,
  accounts,
}: {
  scope: 'all' | string;
  accounts: BookmakerAccount[];
}) {
  const t = useTranslations();
  const { data: allTxs, isLoading } = useAllTransactions();

  const chartData = useMemo(() => {
    if (!allTxs) return [];
    const filtered = scope === 'all' ? allTxs : allTxs.filter((t) => t.account_id === scope);
    if (filtered.length === 0) return [];

    let running = 0;
    const points: { date: string; balance: number }[] = [];
    for (const tx of filtered) {
      running += Number(tx.amount);
      points.push({
        date: new Date(tx.created_at).toLocaleDateString(),
        balance: Math.round(running * 100) / 100,
      });
    }
    // Agregujeme po dnech (poslední hodnota dne)
    const byDay = new Map<string, number>();
    for (const p of points) {
      byDay.set(p.date, p.balance);
    }
    return Array.from(byDay.entries()).map(([date, balance]) => ({ date, balance }));
  }, [allTxs, scope]);

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">{t('common.loading')}</div>;
  }

  if (chartData.length === 0) {
    return (
      <div className="text-muted-foreground text-sm text-center py-8">
        {t('bankroll.noChartData')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
