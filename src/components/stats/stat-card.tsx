import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  hint?: string;
  hintColor?: 'success' | 'danger' | 'muted';
  compareValue?: string;
  compareDelta?: { label: string; positive: boolean | null };
}

export function StatCard({ label, value, hint, hintColor = 'muted', compareValue, compareDelta }: Props) {
  return (
    <div className="rounded-lg bg-secondary p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && (
        <p className={cn(
          'mt-1 text-xs',
          hintColor === 'success' && 'text-success',
          hintColor === 'danger'  && 'text-danger',
          hintColor === 'muted'   && 'text-muted-foreground',
        )}>
          {hint}
        </p>
      )}
      {compareValue !== undefined && (
        <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{compareValue}</span>
          {compareDelta && (
            <span className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
              compareDelta.positive === true  && 'bg-success/10 text-success',
              compareDelta.positive === false && 'bg-danger/10 text-danger',
              compareDelta.positive === null  && 'bg-secondary text-muted-foreground',
            )}>
              {compareDelta.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
