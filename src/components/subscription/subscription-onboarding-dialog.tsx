'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Crown, Check, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';
import { useProfile } from '@/hooks/use-profile';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * Zobrazí se novému uživateli (má username, nikdy neměl trial ani pro).
 * Nabídne aktivaci 7denního trialu nebo přechod na Pro.
 */
export function SubscriptionOnboardingDialog() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const sub = useSubscription();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Zobraz jen pokud: profile načten, má username, nikdy neměl trial, je free
  const show =
    !profileLoading &&
    !!profile &&
    !!profile.username &&
    !profile.trial_ends_at &&
    profile.subscription_status === 'free' &&
    !sub.loading;

  if (!show) return null;

  async function handleStartTrial() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('start_free_trial');
    setLoading(false);
    if (error) {
      toast.error('Nepodařilo se aktivovat trial: ' + error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    toast.success('Trial aktivován! Máš 7 dní Pro zdarma 🎉');
  }

  function handleBuyPro() {
    router.push('/subscription');
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 px-6 pt-8 pb-6 text-center border-b border-border">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 mb-4">
            <Zap className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Vítej v BetTrackeru!</h2>
          <p className="text-sm text-muted-foreground">
            Jak chceš začít?
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">

          {/* Trial option */}
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full text-left rounded-lg border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors p-4 group"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Vyzkoušet zdarma
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">7 dní</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plný přístup ke všemu na 7 dní — bez platební karty
                </p>
              </div>
            </div>
          </button>

          {/* Pro option */}
          <button
            onClick={handleBuyPro}
            disabled={loading}
            className="w-full text-left rounded-lg border-2 border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-amber-500">Koupit Pro</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Od 99 Kč/měsíc · Lifetime za 1 199 Kč
                </p>
              </div>
            </div>
          </button>

          {/* Features */}
          <div className="pt-1 grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              'Neomezené sázky',
              'Statistiky (všechna období)',
              'Kalendář sázek',
              'Surebet kalkulačka',
              'Přátelé & žebříček',
              'Úspěchy & bankroll',
              'AI analýza screenshotů',
            ].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-amber-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
