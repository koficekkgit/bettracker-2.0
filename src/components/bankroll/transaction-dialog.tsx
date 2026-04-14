'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddTransaction } from '@/hooks/use-bankroll';
import type { BookmakerAccount } from '@/lib/bankroll';

export function TransactionDialog({
  open,
  onOpenChange,
  account,
  kind,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: BookmakerAccount;
  kind: 'deposit' | 'withdrawal';
}) {
  const t = useTranslations();
  const add = useAddTransaction();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) {
      toast.error(t('bankroll.invalidAmount'));
      return;
    }
    try {
      await add.mutateAsync({
        account_id: account.id,
        kind,
        amount: kind === 'deposit' ? n : -n,
        notes: notes.trim() || null,
      });
      toast.success(kind === 'deposit' ? t('bankroll.depositSaved') : t('bankroll.withdrawalSaved'));
      setAmount('');
      setNotes('');
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(msg);
    }
  }

  const title = kind === 'deposit' ? t('bankroll.deposit') : t('bankroll.withdraw');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{account.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('bankroll.amount')} ({account.currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>{t('bankroll.notes')} ({t('common.optional')})</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={add.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
