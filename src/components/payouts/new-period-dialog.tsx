'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClosePeriod, type PayoutGroup, type PayoutMember } from '@/hooks/use-payouts';

/**
 * Frontend preview počítá totéž co close_payout_period v DB,
 * ale BEZ refer balance carry-forward (ten zná jen DB).
 * Preview tedy ukazuje "raw" čísla, přesný výpočet proběhne při uložení.
 */
function computePreview(
  pnl: number,
  group: PayoutGroup,
  hasReferrer: boolean,
): { member: number; owner: number; refer: number } {
  if (pnl >= 0) {
    const member = (pnl * group.profit_split_member) / 100;
    let owner = (pnl * group.profit_split_owner) / 100;
    let refer = 0;
    if (hasReferrer && group.referrer_share_pct > 0) {
      refer = (owner * group.referrer_share_pct) / 100;
      owner -= refer;
    }
    return { member, owner, refer };
  } else {
    const member = (pnl * group.loss_split_member) / 100;
    const owner = (pnl * group.loss_split_owner) / 100;
    let refer = 0;
    if (hasReferrer && group.referrer_share_pct > 0) {
      // refer dostává záporný zápis, majitel platí plnou ztrátu
      refer = (owner * group.referrer_share_pct) / 100;
    }
    return { member, owner, refer };
  }
}

export function NewPeriodDialog({
  open,
  onOpenChange,
  group,
  members,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: PayoutGroup;
  members: PayoutMember[];
}) {
  const t = useTranslations();
  const close = useClosePeriod();
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [pnls, setPnls] = useState<Record<string, string>>({});

  const previews = useMemo(() => {
    return members.map((m) => {
      const raw = pnls[m.id] ?? '';
      const pnl = parseFloat(raw);
      if (isNaN(pnl)) return { member: m, pnl: null, preview: null };
      return {
        member: m,
        pnl,
        preview: computePreview(pnl, group, !!m.referrer_member_id),
      };
    });
  }, [pnls, members, group]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error(t('payouts.labelRequired'));
      return;
    }
    const entries = previews
      .filter((p) => p.pnl !== null)
      .map((p) => ({ member_id: p.member.id, pnl: p.pnl as number }));
    if (!entries.length) {
      toast.error(t('payouts.noEntries'));
      return;
    }
    try {
      await close.mutateAsync({
        group_id: group.id,
        label: label.trim(),
        notes: notes.trim() || null,
        entries,
      });
      toast.success(t('payouts.periodClosed'));
      setLabel('');
      setNotes('');
      setPnls({});
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{t('payouts.newPeriod')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('payouts.periodLabel')}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Duben 2026"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('payouts.notes')} ({t('common.optional')})</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('payouts.memberPnls')}</Label>
            <p className="text-xs text-muted-foreground">{t('payouts.pnlHint')}</p>
            <div className="border border-border rounded-md divide-y divide-border">
              {previews.map(({ member, pnl, preview }) => (
                <div key={member.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-medium">
                      {member.display_name ?? member.user_id?.slice(0, 8)}
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="P/L"
                      className="w-32"
                      value={pnls[member.id] ?? ''}
                      onChange={(e) =>
                        setPnls((prev) => ({ ...prev, [member.id]: e.target.value }))
                      }
                    />
                  </div>
                  {preview && pnl !== null && (
                    <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                      <span>{t('payouts.member')}: {preview.member.toFixed(2)}</span>
                      <span>{t('payouts.owner')}: {preview.owner.toFixed(2)}</span>
                      {member.referrer_member_id && (
                        <span>{t('payouts.refer')}: {preview.refer.toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t('payouts.previewNote')}</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={close.isPending}>
              {t('payouts.closeAndSave')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
