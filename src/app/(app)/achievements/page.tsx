'use client';

import { useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ProGate } from '@/components/subscription/pro-gate';
import { useBets } from '@/hooks/use-bets';
import {
  ACHIEVEMENTS,
  buildAchievementContext,
  getEarnedAchievements,
} from '@/lib/achievements';
import { BadgeGrid } from '@/components/achievements/badge-grid';
import { createClient } from '@/lib/supabase/client';

export default function AchievementsPage() {
  return (
    <ProGate feature="achievements">
      <Content />
    </ProGate>
  );
}

function Content() {
  const t = useTranslations();
  const { data: bets, isLoading } = useBets();

  const { ctx, earnedIds } = useMemo(() => {
    if (!bets) return { ctx: null, earnedIds: new Set<string>() };
    const c = buildAchievementContext(bets);
    return { ctx: c, earnedIds: new Set(getEarnedAchievements(c)) };
  }, [bets]);

  const earned = earnedIds.size;

  // Sync přes RPC (obchází RLS) — při každé změně earned
  useEffect(() => {
    if (!ctx) return;
    const supabase = createClient();
    supabase.rpc('sync_achievements_count', { p_count: earned }).catch((err) => {
      console.error('[achievements] sync failed:', err);
    });
  }, [ctx, earned]);

  if (isLoading || !ctx) {
    return <div className="text-muted-foreground">{t('common.loading')}</div>;
  }

  const total = ACHIEVEMENTS.length;
  const percent = Math.round((earned / total) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('achievements.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('achievements.subtitle')}</p>
        </div>
      </div>

      {/* Souhrn */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">
                {t('achievements.level')} {earned}
              </div>
              <div className="text-sm text-muted-foreground">
                {earned} / {total} {t('achievements.earnedCount')}
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <BadgeGrid ctx={ctx} earnedIds={earnedIds} />
    </div>
  );
}
