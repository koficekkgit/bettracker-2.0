'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProGate } from '@/components/subscription/pro-gate';
import { useBets } from '@/hooks/use-bets';
import { useCategories } from '@/hooks/use-bets';
import type { Bet } from '@/lib/types';
import {
  generateInsights,
  breakdownByCategory,
  breakdownByBookmaker,
  breakdownByOddsRange,
  breakdownByWeekday,
  type Breakdown,
} from '@/lib/insights';

export function InsightsPanel({ bets }: { bets?: Bet[] }) {
  return (
    <ProGate feature="insights">
      <InsightsContent bets={bets} />
    </ProGate>
  );
}

function InsightsContent({ bets: betsProp }: { bets?: Bet[] }) {
  const t = useTranslations();
  const { data: betsHook } = useBets();
  const { data: categories } = useCategories();
  const bets = betsProp ?? betsHook;

  const categoryNames = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories]
  );

  const weekdayLabels = [
    t('insights.weekdays.mon'),
    t('insights.weekdays.tue'),
    t('insights.weekdays.wed'),
    t('insights.weekdays.thu'),
    t('insights.weekdays.fri'),
    t('insights.weekdays.sat'),
    t('insights.weekdays.sun'),
  ];

  const data = useMemo(() => {
    if (!bets) return null;
    return {
      insights: generateInsights(bets, categoryNames),
      byCategory: breakdownByCategory(bets, categoryNames),
      byBookmaker: breakdownByBookmaker(bets),
      byOddsRange: breakdownByOddsRange(bets),
      byWeekday: breakdownByWeekday(bets, weekdayLabels),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bets, categoryNames]);

  if (!data) return <div className="text-muted-foreground">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('insights.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('insights.notEnoughData')}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.insights.map((ins) => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BreakdownTable
        title={t('insights.byCategory')}
        data={data.byCategory}
      />
      <BreakdownTable
        title={t('insights.byBookmaker')}
        data={data.byBookmaker}
      />
      <BreakdownTable
        title={t('insights.byOddsRange')}
        data={data.byOddsRange}
      />
      <BreakdownTable
        title={t('insights.byWeekday')}
        data={data.byWeekday}
      />
    </div>
  );
}

function InsightCard({
  insight,
}: {
  insight: { id: string; type: 'positive' | 'negative' | 'neutral'; titleKey: string; params?: Record<string, string | number> };
}) {
  const t = useTranslations();
  const Icon = insight.type === 'positive' ? TrendingUp : TrendingDown;
  const colorClass =
    insight.type === 'positive'
      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500'
      : insight.type === 'negative'
        ? 'border-destructive/30 bg-destructive/5 text-destructive'
        : 'border-border bg-muted/30 text-muted-foreground';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = t(insight.titleKey as any, insight.params as any);

  return (
    <div className={`border rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="text-sm font-medium text-foreground">{text}</div>
      </div>
    </div>
  );
}

function BreakdownTable({ title, data }: { title: string; data: Breakdown[] }) {
  const t = useTranslations();
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left p-3 font-normal">{t('insights.col.label')}</th>
                <th className="text-right p-3 font-normal">{t('insights.col.bets')}</th>
                <th className="text-right p-3 font-normal">{t('insights.col.winRate')}</th>
                <th className="text-right p-3 font-normal">{t('insights.col.profit')}</th>
                <th className="text-right p-3 font-normal">{t('insights.col.roi')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{row.label}</td>
                  <td className="p-3 text-right text-muted-foreground">{row.bets}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {row.winRate.toFixed(0)}%
                  </td>
                  <td
                    className={`p-3 text-right font-medium ${row.profit >= 0 ? 'text-emerald-500' : 'text-destructive'}`}
                  >
                    {row.profit >= 0 ? '+' : ''}
                    {row.profit.toFixed(0)}
                  </td>
                  <td
                    className={`p-3 text-right font-semibold ${row.roi >= 0 ? 'text-emerald-500' : 'text-destructive'}`}
                  >
                    {row.roi >= 0 ? '+' : ''}
                    {row.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
