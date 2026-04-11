'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 p-1 bg-secondary rounded-md w-fit">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap',
              value === preset
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t(preset)}
          </button>
        ))}
      </div>

      {value === 'custom' && (
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
