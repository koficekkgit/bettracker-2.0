'use client';

import { useMemo } from 'react';
import { useBets } from './use-bets';
import { buildAchievementContext, getEarnedAchievements } from '@/lib/achievements';

const STORAGE_KEY = 'sm_ach_seen_count';

export function useNewAchievementsCount(): number {
  const { data: bets = [] } = useBets();

  return useMemo(() => {
    if (typeof window === 'undefined') return 0;
    const ctx = buildAchievementContext(bets);
    const earned = getEarnedAchievements(ctx).length;
    const seen = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    return Math.max(0, earned - seen);
  }, [bets]);
}

export function markAchievementsSeen(earnedCount: number) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(earnedCount));
  }
}
