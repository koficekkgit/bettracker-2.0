'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Loader2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { generateSpayd, SUBSCRIPTION_PLANS, type PlanId } from '@/lib/payments';
import { useCreatePendingPayment, useMyPendingPayment, useCancelPendingPayment } from '@/hooks/use-payments';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  initialPlan?: PlanId;
}

export function PaymentDialog({ open, onClose, initialPlan = 'lifetime' }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const createPayment = useCreatePendingPayment();
  const cancelPayment = useCancelPendingPayment();
  const { data: pendingPayment, refetch } = useMyPendingPayment();

  const iban = process.env.NEXT_PUBLIC_BANK_IBAN ?? '';
  const accountDisplay = process.env.NEXT_PUBLIC_BANK_ACCOUNT_DISPLAY ?? '';

  // Reset při zavření
  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
    }
  }, [open]);

  // Vygeneruj QR kód, jakmile máme pending payment
  useEffect(() => {
    if (!pendingPayment || !iban) {
      setQrDataUrl(null);
      return;
    }

    const spayd = generateSpayd({
      iban,
      amount: pendingPayment.amount,
      currency: pendingPayment.currency,
      variableSymbol: pendingPayment.variable_symbol,
      message: `BetTracker Pro ${pendingPayment.plan}`,
    });

    QRCode.toDataURL(spayd, {
      errorCorrectionLevel: 'M',
      width: 280,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [pendingPayment, iban]);

  if (!open) return null;

  async function handleGenerate() {
    await createPayment.mutateAsync(selectedPlan);
  }

  async function handleCancel() {
    if (pendingPayment) {
      await cancelPayment.mutateAsync(pendingPayment.id);
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success('Zkopírováno');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Nepodařilo se zkopírovat');
    }
  }

  // Pokud nemáme nastavený IBAN, ukaž varování
  if (!iban || iban === 'CZ0000000000000000000000') {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">QR platba není dostupná</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Administrátor zatím nenastavil bankovní účet pro QR platby. Kontaktuj ho přímo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Platba za BetTracker Pro</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Krok 1: Výběr plánu (jen pokud nemáme aktivní pending) */}
          {!pendingPayment && (
            <>
              <div>
                <p className="text-sm font-medium mb-3">Vyber plán</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(SUBSCRIPTION_PLANS) as [PlanId, typeof SUBSCRIPTION_PLANS[PlanId]][]).map(([id, plan]) => (
                    <button
                      key={id}
                      onClick={() => setSelectedPlan(id)}
                      className={`text-left p-3 rounded-md border-2 transition-colors ${
                        selectedPlan === id
                          ? 'border-foreground bg-secondary'
                          : 'border-border hover:bg-secondary/50'
                      }`}
                    >
                      <p className="text-sm font-medium">{plan.name}</p>
                      <p className="text-lg font-bold mt-0.5">{plan.price} Kč</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={createPayment.isPending}
              >
                {createPayment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Generovat QR platbu
              </Button>
            </>
          )}

          {/* Krok 2: QR kód a údaje k platbě */}
          {pendingPayment && (
            <>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Zaplať</p>
                <p className="text-3xl font-bold">{pendingPayment.amount} Kč</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {SUBSCRIPTION_PLANS[pendingPayment.plan as PlanId].name}
                </p>
              </div>

              {/* QR kód */}
              {qrDataUrl ? (
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="QR platba" width={280} height={280} />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center h-[280px] items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              <div className="text-center text-xs text-muted-foreground">
                Naskenuj QR kód v bankovní aplikaci<br/>
                nebo zadej platbu ručně podle údajů níže
              </div>

              {/* Manuální údaje */}
              <div className="space-y-2 rounded-lg bg-secondary p-4">
                <PaymentRow label="Číslo účtu" value={accountDisplay} onCopy={() => copyText(accountDisplay, 'account')} copied={copied === 'account'} />
                <PaymentRow label="Částka" value={`${pendingPayment.amount} Kč`} onCopy={() => copyText(String(pendingPayment.amount), 'amount')} copied={copied === 'amount'} />
                <PaymentRow label="Variabilní symbol" value={String(pendingPayment.variable_symbol)} onCopy={() => copyText(String(pendingPayment.variable_symbol), 'vs')} copied={copied === 'vs'} highlight />
                <PaymentRow label="Zpráva" value="BetTracker Pro" onCopy={() => copyText('BetTracker Pro', 'msg')} copied={copied === 'msg'} />
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-1">
                <p className="font-medium text-amber-600">Důležité:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>VS musí být přesně tento (jinak nedokážeme platbu spárovat)</li>
                  <li>Aktivace proběhne automaticky do 1 hodiny od přijetí platby</li>
                  <li>Platí 7 dní</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleCancel}>
                  Zrušit platbu
                </Button>
                <Button className="flex-1" onClick={() => refetch()}>
                  Zkontrolovat
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentRow({
  label,
  value,
  onCopy,
  copied,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono ${highlight ? 'font-bold text-foreground' : ''}`}>{value}</span>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground">
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
