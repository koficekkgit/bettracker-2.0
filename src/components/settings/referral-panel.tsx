'use client';

import { useState } from 'react';
import { Copy, Check, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyReferralCode, useMyReferralEarnings } from '@/hooks/use-referrals';
import { toast } from 'sonner';

export function ReferralPanel() {
  const { data: refCode, isLoading } = useMyReferralCode();
  const { data: earnings = [] } = useMyReferralEarnings();
  const [copied, setCopied] = useState(false);

  const totalEarned = earnings.reduce((s, e) => s + e.reward_amount, 0);
  const pendingPayout = earnings.filter((e) => !e.paid_out).reduce((s, e) => s + e.reward_amount, 0);

  async function handleCopy() {
    if (!refCode) return;
    await navigator.clipboard.writeText(refCode.code);
    setCopied(true);
    toast.success('Kód zkopírován');
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) return null;

  // Pokud user nemá přiřazený kód, panel vůbec nezobrazíme
  if (!refCode) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Gift className="w-4 h-4" />
          Referral program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sdílej svůj kód kamarádům. Každý, kdo si koupí přes tvůj kód, dostane{' '}
          <strong>10% slevu</strong> a ty dostaneš <strong>10% odměnu</strong>.
        </p>

        {/* Kód */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tvůj referral kód</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-md px-4 py-2.5 font-mono text-lg font-bold tracking-widest">
              {refCode.code}
            </div>
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-md border border-border hover:bg-secondary transition-colors"
              title="Kopírovat"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Statistiky */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-secondary rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">Použití</p>
            <p className="text-xl font-bold">{earnings.length}</p>
          </div>
          <div className="bg-secondary rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">Celkem vyděláno</p>
            <p className="text-xl font-bold">{totalEarned} Kč</p>
          </div>
          <div className="bg-secondary rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">Čeká na výplatu</p>
            <p className={`text-xl font-bold ${pendingPayout > 0 ? 'text-success' : ''}`}>
              {pendingPayout} Kč
            </p>
          </div>
        </div>

        {/* Historie */}
        {earnings.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Historie</p>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground bg-secondary/50">
                  <tr>
                    <th className="text-left p-2 font-normal">Datum</th>
                    <th className="text-left p-2 font-normal">Plán</th>
                    <th className="text-right p-2 font-normal">Odměna</th>
                    <th className="text-right p-2 font-normal">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-2 text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="p-2 capitalize">{e.plan}</td>
                      <td className="p-2 text-right font-medium text-success">+{e.reward_amount} Kč</td>
                      <td className="p-2 text-right">
                        {e.paid_out ? (
                          <span className="text-xs text-muted-foreground">Vyplaceno</span>
                        ) : (
                          <span className="text-xs text-amber-500">Čeká</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
