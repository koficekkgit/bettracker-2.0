'use client';

import { useState } from 'react';
import { Plus, Copy, Trash2, Check, ShieldAlert, Wallet, Gift, Ban, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useProfile } from '@/hooks/use-profile';
import {
  useAllLicenseCodes,
  useGenerateLicenseCode,
  useDeleteLicenseCode,
} from '@/hooks/use-admin';
import { useAllUsers, useTogglePayoutsEnabled } from '@/hooks/use-feature-flags';
import {
  useAllReferralCodes,
  useCreateReferralCode,
  useDeactivateReferralCode,
  useAllReferralUses,
  useMarkReferralPaidOut,
} from '@/hooks/use-referrals';
import { useAdminFeedback, useUpdateFeedbackStatus, type FeedbackStatus } from '@/hooks/use-feedback';
import type { SubscriptionPlan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  monthly: 'Měsíční (99 Kč)',
  quarterly: 'Čtvrtletní (249 Kč)',
  yearly: 'Roční (699 Kč)',
  lifetime: 'Lifetime (1 199 Kč)',
};

export default function AdminPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: codes = [], isLoading: codesLoading } = useAllLicenseCodes();
  const { data: users = [], isLoading: usersLoading } = useAllUsers();
  const generate = useGenerateLicenseCode();
  const deleteCode = useDeleteLicenseCode();
  const togglePayouts = useTogglePayoutsEnabled();

  const [plan, setPlan] = useState<SubscriptionPlan>('lifetime');
  const [note, setNote] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState('');

  // Referral state
  const { data: refCodes = [] } = useAllReferralCodes();
  const { data: refUses = [] } = useAllReferralUses();
  const createRefCode = useCreateReferralCode();
  const deactivateRefCode = useDeactivateReferralCode();
  const markPaidOut = useMarkReferralPaidOut();
  const [refCodeInput, setRefCodeInput] = useState('');
  const [refOwnerInput, setRefOwnerInput] = useState('');
  const [refDiscountPct, setRefDiscountPct] = useState(10);
  const [refRewardPct, setRefRewardPct] = useState(10);

  // Feedback inbox
  const { data: feedbackList = [], isLoading: feedbackLoading } = useAdminFeedback();
  const updateFeedbackStatus = useUpdateFeedbackStatus();
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackStatus | 'all'>('all');
  const unreadFeedbackCount = feedbackList.filter((f) => f.status === 'new').length;

  if (profileLoading) {
    return <div className="text-muted-foreground">Načítání...</div>;
  }

  if (!profile?.is_admin) {
    return (
      <Card className="border-danger/30">
        <CardContent className="py-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-danger mx-auto" />
          <h2 className="text-lg font-semibold">Nemáš přístup</h2>
          <p className="text-sm text-muted-foreground">
            Tato sekce je pouze pro adminy.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generate.mutateAsync({ plan, note });
    setNote('');
  }

  async function copyToClipboard(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Zkopírováno do schránky');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Nepodařilo se zkopírovat');
    }
  }

  async function handleDelete(code: string) {
    if (confirm(`Opravdu smazat kód ${code}?`)) {
      await deleteCode.mutateAsync(code);
    }
  }

  async function handleCreateRefCode(e: React.FormEvent) {
    e.preventDefault();
    if (!refCodeInput.trim()) {
      toast.error('Zadej kód');
      return;
    }
    if (!refOwnerInput.trim()) {
      toast.error('Zadej username usera');
      return;
    }
    const owner = users.find(
      (u) => u.username?.toLowerCase() === refOwnerInput.trim().toLowerCase()
    );
    if (!owner) {
      toast.error(`Username "${refOwnerInput.trim()}" nenalezen`);
      return;
    }
    try {
      await createRefCode.mutateAsync({ code: refCodeInput, owner_id: owner.id, discount_pct: refDiscountPct, reward_pct: refRewardPct });
      toast.success(`Kód ${refCodeInput.toUpperCase()} přiřazen uživateli ${owner.username}`);
      setRefCodeInput('');
      setRefOwnerInput('');
      setRefDiscountPct(10);
      setRefRewardPct(10);
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : (err as any)?.message ?? String(err);
      if (msg.includes('duplicate') || msg.includes('unique')) {
        toast.error('Kód s tímto názvem už existuje — zvol jiný.');
      } else {
        toast.error(msg || 'Neznámá chyba');
      }
    }
  }

  async function handleTogglePayouts(userId: string, current: boolean) {
    try {
      await togglePayouts.mutateAsync({ user_id: userId, enabled: !current });
      toast.success(!current ? 'Vyrovnávačky zapnuty' : 'Vyrovnávačky vypnuty');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Chyba');
    }
  }

  const stats = {
    total: codes.length,
    used: codes.filter((c) => c.redeemed_by !== null).length,
    unused: codes.filter((c) => c.redeemed_by === null).length,
  };

  const filteredUsers = users.filter((u) => {
    if (!userFilter) return true;
    const f = userFilter.toLowerCase();
    return (
      u.username?.toLowerCase().includes(f) ||
      u.display_name?.toLowerCase().includes(f)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          🔐 Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generování license kódů a správa subscriptions
        </p>
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Vydaných kódů</p>
          <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Aktivovaných</p>
          <p className="mt-1 text-2xl font-semibold text-success">{stats.used}</p>
        </div>
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-xs text-muted-foreground">Nevyužitých</p>
          <p className="mt-1 text-2xl font-semibold">{stats.unused}</p>
        </div>
      </div>

      {/* Generování */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Vygenerovat nový kód</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plán</Label>
                <Select value={plan} onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}>
                  {Object.entries(PLAN_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Poznámka (kdo, kdy zaplatil)</Label>
                <Input
                  placeholder="např. Honza Novák, FB, 11.4.2026"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={generate.isPending}>
              <Plus className="w-4 h-4" />
              Vygenerovat kód
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Seznam kódů */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Všechny vydané kódy</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {codesLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Načítání...</p>
          ) : codes.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Žádné kódy</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="text-left border-b border-border">
                    <th className="p-3 font-normal">Kód</th>
                    <th className="p-3 font-normal">Plán</th>
                    <th className="p-3 font-normal">Poznámka</th>
                    <th className="p-3 font-normal">Stav</th>
                    <th className="p-3 font-normal">Vytvořen</th>
                    <th className="p-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const isUsed = code.redeemed_by !== null;
                    return (
                      <tr key={code.code} className="border-b border-border last:border-0">
                        <td className="p-3 font-mono text-xs">{code.code}</td>
                        <td className="p-3 text-xs text-muted-foreground">{code.plan}</td>
                        <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                          {code.note ?? '—'}
                        </td>
                        <td className="p-3">
                          {isUsed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-success/15 text-success">
                              Použit
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary">
                              Volný
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(code.created_at).toLocaleDateString('cs-CZ')}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyToClipboard(code.code)}
                              title="Kopírovat"
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            {!isUsed && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(code.code)}
                                title="Smazat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
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

      {/* Referral kódy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Referral kódy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vytvořit nový kód */}
          <form onSubmit={handleCreateRefCode} className="flex gap-2 flex-wrap items-center">
            <Input
              placeholder="Kód (např. HONZA)"
              value={refCodeInput}
              onChange={(e) => setRefCodeInput(e.target.value.toUpperCase())}
              className="w-36 font-mono uppercase"
            />
            <Input
              placeholder="Username usera"
              value={refOwnerInput}
              onChange={(e) => setRefOwnerInput(e.target.value)}
              className="w-40"
            />
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={100}
                value={refDiscountPct}
                onChange={(e) => setRefDiscountPct(Number(e.target.value))}
                className="w-16 text-center"
                title="Sleva pro kupujícího (%)"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">% sleva</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={100}
                value={refRewardPct}
                onChange={(e) => setRefRewardPct(Number(e.target.value))}
                className="w-16 text-center"
                title="Odměna pro referrera (%)"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">% referrer</span>
            </div>
            <Button type="submit" disabled={createRefCode.isPending}>
              <Plus className="w-4 h-4" />
              Přiřadit kód
            </Button>
          </form>

          {/* Seznam kódů */}
          {refCodes.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="text-left border-b border-border">
                    <th className="p-3 font-normal">Kód</th>
                    <th className="p-3 font-normal">Uživatel</th>
                    <th className="p-3 font-normal">Sleva</th>
                    <th className="p-3 font-normal">Referrer</th>
                    <th className="p-3 font-normal">Použití</th>
                    <th className="p-3 font-normal">Vydělal</th>
                    <th className="p-3 font-normal">Stav</th>
                    <th className="p-3 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {refCodes.map((rc) => {
                    const owner = users.find((u) => u.id === rc.owner_id);
                    const uses = refUses.filter((u) => u.code === rc.code);
                    const earned = uses.reduce((s, u) => s + u.reward_amount, 0);
                    return (
                      <tr key={rc.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-mono font-bold">{rc.code}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {owner?.username ?? rc.owner_id.slice(0, 8)}
                        </td>
                        <td className="p-3 text-xs">{rc.discount_pct ?? 10} %</td>
                        <td className="p-3 text-xs">{rc.reward_pct ?? 10} %</td>
                        <td className="p-3 text-xs">{uses.length}×</td>
                        <td className="p-3 text-xs text-success">{earned} Kč</td>
                        <td className="p-3">
                          {rc.is_active ? (
                            <span className="text-xs text-success">Aktivní</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Deaktivován</span>
                          )}
                        </td>
                        <td className="p-3">
                          {rc.is_active && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deactivateRefCode.mutate(rc.id)}
                              title="Deaktivovat"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Referral uses — nevyplacené */}
          {refUses.filter((u) => !u.paid_out).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Čekají na výplatu</p>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="text-left border-b border-border">
                      <th className="p-3 font-normal">Datum</th>
                      <th className="p-3 font-normal">Kód</th>
                      <th className="p-3 font-normal">Komu vyplatit</th>
                      <th className="p-3 font-normal">Plán</th>
                      <th className="p-3 font-normal text-right">Odměna</th>
                      <th className="p-3 font-normal"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {refUses.filter((u) => !u.paid_out).map((u) => {
                      const owner = users.find((usr) => usr.id === u.owner_id);
                      return (
                        <tr key={u.id} className="border-b border-border last:border-0">
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString('cs-CZ')}
                          </td>
                          <td className="p-3 font-mono text-xs">{u.code}</td>
                          <td className="p-3 text-xs">{owner?.username ?? u.owner_id.slice(0, 8)}</td>
                          <td className="p-3 text-xs capitalize">{u.plan}</td>
                          <td className="p-3 text-right font-medium text-success">+{u.reward_amount} Kč</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markPaidOut.mutate(u.id)}
                              disabled={markPaidOut.isPending}
                            >
                              Vyplaceno
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback inbox */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Zpětná vazba
              {unreadFeedbackCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-[11px] font-bold text-white">
                  {unreadFeedbackCount}
                </span>
              )}
            </CardTitle>
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['all', 'new', 'read', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFeedbackFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    feedbackFilter === f
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
                  )}
                >
                  {f === 'all' ? 'Vše' : f === 'new' ? 'Nové' : f === 'read' ? 'Přečtené' : 'Vyřešené'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {feedbackLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Načítání…</p>
          ) : feedbackList.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Žádná zpětná vazba</p>
          ) : (
            (() => {
              const filtered = feedbackFilter === 'all'
                ? feedbackList
                : feedbackList.filter((f) => f.status === feedbackFilter);
              if (filtered.length === 0) {
                return <p className="p-6 text-sm text-muted-foreground text-center">Žádné záznamy v tomto filtru</p>;
              }
              return (
                <div className="divide-y divide-border">
                  {filtered.map((item) => (
                    <div key={item.id} className={cn(
                      'px-4 py-3 flex gap-3 items-start transition-colors',
                      item.status === 'new' && 'bg-red-500/5',
                    )}>
                      {/* Type icon */}
                      <div className={cn(
                        'mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
                        item.type === 'bug'        && 'bg-red-500/10 text-red-400',
                        item.type === 'suggestion' && 'bg-amber-500/10 text-amber-400',
                        item.type === 'other'      && 'bg-slate-500/10 text-slate-400',
                      )}>
                        {item.type === 'bug'        && <Bug        className="w-3.5 h-3.5" />}
                        {item.type === 'suggestion' && <Lightbulb  className="w-3.5 h-3.5" />}
                        {item.type === 'other'      && <HelpCircle className="w-3.5 h-3.5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold">{item.username ?? 'Anon'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleString('cs-CZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {item.status === 'new' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400">Nové</span>
                          )}
                          {item.status === 'resolved' && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">Vyřešeno</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{item.message}</p>
                      </div>

                      {/* Status actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {item.status !== 'read' && item.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => updateFeedbackStatus.mutate({ id: item.id, status: 'read' })}
                            disabled={updateFeedbackStatus.isPending}
                          >
                            Přečteno
                          </Button>
                        )}
                        {item.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-success"
                            onClick={() => updateFeedbackStatus.mutate({ id: item.id, status: 'resolved' })}
                            disabled={updateFeedbackStatus.isPending}
                          >
                            Vyřešit
                          </Button>
                        )}
                        {item.status === 'resolved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => updateFeedbackStatus.mutate({ id: item.id, status: 'new' })}
                            disabled={updateFeedbackStatus.isPending}
                          >
                            Znovu otevřít
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* Feature flagy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Feature flagy — Vyrovnávačky
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Filtrovat podle username..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="max-w-sm"
          />
          {usersLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Načítání...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="text-left border-b border-border">
                    <th className="p-3 font-normal">Username</th>
                    <th className="p-3 font-normal">Display name</th>
                    <th className="p-3 font-normal">Vytvořen</th>
                    <th className="p-3 font-normal text-center">Vyrovnávačky</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-mono text-xs">{u.username ?? '—'}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {u.display_name ?? '—'}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={u.payouts_enabled}
                          onChange={() => handleTogglePayouts(u.id, u.payouts_enabled)}
                          disabled={togglePayouts.isPending}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  Žádní uživatelé
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
