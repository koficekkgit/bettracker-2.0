'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCreateBet, useUpdateBet, useCategories } from '@/hooks/use-bets';
import { CURRENCIES, BOOKMAKERS } from '@/lib/utils';
import type { Bet, BetInput, BetStatus, BetType } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Bet | null;
}

export function BetFormDialog({ open, onClose, initial }: Props) {
  const t = useTranslations();
  const create = useCreateBet();
  const update = useUpdateBet();
  const { data: categories = [] } = useCategories();

  const [form, setForm] = useState<BetInput>({
    placed_at: new Date().toISOString().slice(0, 10),
    description: '',
    bet_type: 'single',
    pick: '',
    stake: 0,
    odds: 1.5,
    currency: 'CZK',
    status: 'pending',
    bookmaker: null,
    category_id: null,
    tags: [],
    notes: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        placed_at: initial.placed_at,
        description: initial.description,
        bet_type: initial.bet_type,
        pick: initial.pick ?? '',
        stake: Number(initial.stake),
        odds: Number(initial.odds),
        currency: initial.currency,
        status: initial.status,
        payout: initial.payout ?? undefined,
        bookmaker: initial.bookmaker,
        category_id: initial.category_id,
        tags: initial.tags ?? [],
        notes: initial.notes ?? '',
      });
    } else {
      setForm({
        placed_at: new Date().toISOString().slice(0, 10),
        description: '',
        bet_type: 'single',
        pick: '',
        stake: 0,
        odds: 1.5,
        currency: 'CZK',
        status: 'pending',
        bookmaker: null,
        category_id: null,
        tags: [],
        notes: '',
      });
    }
  }, [initial, open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (initial) {
      await update.mutateAsync({ id: initial.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  }

  const statuses: { value: BetStatus; key: string }[] = [
    { value: 'pending', key: 'bets.statusPending' },
    { value: 'won', key: 'bets.statusWon' },
    { value: 'lost', key: 'bets.statusLost' },
    { value: 'void', key: 'bets.statusVoid' },
    { value: 'cashout', key: 'bets.statusCashout' },
    { value: 'half_won', key: 'bets.statusHalfWon' },
    { value: 'half_lost', key: 'bets.statusHalfLost' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">{initial ? t('bets.editBet') : t('bets.addBet')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('bets.date')}</Label>
              <Input
                type="date"
                required
                value={form.placed_at}
                onChange={(e) => setForm({ ...form, placed_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('bets.type')}</Label>
              <Select
                value={form.bet_type}
                onChange={(e) => setForm({ ...form, bet_type: e.target.value as BetType })}
              >
                <option value="single">{t('bets.single')}</option>
                <option value="accumulator">{t('bets.accumulator')}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('bets.description')}</Label>
            <Input
              required
              placeholder={t('bets.descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {form.bet_type === 'single' && (
            <div className="space-y-2">
              <Label>{t('bets.pick')}</Label>
              <Input
                placeholder={t('bets.pickPlaceholder')}
                value={form.pick ?? ''}
                onChange={(e) => setForm({ ...form, pick: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('bets.stake')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.stake}
                onChange={(e) => setForm({ ...form, stake: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('bets.odds')}</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                required
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('bets.currency')}</Label>
              <Select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('bets.status')}</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BetStatus })}
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(s.key as any)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('bets.bookmaker')}</Label>
              <Select
                value={form.bookmaker ?? ''}
                onChange={(e) => setForm({ ...form, bookmaker: e.target.value || null })}
              >
                <option value="">—</option>
                {BOOKMAKERS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('bets.category')}</Label>
              <Select
                value={form.category_id ?? ''}
                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            {(form.status === 'cashout' || form.status === 'half_won') && (
              <div className="space-y-2">
                <Label>{t('bets.payout')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.payout ?? ''}
                  onChange={(e) => setForm({ ...form, payout: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('bets.tags')}</Label>
            <Input
              placeholder={t('bets.tagsPlaceholder')}
              value={(form.tags ?? []).join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter((t) => t.length > 0),
                })
              }
            />
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('bets.notes')}</Label>
            <Input
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
