'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Wallet, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { useBookmakerAccounts } from '@/hooks/use-bankroll';

/**
 * Žluté upozornění na dashboardu pro usery, kteří mají bookmaker účty
 * (vzniklé z migrace) ale nikdy si nenastavili reálný balance přes onboarding.
 * Dá se dočasně skrýt přes X (jen v session).
 */
export function BankrollOnboardingBanner() {
  const t = useTranslations();
  const { data: profile } = useProfile();
  const { data: accounts } = useBookmakerAccounts();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;
  if (!profile || !accounts) return null;
  if (profile.bankroll_onboarded_at) return null;
  if (accounts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-md bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <Wallet className="w-5 h-5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{t('bankroll.banner.title')}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {t('bankroll.banner.description')}
        </div>
      </div>
      <Link
        href="/bankroll"
        className="inline-flex items-center gap-1 text-sm font-medium text-amber-500 hover:text-amber-400 whitespace-nowrap"
      >
        {t('bankroll.banner.cta')}
        <ArrowRight className="w-4 h-4" />
      </Link>
      <button
        onClick={() => setHidden(true)}
        className="text-muted-foreground hover:text-foreground"
        title={t('common.close')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
