'use client';

import { useState } from 'react';
import { Sparkles, Check, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubscription, useRedeemCode } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

const PLANS = [
  { id: 'monthly', name: 'Měsíční', price: 99, period: '/měsíc', popular: false },
  { id: 'quarterly', name: 'Čtvrtletní', price: 299, period: '/3 měsíce', popular: false, save: 'Ušetři 33 Kč' },
  { id: 'yearly', name: 'Roční', price: 799, period: '/rok', popular: true, save: 'Ušetři 389 Kč' },
  { id: 'lifetime', name: 'Lifetime', price: 999, period: 'jednou', popular: false, save: 'Nejlepší cena' },
];

export function SubscriptionPanel() {
  const sub = useSubscription();
  const redeemCode = useRedeemCode();
  const [code, setCode] = useState('');

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
                    'relative rounded-lg border p-4 transition-colors',
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
                  {plan.save && (
                    <p className="text-xs text-success mt-2">{plan.save}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-secondary p-4 space-y-2 text-sm">
              <p className="font-medium">Jak to funguje:</p>
              <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Vyber si plán a kontaktuj mě (Discord/FB/email)</li>
                <li>Pošli platbu - QR kód / číslo účtu ti pošlu</li>
                <li>Obdržíš aktivační kód</li>
                <li>Zadej kód níže a Pro se aktivuje okamžitě</li>
              </ol>
            </div>
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
              Všechna časová období ve statistikách
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Kalendářové view
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Surebet kalkulačka
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Friends + leaderboard
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Tagy a pokročilé filtry
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              3 jazyky (CZ/EN/RU) + 5 měn
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-success flex-shrink-0" />
              Vlastní kategorie
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
