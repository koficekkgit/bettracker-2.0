'use client';

import Link from 'next/link';
import { Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSubscription } from '@/hooks/use-subscription';

/**
 * Banner se zobrazuje na všech stránkách v trialu nebo s blížícím se koncem subscription.
 * Můžeš ho zavřít, ale po refreshi se vrátí (úmyslně - aby se neztratil).
 */
export function TrialBanner() {
  const sub = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismiss při změně stavu
  useEffect(() => {
    setDismissed(false);
  }, [sub.status]);

  if (sub.loading || dismissed) return null;

  // Trial - vždy ukázat počet dní
  if (sub.isTrial && sub.daysLeft !== null) {
    return (
      <div className="bg-accent border-b border-border px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>
              <span className="font-medium">Trial Pro</span>
              <span className="text-muted-foreground">
                {' '}· {sub.daysLeft === 1 ? 'poslední den' : `zbývá ${sub.daysLeft} dní`}
              </span>
            </span>
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/subscription"
              className="text-sm font-medium underline hover:no-underline"
            >
              Aktivovat Pro →
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pro s blížícím se koncem (méně než 7 dní)
  if (sub.isPro && sub.daysLeft !== null && sub.daysLeft <= 7) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm">
            <span className="font-medium text-amber-600">Pro vyprší za {sub.daysLeft} dní</span>
          </p>
          <Link
            href="/subscription"
            className="text-sm font-medium underline hover:no-underline"
          >
            Prodloužit →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
