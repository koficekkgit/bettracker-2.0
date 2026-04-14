'use client';

import { useTranslations } from 'next-intl';
import { ArrowDownCircle, ArrowUpCircle, Gift, Settings2, Dice5, CheckCircle, Clock, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAccountTransactions, useConfirmTransaction } from '@/hooks/use-bankroll';
import type { BookmakerAccount, BankrollTransaction } from '@/lib/bankroll';

type ExtendedTx = BankrollTransaction & { confirmed?: boolean; confirmed_at?: string | null };

const KIND_ICON: Record<BankrollTransaction['kind'], React.ComponentType<{ className?: string }>> = {
  deposit: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  bonus: Gift,
  adjustment: Settings2,
  bet_placed: Dice5,
  bet_settled: CheckCircle,
};

export function AccountDetailDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: BookmakerAccount;
}) {
  const t = useTranslations();
  const { data: txs, isLoading } = useAccountTransactions(open ? account.id : null);
  const confirmTx = useConfirmTransaction();

  if (!open) return null;

  async function handleConfirm(txId: string) {
    try {
      await confirmTx.mutateAsync({ transaction_id: txId, confirmed: true });
      toast.success(t('bankroll.withdrawalConfirmed'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{account.name}</h2>
            <p className="text-sm text-muted-foreground">{t('bankroll.transactionHistory')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t('common.close') ?? 'Close'}
          </Button>
        </div>

        {isLoading && <div className="text-muted-foreground text-sm">{t('common.loading')}</div>}
        {!isLoading && (!txs || txs.length === 0) && (
          <div className="text-muted-foreground text-sm text-center py-8">
            {t('bankroll.noTransactions')}
          </div>
        )}
        {txs && txs.length > 0 && (
          <div className="border border-border rounded-md divide-y divide-border">
            {txs.map((tx) => {
              const ext = tx as ExtendedTx;
              const Icon = KIND_ICON[tx.kind];
              const amount = Number(tx.amount);
              const isPositive = amount >= 0;
              const isPending = tx.kind === 'withdrawal' && ext.confirmed === false;
              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 p-3 ${isPending ? 'bg-amber-500/5' : ''}`}
                >
                  {isPending ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Icon
                      className={`w-5 h-5 ${isPositive ? 'text-emerald-500' : 'text-destructive'}`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {t(`bankroll.txKind.${tx.kind}`)}
                      {isPending && (
                        <span className="text-xs text-amber-500 font-normal">
                          ({t('bankroll.pending')})
                        </span>
                      )}
                    </div>
                    {tx.notes && (
                      <div className="text-xs text-muted-foreground truncate">{tx.notes}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold whitespace-nowrap ${
                      isPositive ? 'text-emerald-500' : 'text-destructive'
                    } ${isPending ? 'opacity-60' : ''}`}
                  >
                    {isPositive ? '+' : ''}
                    {amount.toFixed(2)} {account.currency}
                  </div>
                  {isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConfirm(tx.id)}
                      disabled={confirmTx.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
