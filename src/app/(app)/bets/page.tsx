'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Search, Copy, CheckSquare, Square, Tag, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatusBadge } from '@/components/bets/status-badge';
import { BetFormDialog } from '@/components/bets/bet-form-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useBets, useDeleteBet, useUpdateBet } from '@/hooks/use-bets';
import { calculateBetProfit } from '@/lib/stats';
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils';
import { parseSurebetLegs } from '@/lib/surebet';
import { BOOKMAKERS } from '@/lib/utils';
import type { Bet, BetStatus } from '@/lib/types';

export default function BetsPage() {
  const t = useTranslations();
  const { data: bets = [], isLoading } = useBets();
  const deleteBet = useDeleteBet();
  const updateBet = useUpdateBet();

  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<Bet | null>(null);
  const [formMode, setFormMode]   = useState<'edit' | 'duplicate'>('edit');
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<BetStatus | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkTagOpen, setBulkTagOpen]   = useState(false);
  const [bulkWorking, setBulkWorking]   = useState(false);

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
    setEditing(bet); setFormMode('edit'); setFormOpen(true);
  }
  function handleDuplicate(bet: Bet) {
    setEditing(bet); setFormMode('duplicate'); setFormOpen(true);
  }
  function handleNew() {
    setEditing(null); setFormMode('edit'); setFormOpen(true);
  }
  async function handleDelete(id: string) {
    if (confirm(t('bets.deleteConfirm'))) {
      await deleteBet.mutateAsync(id);
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  // Bulk helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every((b) => selectedIds.has(b.id));
  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const s = new Set(prev);
        filtered.forEach((b) => s.delete(b.id));
        return s;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...filtered.map((b) => b.id)]));
    }
  }
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
    setBulkTagOpen(false);
    setBulkTagInput('');
  }

  async function handleBulkDelete() {
    if (!confirm(`Smazat ${selectedIds.size} vybraných sázek?`)) return;
    setBulkWorking(true);
    await Promise.all([...selectedIds].map((id) => deleteBet.mutateAsync(id)));
    setBulkWorking(false);
    clearSelection();
  }

  async function handleBulkTag() {
    const tag = bulkTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    setBulkWorking(true);
    const selected = bets.filter((b) => selectedIds.has(b.id));
    await Promise.all(
      selected.map((bet) => {
        const existing = bet.tags ?? [];
        if (existing.includes(tag)) return Promise.resolve();
        return updateBet.mutateAsync({ id: bet.id, tags: [...existing, tag] } as any);
      })
    );
    setBulkWorking(false);
    setBulkTagInput('');
    setBulkTagOpen(false);
    clearSelection();
  }

  if (isLoading) return <BetsSkeleton />;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">{t('bets.title')}</h1>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4" />
          {t('bets.addBet')}
        </Button>
      </div>

      {/* Filters */}
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
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 flex-wrap px-4 py-3 bg-violet-500/10 border border-violet-500/25 rounded-xl">
          <span className="text-sm font-semibold text-violet-300 flex-shrink-0">
            {selectedIds.size} vybráno
          </span>

          {/* Tag panel */}
          {bulkTagOpen ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Input
                autoFocus
                placeholder="Název tagu..."
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBulkTag()}
                className="h-8 text-sm max-w-[180px]"
              />
              <Button size="sm" onClick={handleBulkTag} disabled={bulkWorking || !bulkTagInput.trim()}>
                {bulkWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Přidat'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setBulkTagOpen(false); setBulkTagInput(''); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkTagOpen(true)}
                className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
              >
                <Tag className="w-3.5 h-3.5" />
                Přidat tag
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkDelete}
                disabled={bulkWorking}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                {bulkWorking
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
                Smazat
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection} className="text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {bets.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon="🎯"
              title="Zatím žádné sázky"
              description="Přidej svou první sázku a začni sledovat svůj výkon."
              action={
                <Button onClick={handleNew}>
                  <Plus className="w-4 h-4" />
                  Přidat první sázku
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState icon="🔍" title="Žádné výsledky" description="Zkus jiný filtr nebo hledaný výraz." />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Mobile: card list ── */}
          <div className="md:hidden space-y-2">
            {filtered.map((bet) => {
              const profit = calculateBetProfit(bet);
              const selected = selectedIds.has(bet.id);
              return (
                <div
                  key={bet.id}
                  className={cn(
                    'rounded-xl border bg-card p-3 space-y-2 transition-colors',
                    selected ? 'border-violet-500/60 bg-violet-500/5' : 'border-border',
                  )}
                >
                  {/* Row 1: checkbox + description + status */}
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleSelect(bet.id)}
                      className="mt-0.5 text-muted-foreground hover:text-violet-400 flex-shrink-0 transition-colors"
                    >
                      {selected
                        ? <CheckSquare className="w-4 h-4 text-violet-400" />
                        : <Square className="w-4 h-4" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{bet.description}</p>
                        <StatusBadge status={bet.status} />
                      </div>
                      {bet.pick && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{bet.pick}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: date · odds · stake · profit */}
                  <div className="flex items-center justify-between text-xs pl-6 gap-2">
                    <span className="text-muted-foreground">{formatDate(bet.placed_at)}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(Number(bet.odds), 2)}x · {formatCurrency(Number(bet.stake), bet.currency)}
                    </span>
                    <span className={cn(
                      'font-semibold',
                      profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground'
                    )}>
                      {profit > 0 ? '+' : ''}{formatCurrency(profit, bet.currency)}
                    </span>
                  </div>

                  {/* Row 3: actions */}
                  <div className="flex gap-1 justify-end pl-6">
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
                </div>
              );
            })}
          </div>

          {/* ── Desktop: table ── */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground text-xs">
                    <tr className="text-left border-b border-border">
                      {/* Select-all checkbox */}
                      <th className="p-3 w-8">
                        <button
                          onClick={toggleSelectAll}
                          className="text-muted-foreground hover:text-violet-400 transition-colors"
                          title={allFilteredSelected ? 'Odznačit vše' : 'Vybrat vše'}
                        >
                          {allFilteredSelected
                            ? <CheckSquare className="w-4 h-4 text-violet-400" />
                            : <Square className="w-4 h-4" />
                          }
                        </button>
                      </th>
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
                      const selected = selectedIds.has(bet.id);
                      return (
                        <tr
                          key={bet.id}
                          className={cn(
                            'border-b border-border last:border-0',
                            selected ? 'bg-violet-500/5' : 'hover:bg-secondary/50',
                          )}
                        >
                          <td className="p-3">
                            <button
                              onClick={() => toggleSelect(bet.id)}
                              className="text-muted-foreground hover:text-violet-400 transition-colors"
                            >
                              {selected
                                ? <CheckSquare className="w-4 h-4 text-violet-400" />
                                : <Square className="w-4 h-4" />
                              }
                            </button>
                          </td>
                          <td className="p-3 whitespace-nowrap">{formatDate(bet.placed_at)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{bet.description}</div>
                              {bet.bookmaker && (() => {
                                const bm = BOOKMAKERS.find((b) => b.id === bet.bookmaker);
                                if (!bm) return null;
                                return bm.logo
                                  ? <BookmakerLogo logo={bm.logo} name={bm.name} />
                                  : <span className="text-[10px] text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0">{bm.name}</span>;
                              })()}
                            </div>
                            {bet.pick && <div className="text-xs text-muted-foreground">{bet.pick}</div>}
                            {bet.tags && bet.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {bet.tags.map((tag) => (
                                  <span key={tag} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
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
                          <td className={cn(
                            'p-3 text-right font-medium',
                            profit > 0 ? 'text-success' : profit < 0 ? 'text-danger' : 'text-muted-foreground',
                          )}>
                            {profit > 0 ? '+' : ''}{formatCurrency(profit, bet.currency)}
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
            </CardContent>
          </Card>
        </>
      )}

      <BetFormDialog open={formOpen} onClose={() => setFormOpen(false)} initial={editing} mode={formMode} />
    </div>
  );
}

function BetsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
        <div className="h-9 w-32 bg-zinc-800 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 flex-1 bg-zinc-800/60 rounded-lg" />
        <div className="h-9 w-36 bg-zinc-800/60 rounded-lg" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[32, 80, 200, 80, 60, 60, 80, 70, 40].map((w, i) => (
                    <th key={i} className="p-3">
                      <div className="h-3 bg-zinc-800 rounded" style={{ width: w }} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-3"><div className="h-4 w-4 bg-zinc-800/70 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-20 bg-zinc-800/70 rounded" /></td>
                    <td className="p-3">
                      <div className="h-4 w-40 bg-zinc-800/70 rounded mb-1" />
                      <div className="h-3 w-24 bg-zinc-800/40 rounded" />
                    </td>
                    <td className="p-3"><div className="h-4 w-14 bg-zinc-800/70 rounded" /></td>
                    <td className="p-3"><div className="h-4 w-10 bg-zinc-800/70 rounded ml-auto" /></td>
                    <td className="p-3"><div className="h-4 w-14 bg-zinc-800/70 rounded ml-auto" /></td>
                    <td className="p-3"><div className="h-5 w-16 bg-zinc-800/70 rounded-full" /></td>
                    <td className="p-3"><div className="h-4 w-14 bg-zinc-800/70 rounded ml-auto" /></td>
                    <td className="p-3"><div className="h-4 w-16 bg-zinc-800/70 rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BookmakerLogo({ logo, name }: { logo: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="text-[10px] text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0">{name}</span>;
  }
  return (
    <img
      src={logo} alt={name} title={name}
      className="w-4 h-4 rounded object-cover shrink-0"
      onError={() => setFailed(true)}
    />
  );
}
