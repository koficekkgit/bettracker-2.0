'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Copy, Trash2, Check, ShieldAlert } from 'lucide-react';
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
import type { SubscriptionPlan } from '@/lib/types';
import { toast } from 'sonner';

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  monthly: 'Měsíční (99 Kč)',
  quarterly: 'Čtvrtletní (299 Kč)',
  yearly: 'Roční (799 Kč)',
  lifetime: 'Lifetime (999 Kč)',
};

export default function AdminPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: codes = [], isLoading: codesLoading } = useAllLicenseCodes();
  const generate = useGenerateLicenseCode();
  const deleteCode = useDeleteLicenseCode();

  const [plan, setPlan] = useState<SubscriptionPlan>('lifetime');
  const [note, setNote] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Loading state
  if (profileLoading) {
    return <div className="text-muted-foreground">Načítání...</div>;
  }

  // Access control - jen admin
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

  // Statistiky
  const stats = {
    total: codes.length,
    used: codes.filter((c) => c.redeemed_by !== null).length,
    unused: codes.filter((c) => c.redeemed_by === null).length,
  };

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
    </div>
  );
}
