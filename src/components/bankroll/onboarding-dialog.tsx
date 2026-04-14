'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet } from 'lucide-react';
import {
  useSetCurrentBalance,
  useMarkBankrollOnboarded,
} from '@/hooks/use-bankroll';
import type { BookmakerAccount } from '@/lib/bankroll';
import type { ExtendedAccountBalance } from '@/hooks/use-bankroll';

export function BankrollOnboardingDialog({
  open,
  onClose,
  accounts,
  balances,
}: {
  open: boolean;
  onClose: () => void;
  accounts: BookmakerAccount[];
  balances: ExtendedAccountBalance[];
}) {
  const t = useTranslations();
  const setBalance = useSetCurrentBalance();
  const markDone = useMarkBankrollOnboarded();

  const balanceMap = useMemo(
    () => new Map(balances.map((b) => [b.account_id, b.balance])),
    [balances]
  );

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleFinish() {
    setSubmitting(true);
    try {
      // Pro každý účet, kde user zadal hodnotu, zavoláme set balance
      for (const acc of accounts) {
        const raw = values[acc.id];
        if (raw === undefined || raw === '') continue;
        const target = parseFloat(raw);
        if (isNaN(target)) continue;
        await setBalance.mutateAsync({
          account_id: acc.id,
          target_balance: target,
          notes: 'Počáteční nastavení balance',
        });
      }
      await markDone.mutateAsync();
      toast.success(t('bankroll.balanceSet'));
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    try {
      await markDone.mutateAsync();
      onClose();
    } catch {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">{t('bankroll.onboardingTitle')}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bankroll.onboardingDescription')}
        </p>

        {accounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t('bankroll.noAccounts')}
          </div>
        )}

        <div className="space-y-3">
          {accounts.map((acc) => {
            const current = Number(balanceMap.get(acc.id) ?? 0);
            return (
              <div key={acc.id} className="border border-border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{acc.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('bankroll.balance')}: {current.toFixed(2)} {acc.currency}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t('bankroll.setCurrentBalance')} ({acc.currency})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t('bankroll.currentBalance')}
                    value={values[acc.id] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [acc.id]: e.target.value }))
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-4">{t('bankroll.setBalanceHint')}</p>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={handleSkip} disabled={submitting}>
            {t('bankroll.onboardingSkip')}
          </Button>
          <Button onClick={handleFinish} disabled={submitting || accounts.length === 0}>
            {submitting ? t('common.loading') : t('bankroll.onboardingFinish')}
          </Button>
        </div>
      </div>
    </div>
  );
}
