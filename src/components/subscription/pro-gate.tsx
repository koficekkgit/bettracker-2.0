'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/use-subscription';

interface Props {
  children: React.ReactNode;
  feature?: string;
}

/**
 * Obalí children. Pokud uživatel není Pro (ani v trialu), místo nich zobrazí paywall.
 */
export function ProGate({ children, feature }: Props) {
  const sub = useSubscription();

  if (sub.loading) {
    return <div className="text-sm text-muted-foreground">Načítání...</div>;
  }

  if (sub.isPro) {
    return <>{children}</>;
  }

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1">Pro funkce</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {feature ? `${feature} je dostupné v Pro verzi BetTrackeru.` : 'Tato funkce je dostupná v Pro verzi BetTrackeru.'}
            {' '}Aktivuj Pro pro odemčení všech funkcí.
          </p>
        </div>
        <Link href="/settings#subscription">
          <Button>
            <Sparkles className="w-4 h-4" />
            Získat Pro
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
