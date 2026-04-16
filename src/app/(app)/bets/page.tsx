'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Search, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/bets/status-badge';
import { BetFormDialog } from '@/components/bets/bet-form-dialog';
import { useBets, useDeleteBet } from '@/hooks/use-bets';
import { calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { parseSurebetLegs } from '@/lib/surebet';
import { BOOKMAKERS } from '@/lib/utils';
import type { Bet, BetStatus } from '@/lib/types';

export default function BetsPage() {
  const t = useTranslations();
  const { data: bets = [], isLoading } = useBets();
  const deleteBet = useDeleteBet();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bet | null>(null);
  const [formMode, setFormMode] = useState<'edit' | 'duplicate'>('edit');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BetStatus | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Vysbírej všechny unikátní tagy z DB
  const allTags = useMemo(() => {
    const set = new Set<string>();
    bets.forEach((b) => (b.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [bets]);

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (tagFilter !== 'all') {
        if (tagFilter === '__none__' && (b.tags ?? []).length > 0) return false;
        if (tagFilter !== '__none__' && !(b.tags ?? []).includes(tagFilter)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          b.description.toLowerCase().includes(q) ||
          (b.pick?.toLowerCase().includes(q) ?? false) ||
          (b.notes?.toLowerCase().includes(q) ?? false) ||
          (b.tags ?? []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [bets, search, statusFilter, tagFilter]);

  function handleEdit(bet: Bet) {
    setEditing(bet);
    setFormMode('edit');
    setFormOpen(true);
  }

  function handleDuplicate(bet: Bet) {
    setEditing(bet);
    setFormMode('duplicate');
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setFormMode('edit');
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (confirm(t('bets.deleteConfirm'))) {
      await deleteBet.mutateAsync(id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">{t('bets.title')}</h1>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" />
          {t('bets.addBet')}
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BetStatus | 'all')}
          className="w-auto min-w-[150px]"
        >
          <option value="all">{t('common.all')}</option>
          <option value="pending">{t('bets.statusPending')}</option>
          <option value="won">{t('bets.statusWon')}</option>
          <option value="lost">{t('bets.statusLost')}</option>
          <option value="void">{t('bets.statusVoid')}</option>
          <option value="cashout">{t('bets.statusCashout')}</option>
        </Select>
        {allTags.length > 0 && (
          <Select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-auto min-w-[150px]"
          >
            <option value="all">{t('bets.allTags')}</option>
            <option value="__none__">{t('bets.noTag')}</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </Select>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground">{t('bets.noBets')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="text-left border-b border-border">
                    <th className="p-3 font-normal">{t('bets.date')}</th>
                    <th className="p-3 font-normal">{t('bets.description')}</th>
                    <th className="p-3 font-normal">{t('bets.type')}</th>
                    <th className="p-3 font-normal text-right">{t('bets.odds')}</th>
                    <th className="p-3 font-normal text-right">{t('bets.stake')}</th>
                    <th className="p-3 font-normal">{t('bets.status')}</th>
                    <th className="p-3 font-normal text-right">{t('dashboard.profit')}</th>
                    <th className="p-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((bet) => {
                    const profit = calculateBetProfit(bet);
                    return (
                      <tr key={bet.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                        <td className="p-3 whitespace-nowrap">{formatDate(bet.placed_at)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{bet.description}</div>
                            {bet.bookmaker && (() => {
                              const bm = BOOKMAKERS.find((b) => b.id === bet.bookmaker);
                              return bm?.logo ? (
                                <img src={bm.logo} alt={bm.name} title={bm.name} className="w-4 h-4 rounded object-cover shrink-0" />
                              ) : bm ? (
                                <span className="text-[10px] text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0">{bm.name}</span>
                              ) : null;
                            })()}
                          </div>
                          {bet.pick && <div className="text-xs text-muted-foreground">{bet.pick}</div>}
                          {bet.bet_type === 'surebet' && (() => {
                            const legs = parseSurebetLegs(bet.notes);
                            if (!legs) return null;
                            return (
                              <div className="mt-1 space-y-0.5">
                                {legs.map((leg, i) => {
                                  const bm = BOOKMAKERS.find((b) => b.id === leg.bookmaker);
                                  return (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <span>{bm?.name ?? (leg.bookmaker || '—')}</span>
                                      <span className="opacity-50">·</span>
                                      <span>{formatNumber(leg.odds, 2)}x</span>
                                      <span className="opacity-50">·</span>
                                      <span>{formatCurrency(leg.stake, bet.currency)}</span>
                                      {leg.status !== 'pending' && (
                                        <span className={leg.status === 'won' ? 'text-success' : 'text-danger'}>
                                          · {leg.status === 'won' ? t('bets.statusWon') : t('bets.statusLost')}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {bet.bet_type === 'accumulator'
                            ? t('bets.accumulator')
                            : bet.bet_type === 'surebet'
                            ? t('bets.surebet')
                            : t('bets.single')}
                        </td>
                        <td className="p-3 text-right">{formatNumber(Number(bet.odds), 2)}</td>
                        <td className="p-3 text-right">{formatCurrency(Number(bet.stake), bet.currency)}</td>
                        <td className="p-3"><StatusBadge status={bet.status} /></td>
                        <td className={`p-3 text-right font-medium ${profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                          {profit > 0 ? '+' : ''}
                          {formatCurrency(profit, bet.currency)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(bet)} title={t('bets.duplicateBet')}>
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(bet)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(bet.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <BetFormDialog open={formOpen} onClose={() => setFormOpen(false)} initial={editing} mode={formMode} />
    </div>
  );
}
