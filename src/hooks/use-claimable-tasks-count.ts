'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBets } from './use-bets';
import { TASKS, getDailyKey, getWeeklyKey } from '@/lib/tasks';

export function useClaimableTasksCount(): number {
  const { data: bets = [] } = useBets();
  const dailyKey  = getDailyKey();
  const weeklyKey = getWeeklyKey();

  const { data: claimedSet = new Set<string>() } = useQuery({
    queryKey: ['claimed-tasks-count', dailyKey, weeklyKey],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('claimed_tasks')
        .select('task_id, period_key')
        .in('period_key', [dailyKey, weeklyKey]);
      return new Set((data ?? []).map((r: any) => `${r.task_id}::${r.period_key}`));
    },
    staleTime: 2 * 60 * 1000,
  });

  return useMemo(() => {
    let count = 0;
    for (const task of TASKS) {
      const periodKey = task.period === 'daily' ? dailyKey : weeklyKey;
      const ck = `${task.id}::${periodKey}`;
      if (task.getProgress(bets, periodKey) >= task.target && !claimedSet.has(ck)) {
        count++;
      }
    }
    return count;
  }, [bets, claimedSet, dailyKey, weeklyKey]);
}
