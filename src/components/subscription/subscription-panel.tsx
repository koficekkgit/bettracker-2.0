'use client';

import { useState } from 'react';
import { Sparkles, Check, Crown, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubscription, useRedeemCode } from '@/hooks/use-subscription';
import { useMyPendingPayment } from '@/hooks/use-payments';
import { PaymentDialog } from '@/components/subscription/payment-dialog';
import { cn } from '@/lib/utils';
import type { PlanId } from '@/lib/payments';

const PLANS = [
  { id: 'monthly', name: 'Měsíční', price: 99, period: '/měsíc', popular: false },
  { id: 'quarterly', name: 'Čtvrtletní', price: 249, period: '/3 měsíce', popular: false, save: 'Ušetři 16 %' },
  { id: 'yearly', name: 'Roční', price: 699, period: '/rok', popular: true, save: 'Ušetři 41 %' },
  { id: 'lifetime', name: 'Lifetime', price: 1199, period: 'jednou', popular: false, save: 'Nejlepší cena' },
];

export function SubscriptionPanel() {
  const sub = useSubscription();
  const redeemCode = useRedeemCode();
  const { data: pendingPayment } = useMyPendingPayment();
  const [code, setCode] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentInitialPlan, setPaymentInitialPlan] = useState<PlanId>('lifetime');

  function openPayment(plan: PlanId) {
    setPaymentInitialPlan(plan);
    setPaymentOpen(true);
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length === 0) return;
    await redeemCode.mutateAsync(code.trim());
    setCode('');
  }

  function formatExpiresAt() {
    if (!sub.expiresAt) return null;
    return sub.expiresAt.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <Card id="subscription">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          BetTracker Pro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aktuální stav */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Aktuální stav</p>
              <p className="text-lg font-semibold">
                {sub.isPro && sub.plan === 'lifetime' && '✨ Pro Lifetime'}
                {sub.isPro && sub.plan !== 'lifetime' && !sub.isTrial && `Pro · ${sub.plan}`}
                {sub.isTrial && `Trial · zbývá ${sub.daysLeft} dní`}
                {sub.isFree && 'Free'}
              </p>
              {sub.expiresAt && sub.plan !== 'lifetime' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Platí do {formatExpiresAt()}
                </p>
              )}
            </div>
            {sub.isPro && sub.plan === 'lifetime' && (
              <Sparkles className="w-8 h-8 text-amber-500" />
            )}
          </div>
        </div>

        {/* Pokud není lifetime, ukaž ceník */}
        {sub.plan !== 'lifetime' && (
          <>
            <div>
              <h3 className="font-medium mb-1">Vyber si plán</h3>
              <p className="text-sm text-muted-foreground">
                Po platbě ti pošlu aktivační kód, který sem zadáš níže.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-lg border p-4 transition-colors flex flex-col',
                    plan.popular ? 'border-foreground border-2' : 'border-border'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-semibold bg-foreground text-background">
                      NEJOBLÍBENĚJŠÍ
                    </div>
                  )}
                  <p className="text-sm font-medium">{plan.name}</p>
                  <p className="text-2xl font-bold mt-1">
                    {plan.price} <span className="text-sm font-normal text-muted-foreground">Kč</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{plan.period}</p>
                  <div className="min-h-[1.25rem] mt-2">
                    {plan.save && (
                      <p className="text-xs text-success">{plan.save}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={plan.popular ? 'default' : 'outline'}
                    className="mt-2 w-full"
                    onClick={() => openPayment(plan.id as PlanId)}
                  >
                    Koupit
                  </Button>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-secondary p-4 space-y-2 text-sm">
              <p className="font-medium">Jak to funguje:</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Klikni na <strong>Koupit</strong> u plánu, který chceš</li>
                <li>Naskenuj QR kód v bankovní aplikaci</li>
                <li>Pošli platbu - aktivace proběhne automaticky do 1 hodiny</li>
                <li>Nebo pokud máš aktivační kód, zadej ho níže</li>
              </ol>
            </div>

            {/* Aktivní pending payment - prominentní notifikace */}
            {pendingPayment && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-4 flex items-start gap-3">
                <QrCode className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Čeká platba {pendingPayment.amount} Kč</p>
                  <p className="text-xs text-muted-foreground">
                    VS: <span className="font-mono">{pendingPayment.variable_symbol}</span>
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
                  Zobrazit QR
                </Button>
              </div>
            )}
          </>
        )}

        {/* Aktivace kódu - vždy zobrazená */}
        <form onSubmit={handleRedeem} className="space-y-2 pt-2 border-t border-border">
          <Label>Aktivační kód</Label>
          <div className="flex gap-2">
            <Input
              placeholder="BET-XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
              disabled={redeemCode.isPending}
            />
            <Button
              type="submit"
              disabled={redeemCode.isPending || code.trim().length === 0}
            >
              <Check className="w-4 h-4" />
              Aktivovat
            </Button>
          </div>
        </form>

        {/* Pro features list */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium mb-3">Pro odemyká:</p>
          <ul className="text-sm space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Neomezený počet sázek (Free má max 5)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Statistiky — všechna časová období
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Kalendář sázek
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Surebet kalkulačka
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Přátelé &amp; žebříček
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Úspěchy (achievements)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Správa bankrollu
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              AI analýza screenshotů tiketu
            </li>
          </ul>
        </div>
      </CardContent>

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        initialPlan={paymentInitialPlan}
      />
    </Card>
  );
}
