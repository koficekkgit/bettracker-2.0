'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSetCurrentBalance } from '@/hooks/use-bankroll';
import type { BookmakerAccount } from '@/lib/bankroll';

export function SetBalanceDialog({
  open,
  onOpenChange,
  account,
  currentBalance,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: BookmakerAccount;
  currentBalance: number;
}) {
  const t = useTranslations();
  const setBalance = useSetCurrentBalance();
  const [value, setValue] = useState(currentBalance.toFixed(2));

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = parseFloat(value);
    if (isNaN(target)) {
      toast.error(t('bankroll.invalidAmount'));
      return;
    }
    try {
      await setBalance.mutateAsync({
        account_id: account.id,
        target_balance: target,
        notes: null,
      });
      toast.success(t('bankroll.balanceSet'));
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-1">{t('bankroll.setCurrentBalance')}</h2>
        <p className="text-sm text-muted-foreground mb-4">{account.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('bankroll.currentBalance')} ({account.currency})</Label>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">{t('bankroll.setBalanceHint')}</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={setBalance.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
