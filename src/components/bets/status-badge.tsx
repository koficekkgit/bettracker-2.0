import { useTranslations } from 'next-intl';
import type { BetStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLORS: Record<BetStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  won: 'bg-success/15 text-success',
  lost: 'bg-danger/15 text-danger',
  void: 'bg-muted text-muted-foreground',
  cashout: 'bg-secondary text-foreground',
  half_won: 'bg-success/10 text-success',
  half_lost: 'bg-danger/10 text-danger',
};

const KEYS: Record<BetStatus, string> = {
  pending: 'bets.statusPending',
  won: 'bets.statusWon',
  lost: 'bets.statusLost',
  void: 'bets.statusVoid',
  cashout: 'bets.statusCashout',
  half_won: 'bets.statusHalfWon',
  half_lost: 'bets.statusHalfLost',
};

export function StatusBadge({ status }: { status: BetStatus }) {
  const t = useTranslations();
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', COLORS[status])}>
      {t(KEYS[status] as any)}
    </span>
  );
}
