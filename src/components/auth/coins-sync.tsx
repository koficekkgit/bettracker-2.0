'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useBets } from '@/hooks/use-bets';
import { buildAchievementContext, getEarnedAchievements } from '@/lib/achievements';
import { calculateTotalEarned } from '@/lib/coins';

export function CoinsSync() {
  const { data: bets } = useBets();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!bets) return;
    const ctx = buildAchievementContext(bets);
    const earnedIds = new Set(getEarnedAchievements(ctx));
    const totalEarned = calculateTotalEarned(ctx, earnedIds);

    const supabase = createClient();
    void (async () => {
      const { error } = await supabase.rpc('sync_coins', { p_total_earned: totalEarned });
      if (!error) {
        // Refresh profile so sidebar shows updated coin balance
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    })();
  }, [bets, queryClient]);

  return null;
}
