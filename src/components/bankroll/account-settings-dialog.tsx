'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAccount } from '@/hooks/use-bankroll';
import type { BookmakerAccount } from '@/lib/bankroll';

export function AccountSettingsDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: BookmakerAccount;
}) {
  const t = useTranslations();
  const update = useUpdateAccount();
  const [name, setName] = useState(account.name);
  const [hardLimit, setHardLimit] = useState(account.hard_limit);
  const [lowBalance, setLowBalance] = useState(
    account.low_balance_threshold?.toString() ?? ''
  );

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({
        id: account.id,
        name: name.trim(),
        hard_limit: hardLimit,
        low_balance_threshold: lowBalance ? parseFloat(lowBalance) : null,
      });
      toast.success(t('bankroll.settingsSaved'));
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">{t('bankroll.accountSettings')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('bankroll.accountName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('bankroll.lowBalanceThreshold')}</Label>
            <Input
              type="number"
              step="0.01"
              value={lowBalance}
              onChange={(e) => setLowBalance(e.target.value)}
              placeholder={t('common.none')}
            />
            <p className="text-xs text-muted-foreground">{t('bankroll.lowBalanceHint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hard-limit-edit"
              checked={hardLimit}
              onChange={(e) => setHardLimit(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="hard-limit-edit" className="cursor-pointer">
              {t('bankroll.hardLimit')}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">{t('bankroll.hardLimitHint')}</p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
