'use client';

import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import type { DateRangePreset, CustomRange } from '@/lib/stats';

const PRESETS: DateRangePreset[] = [
  'today',
  'yesterday',
  'last7days',
  'last30days',
  'last90days',
  'thisMonth',
  'thisYear',
  'all',
  'custom',
];

interface Props {
  value: DateRangePreset;
  onChange: (value: DateRangePreset) => void;
  custom: CustomRange;
  onCustomChange: (custom: CustomRange) => void;
}

export function PeriodSelector({ value, onChange, custom, onCustomChange }: Props) {
  const t = useTranslations('stats');
  const sub = useSubscription();

  function isLocked(preset: DateRangePreset): boolean {
    return !sub.isPro && !sub.isTrial;
  }

  function handleClick(preset: DateRangePreset) {
    if (isLocked(preset)) {
      // Tichý fail, ProGate v UI to vysvětlí
      return;
    }
    onChange(preset);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 p-1 bg-secondary rounded-md w-fit">
        {PRESETS.map((preset) => {
          const locked = isLocked(preset);
          return (
            <button
              key={preset}
              onClick={() => handleClick(preset)}
              disabled={locked}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap inline-flex items-center gap-1',
                value === preset
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                locked && 'opacity-50 cursor-not-allowed hover:text-muted-foreground'
              )}
              title={locked ? 'Pro funkce - vyžaduje předplatné' : undefined}
            >
              {locked && <Lock className="w-3 h-3" />}
              {t(preset)}
            </button>
          );
        })}
      </div>

      {value === 'custom' && sub.isPro && (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded-md border border-border bg-card">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('from')}</Label>
            <Input
              type="date"
              value={custom.from}
              onChange={(e) => onCustomChange({ ...custom, from: e.target.value })}
              className="w-auto"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('to')}</Label>
            <Input
              type="date"
              value={custom.to}
              onChange={(e) => onCustomChange({ ...custom, to: e.target.value })}
              className="w-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
