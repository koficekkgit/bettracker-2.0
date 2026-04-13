'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreatePayoutGroup } from '@/hooks/use-payouts';

export function CreateGroupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations();
  const create = useCreatePayoutGroup();
  const [name, setName] = useState('');
  const [profitMember, setProfitMember] = useState(60);
  const [lossMember, setLossMember] = useState(50);
  const [referPct, setReferPct] = useState(25);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({
        name: name.trim(),
        profit_split_member: profitMember,
        profit_split_owner: 100 - profitMember,
        loss_split_member: lossMember,
        loss_split_owner: 100 - lossMember,
        referrer_share_pct: referPct,
      });
      toast.success(t('payouts.groupCreated'));
      setName('');
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">{t('payouts.newGroup')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('payouts.groupName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>
              {t('payouts.profitSplitMember')} (%) — {t('payouts.owner')}: {100 - profitMember}%
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={profitMember}
              onChange={(e) => setProfitMember(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t('payouts.lossSplitMember')} (%) — {t('payouts.owner')}: {100 - lossMember}%
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={lossMember}
              onChange={(e) => setLossMember(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('payouts.referrerShare')} (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={referPct}
              onChange={(e) => setReferPct(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">{t('payouts.referrerShareHint')}</p>
          </div>
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
