import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  hint?: string;
  hintColor?: 'success' | 'danger' | 'muted';
}

export function StatCard({ label, value, hint, hintColor = 'muted' }: Props) {
  return (
    <div className="rounded-lg bg-secondary p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && (
        <p
          className={cn(
            'mt-1 text-xs',
            hintColor === 'success' && 'text-success',
            hintColor === 'danger' && 'text-danger',
            hintColor === 'muted' && 'text-muted-foreground'
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
