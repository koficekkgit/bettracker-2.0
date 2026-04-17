'use client';

/**
 * /gopay/return?vs={variableSymbol}
 *
 * GoPay sem přesměruje uživatele po dokončení platby (úspěch i neúspěch).
 * Webhook /api/gopay/notify aktivuje předplatné asynchronně —
 * tato stránka jen zobrazí stav a počká na aktualizaci profilu.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type State = 'loading' | 'success' | 'pending' | 'failed';

export default function GopayReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<State>('loading');
  const [attempts, setAttempts] = useState(0);

  const vs = searchParams.get('vs');

  useEffect(() => {
    if (!vs) {
      setState('failed');
      return;
    }

    // Polling — GoPay webhook může přijít s malým zpožděním
    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('pending_payments')
        .select('status')
        .eq('variable_symbol', vs)
        .single();

      if (data?.status === 'matched') {
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        setState('success');
        return true;
      }
      if (data?.status === 'cancelled' || data?.status === 'expired') {
        setState('failed');
        return true;
      }
      return false;
    };

    // Zkus hned, pak každé 2s po dobu 30s
    check().then((done) => {
      if (done) return;
      const interval = setInterval(async () => {
        setAttempts((a) => a + 1);
        const done = await check();
        if (done) clearInterval(interval);
      }, 2000);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setState('pending');
      }, 30_000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    });
  }, [vs, queryClient]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">

        {state === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-xl font-bold mb-1">Ověřujeme platbu…</h2>
              <p className="text-sm text-muted-foreground">
                Čekáme na potvrzení od GoPay{attempts > 0 ? ` (${attempts})` : ''}
              </p>
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Platba proběhla!</h2>
              <p className="text-sm text-muted-foreground">
                Tvoje předplatné je aktivní. Vítej v Pro 🎉
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              onClick={() => router.push('/dashboard')}
            >
              Pokračovat do aplikace
            </Button>
          </>
        )}

        {state === 'pending' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary">
              <Loader2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Platba se zpracovává</h2>
              <p className="text-sm text-muted-foreground">
                Aktivace může trvat pár minut. Pošleme ti email jakmile bude hotová.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
              Zpět do aplikace
            </Button>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Platba se nezdařila</h2>
              <p className="text-sm text-muted-foreground">
                Platba byla zrušena nebo vypršela. Zkus to znovu.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push('/subscription')}>
              Zkusit znovu
            </Button>
          </>
        )}

      </div>
    </div>
  );
}
