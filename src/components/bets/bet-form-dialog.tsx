'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCreateBet, useUpdateBet, useCategories } from '@/hooks/use-bets';
import { CURRENCIES, BOOKMAKERS } from '@/lib/utils';
import {
  serializeSurebetLegs,
  parseSurebetLegs,
  computeSurebetStatus,
  computeSurebetPayout,
  defaultSurebetLegs,
} from '@/lib/surebet';
import type { Bet, BetInput, BetStatus, BetType, SurebetLeg } from '@/lib/types';

const MATCH_SEP = ' | ';

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Bet | null;
  mode?: 'edit' | 'duplicate';
}

export function BetFormDialog({ open, onClose, initial, mode = 'edit' }: Props) {
  const t = useTranslations();
  const create = useCreateBet();
  const update = useUpdateBet();
  const { data: categories = [] } = useCategories();

  const isDuplicate = mode === 'duplicate' && !!initial;
  const isEdit = mode === 'edit' && !!initial;

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

  // For accumulator bets: individual match rows
  const [matches, setMatches] = useState<string[]>(['', '']);

  // For surebet: individual leg rows
  const [sbLegs, setSbLegs] = useState<SurebetLeg[]>(defaultSurebetLegs());

  useEffect(() => {
    if (initial) {
      const betType = initial.bet_type;
      const desc = initial.description;
      const rawNotes = initial.notes ?? '';

      setForm({
        placed_at: mode === 'duplicate' ? new Date().toISOString().slice(0, 10) : initial.placed_at,
        description: desc,
        bet_type: betType,
        pick: initial.pick ?? '',
        stake: Number(initial.stake),
        odds: Number(initial.odds),
        currency: initial.currency,
        status: mode === 'duplicate' ? 'pending' : initial.status,
        payout: mode === 'duplicate' ? undefined : (initial.payout ?? undefined),
        bookmaker: initial.bookmaker,
        category_id: initial.category_id,
        tags: initial.tags ?? [],
        notes: rawNotes,
      });

      if (betType === 'accumulator') {
        const parts = desc.split(MATCH_SEP).filter((p) => p.length > 0);
        setMatches(parts.length >= 2 ? parts : [...parts, ...Array(2 - parts.length).fill('')]);
        setSbLegs(defaultSurebetLegs());
      } else if (betType === 'surebet') {
        const parsed = parseSurebetLegs(rawNotes);
        setSbLegs(
          parsed && parsed.length >= 2
            ? mode === 'duplicate'
              ? parsed.map((l) => ({ ...l, status: 'pending' as const }))
              : parsed
            : defaultSurebetLegs()
        );
        setMatches(['', '']);
      } else {
        setMatches(['', '']);
        setSbLegs(defaultSurebetLegs());
      }
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
      setMatches(['', '']);
      setSbLegs(defaultSurebetLegs());
    }
  }, [initial, open, mode]);

  function handleBetTypeChange(newType: BetType) {
    setForm((f) => ({ ...f, bet_type: newType }));
    if (newType === 'accumulator') {
      const parts = form.description.split(MATCH_SEP).filter((p) => p.length > 0);
      setMatches(parts.length >= 2 ? parts : parts.length === 1 ? [parts[0], ''] : ['', '']);
    }
  }

  // --- Accumulator helpers ---
  function updateMatch(idx: number, value: string) {
    const next = [...matches];
    next[idx] = value;
    setMatches(next);
  }
  function addMatch() { setMatches((m) => [...m, '']); }
  function removeMatch(idx: number) { setMatches((m) => m.filter((_, i) => i !== idx)); }

  // --- Surebet helpers ---
  function updateSbLeg(idx: number, patch: Partial<SurebetLeg>) {
    setSbLegs((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function addSbLeg() { setSbLegs((prev) => [...prev, { bookmaker: '', odds: 2.0, stake: 0, status: 'pending' }]); }
  function removeSbLeg(idx: number) { setSbLegs((prev) => prev.filter((_, i) => i !== idx)); }

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let finalForm: BetInput;

    if (form.bet_type === 'accumulator') {
      finalForm = {
        ...form,
        description: matches.map((m) => m.trim()).filter((m) => m.length > 0).join(MATCH_SEP),
      };
    } else if (form.bet_type === 'surebet') {
      const totalStake = sbLegs.reduce((s, l) => s + (Number(l.stake) || 0), 0);
      const status = computeSurebetStatus(sbLegs);
      const payout = computeSurebetPayout(sbLegs);
      finalForm = {
        ...form,
        stake: totalStake,
        odds: 1,
        status,
        payout: payout ?? undefined,
        bookmaker: null,
        notes: serializeSurebetLegs(sbLegs),
      };
    } else {
      finalForm = form;
    }

    if (isEdit) {
      await update.mutateAsync({ id: initial!.id, ...finalForm });
    } else {
      await create.mutateAsync(finalForm);
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

  const isSurebet = form.bet_type === 'surebet';
  const isAccumulator = form.bet_type === 'accumulator';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isEdit ? t('bets.editBet') : isDuplicate ? t('bets.duplicateBet') : t('bets.addBet')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Date + Type */}
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
                onChange={(e) => handleBetTypeChange(e.target.value as BetType)}
              >
                <option value="single">{t('bets.single')}</option>
                <option value="accumulator">{t('bets.accumulator')}</option>
                <option value="surebet">{t('bets.surebet')}</option>
              </Select>
            </div>
          </div>

          {/* Description — varies by type */}
          {isAccumulator ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('bets.description')}</Label>
                <button
                  type="button"
                  onClick={addMatch}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {t('bets.addMatch') as string}
                </button>
              </div>
              <div className="space-y-2">
                {matches.map((match, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                    <Input
                      required={idx === 0}
                      placeholder={t('bets.descriptionPlaceholder')}
                      value={match}
                      onChange={(e) => updateMatch(idx, e.target.value)}
                    />
                    {matches.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMatch(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('bets.description')}</Label>
              <Input
                required
                placeholder={t('bets.descriptionPlaceholder')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          )}

          {/* Pick — single only */}
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

          {/* Surebet legs */}
          {isSurebet && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('bets.surebetLegs')}</Label>
                <button
                  type="button"
                  onClick={addSbLeg}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {t('bets.addLeg') as string}
                </button>
              </div>

              {sbLegs.map((leg, idx) => (
                <div key={idx} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('bets.leg')} {idx + 1}
                    </span>
                    {sbLegs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeSbLeg(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('bets.bookmaker')}</Label>
                      <Select
                        value={leg.bookmaker}
                        onChange={(e) => updateSbLeg(idx, { bookmaker: e.target.value })}
                      >
                        <option value="">—</option>
                        {BOOKMAKERS.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('bets.odds')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={leg.odds}
                        onChange={(e) => updateSbLeg(idx, { odds: parseFloat(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('bets.stake')}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={leg.stake}
                        onChange={(e) => updateSbLeg(idx, { stake: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('bets.result')}</Label>
                      <Select
                        value={leg.status}
                        onChange={(e) => updateSbLeg(idx, { status: e.target.value as SurebetLeg['status'] })}
                      >
                        <option value="pending">{t('bets.statusPending')}</option>
                        <option value="won">{t('bets.statusWon')}</option>
                        <option value="lost">{t('bets.statusLost')}</option>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Surebet summary */}
              <div className="flex gap-4 text-xs text-muted-foreground px-1">
                <span>
                  {t('bets.totalStake')}:{' '}
                  <span className="text-foreground font-medium">
                    {sbLegs.reduce((s, l) => s + (Number(l.stake) || 0), 0).toFixed(2)} {form.currency}
                  </span>
                </span>
                {sbLegs.some((l) => l.status === 'won') && (
                  <span>
                    {t('bets.expectedReturn')}:{' '}
                    <span className="text-success font-medium">
                      +{(
                        sbLegs
                          .filter((l) => l.status === 'won')
                          .reduce((s, l) => s + l.stake * l.odds - l.stake, 0)
                      ).toFixed(2)} {form.currency}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stake / Odds / Currency — hidden for surebet */}
          {!isSurebet && (
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
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Currency alone for surebet */}
          {isSurebet && (
            <div className="space-y-2">
              <Label>{t('bets.currency')}</Label>
              <Select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          )}

          {/* Status + Bookmaker — hidden for surebet (auto-computed) */}
          {!isSurebet && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('bets.status')}</Label>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as BetStatus })}
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{t(s.key as any)}</option>
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
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {/* Category + Payout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('bets.category')}</Label>
              <Select
                value={form.category_id ?? ''}
                onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            {!isSurebet && (form.status === 'cashout' || form.status === 'half_won') && (
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

          {/* Tags */}
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

          {/* Notes — hidden for surebet (used internally) */}
          {!isSurebet && (
            <div className="space-y-2">
              <Label>{t('bets.notes')}</Label>
              <Input
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          )}

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
