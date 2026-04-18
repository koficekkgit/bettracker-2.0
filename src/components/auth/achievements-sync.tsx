'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBets } from '@/hooks/use-bets';
import { buildAchievementContext, getEarnedAchievements } from '@/lib/achievements';

/**
 * Invisible component — syncs achievements_count to profile on every app load.
 * Mounted in app layout so it runs automatically for every logged-in user.
 */
export function AchievementsSync() {
  const { data: bets } = useBets();

  useEffect(() => {
    if (!bets) return;

    const ctx = buildAchievementContext(bets);
    const earned = getEarnedAchievements(ctx).length;

    const supabase = createClient();
    supabase.rpc('sync_achievements_count', { p_count: earned });
  }, [bets]);

  return null;
}
