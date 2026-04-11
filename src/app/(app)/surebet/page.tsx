'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ProGate } from '@/components/subscription/pro-gate';
import { formatCurrency, formatNumber, BOOKMAKERS, CURRENCIES } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OutcomeRow {
  label: string;
  odds: number;
  bookmaker: string;
}

export default function SurebetPage() {
  return (
    <ProGate feature="Surebet kalkulačka">
      <SurebetContent />
    </ProGate>
  );
}

function SurebetContent() {
  const t = useTranslations();

  const [outcomeCount, setOutcomeCount] = useState<2 | 3>(2);
  const [totalStake, setTotalStake] = useState<number>(1000);
  const [currency, setCurrency] = useState<string>('CZK');

  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([
    { label: '1', odds: 2.1, bookmaker: '' },
    { label: '2', odds: 2.05, bookmaker: '' },
    { label: 'X', odds: 3.5, bookmaker: '' },
  ]);

  function updateOutcome(index: number, patch: Partial<OutcomeRow>) {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function setCount(n: 2 | 3) {
    setOutcomeCount(n);
    if (n === 2) {
      setOutcomes((prev) => {
        const next = [...prev];
        if (next.length >= 2) {
          next[0] = { ...next[0], label: '1' };
          next[1] = { ...next[1], label: '2' };
        }
        return next;
      });
    } else {
      setOutcomes((prev) => {
        const next = [...prev];
        if (next.length >= 3) {
          next[0] = { ...next[0], label: '1' };
          next[1] = { ...next[1], label: 'X' };
          next[2] = { ...next[2], label: '2' };
        }
        return next;
      });
    }
  }

  // Pro 2-way bereme outcomy [0,1], pro 3-way [0,1,2] ale s labely 1/X/2
  const activeOutcomes = useMemo(() => {
    if (outcomeCount === 2) {
      return [outcomes[0], outcomes[1]];
    }
    return [
      { ...outcomes[0], label: '1' },
      { ...outcomes[2], label: 'X' },
      { ...outcomes[1], label: '2' },
    ];
  }, [outcomes, outcomeCount]);

  const result = useMemo(() => {
    const validOdds = activeOutcomes.every((o) => o.odds >= 1.01);
    if (!validOdds || totalStake <= 0) {
      return null;
    }

    // Sum of inverse odds (implied probability)
    const inverseSum = activeOutcomes.reduce((sum, o) => sum + 1 / o.odds, 0);
    const margin = (inverseSum - 1) * 100; // záporná = surebet
    const isSurebet = inverseSum < 1;

    // Optimální rozložení vkladu pro stejnou výplatu nezávisle na výsledku
    const stakes = activeOutcomes.map((o) => (totalStake / o.odds) / inverseSum);
    const payout = activeOutcomes[0].odds * stakes[0]; // stejné pro všechny při optimální distribuci
    const profit = payout - totalStake;
    const roi = (profit / totalStake) * 100;

    return {
      isSurebet,
      inverseSum,
      margin,
      stakes,
      payout,
      profit,
      roi,
    };
  }, [activeOutcomes, totalStake]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          {t('surebet.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('surebet.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('surebet.outcomes')}</Label>
              <Select
                value={String(outcomeCount)}
                onChange={(e) => setCount(Number(e.target.value) as 2 | 3)}
              >
                <option value="2">{t('surebet.twoWay')}</option>
                <option value="3">{t('surebet.threeWay')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('surebet.totalStake')}</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={totalStake}
                onChange={(e) => setTotalStake(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('bets.currency')}</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {activeOutcomes.map((outcome, idx) => {
              // Najdeme původní index v outcomes pro správný update
              const originalIdx = outcomeCount === 2
                ? idx
                : (outcome.label === '1' ? 0 : outcome.label === 'X' ? 2 : 1);

              return (
                <div key={outcome.label} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-12 md:col-span-2">
                    <Label className="text-xs">{t('surebet.outcome')}</Label>
                    <div className="h-10 flex items-center justify-center rounded-md bg-secondary text-foreground font-semibold text-lg">
                      {outcome.label}
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-3">
                    <Label className="text-xs">{t('surebet.odds')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={outcome.odds}
                      onChange={(e) =>
                        updateOutcome(originalIdx, { odds: parseFloat(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="col-span-6 md:col-span-4">
                    <Label className="text-xs">{t('surebet.bookmaker')}</Label>
                    <Select
                      value={outcome.bookmaker}
                      onChange={(e) => updateOutcome(originalIdx, { bookmaker: e.target.value })}
                    >
                      <option value="">—</option>
                      {BOOKMAKERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-12 md:col-span-3">
                    <Label className="text-xs">{t('surebet.stake')}</Label>
                    <div
                      className={cn(
                        'h-10 flex items-center justify-end px-3 rounded-md border border-border font-medium',
                        result?.isSurebet && 'bg-success/10 text-success border-success/30'
                      )}
                    >
                      {result ? formatCurrency(result.stakes[idx], currency) : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card
          className={cn(
            'border-2',
            result.isSurebet ? 'border-success/50' : 'border-border'
          )}
        >
          <CardHeader>
            <CardTitle
              className={cn(
                'text-base font-semibold flex items-center gap-2',
                result.isSurebet ? 'text-success' : 'text-muted-foreground'
              )}
            >
              {result.isSurebet ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  {t('surebet.isSurebet')}
                </>
              ) : (
                t('surebet.notSurebet')
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t('surebet.margin')}</p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-semibold',
                    result.margin < 0 ? 'text-success' : 'text-danger'
                  )}
                >
                  {result.margin > 0 ? '+' : ''}
                  {formatNumber(result.margin, 2)} %
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t('surebet.payout')}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatCurrency(result.payout, currency)}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t('surebet.guaranteedProfit')}</p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-semibold',
                    result.profit > 0 ? 'text-success' : 'text-danger'
                  )}
                >
                  {result.profit > 0 ? '+' : ''}
                  {formatCurrency(result.profit, currency)}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{t('surebet.guaranteedRoi')}</p>
                <p
                  className={cn(
                    'mt-1 text-2xl font-semibold',
                    result.roi > 0 ? 'text-success' : 'text-danger'
                  )}
                >
                  {result.roi > 0 ? '+' : ''}
                  {formatNumber(result.roi, 2)} %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('surebet.explanation')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
