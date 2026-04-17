'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Check } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';

const ALLOWED_PATHS = ['/subscription', '/settings'];

interface Props {
  children: React.ReactNode;
}

export function GlobalPaywall({ children }: Props) {
  const sub = useSubscription();
  const pathname = usePathname();

  // Načítání — nič nezobrazuj
  if (sub.loading) return null;

  // Pro nebo Trial — normální obsah
  if (sub.isPro || sub.isTrial) return <>{children}</>;

  // Subscription nebo settings stránka — vždy přístupná
  if (ALLOWED_PATHS.some((p) => pathname.startsWith(p))) return <>{children}</>;

  // Free — paywall
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20">
          <Zap className="w-8 h-8 text-amber-500" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">BetTracker Pro</h2>
          <p className="text-muted-foreground text-sm">
            Pro přístup k aplikaci je potřeba aktivní Pro předplatné.
          </p>
        </div>

        <ul className="text-sm space-y-2 text-left inline-block">
          {[
            'Neomezený počet sázek (Free má max 5)',
            'Statistiky — všechna časová období',
            'Kalendář sázek',
            'Surebet kalkulačka',
            'Přátelé & žebříček',
            'Úspěchy (achievements)',
            'Správa bankrollu',
            'AI analýza screenshotů tiketu',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4 text-amber-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Link href="/subscription">
          <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold">
            <Zap className="w-4 h-4" />
            Aktivovat Pro
          </Button>
        </Link>
      </div>
    </div>
  );
}
