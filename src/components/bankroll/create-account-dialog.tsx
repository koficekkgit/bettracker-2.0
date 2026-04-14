'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAccount } from '@/hooks/use-bankroll';
import { BOOKMAKER_TEMPLATES } from '@/lib/bankroll';

const CURRENCIES = ['CZK', 'EUR', 'USD', 'GBP', 'PLN'];

export function CreateAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations();
  const create = useCreateAccount();
  const [templateKey, setTemplateKey] = useState<string>('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('CZK');
  const [hardLimit, setHardLimit] = useState(false);
  const [lowBalance, setLowBalance] = useState('');

  if (!open) return null;

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    const tpl = BOOKMAKER_TEMPLATES.find((t) => t.key === key);
    if (tpl) setName(tpl.name);
    else if (key === '') setName('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({
        name: name.trim(),
        template_key: templateKey || null,
        currency,
        hard_limit: hardLimit,
        low_balance_threshold: lowBalance ? parseFloat(lowBalance) : null,
      });
      toast.success(t('bankroll.accountCreated'));
      setTemplateKey('');
      setName('');
      setCurrency('CZK');
      setHardLimit(false);
      setLowBalance('');
      onOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      toast.error(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">{t('bankroll.newAccount')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('bankroll.template')}</Label>
            <select
              value={templateKey}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            >
              <option value="">— {t('bankroll.customBookmaker')} —</option>
              {BOOKMAKER_TEMPLATES.map((tpl) => (
                <option key={tpl.key} value={tpl.key}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t('bankroll.accountName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('bankroll.currency')}</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t('bankroll.lowBalanceThreshold')} ({t('common.optional')})</Label>
            <Input
              type="number"
              step="0.01"
              value={lowBalance}
              onChange={(e) => setLowBalance(e.target.value)}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground">{t('bankroll.lowBalanceHint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hard-limit"
              checked={hardLimit}
              onChange={(e) => setHardLimit(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="hard-limit" className="cursor-pointer">
              {t('bankroll.hardLimit')}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">{t('bankroll.hardLimitHint')}</p>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
