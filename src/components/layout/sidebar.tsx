'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ListOrdered, BarChart3, CalendarDays, Calculator, Users, Trophy, Wallet, CreditCard, Medal, Settings, ShieldCheck, LogOut, Moon, Sun, Zap, Crown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const t = useTranslations('nav');
  const tPayouts = useTranslations('payouts');
  const tBankroll = useTranslations('bankroll');
  const tAch = useTranslations('achievements');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { data: profile } = useProfile();
  const sub = useSubscription();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/bets', label: t('bets'), icon: ListOrdered },
    { href: '/stats', label: t('stats'), icon: BarChart3 },
    { href: '/calendar', label: t('calendar'), icon: CalendarDays },
    { href: '/surebet', label: t('surebet'), icon: Calculator },
    { href: '/friends', label: t('friends'), icon: Users },
    { href: '/leaderboard', label: t('leaderboard'), icon: Trophy },
    { href: '/achievements', label: tAch('title'), icon: Medal },
    { href: '/bankroll', label: tBankroll('title'), icon: CreditCard },
    ...(profile?.payouts_enabled ? [{ href: '/payouts', label: tPayouts('title'), icon: Wallet }] : []),
    { href: '/settings', label: t('settings'), icon: Settings },
    ...(profile?.is_admin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-full md:w-64 md:h-screen md:flex-shrink-0 border-b md:border-b-0 md:border-r border-border bg-card flex md:flex-col">
      <div className="hidden md:flex items-center gap-3 p-5 border-b border-border">
        <Image src="/logo.png" alt="BetTracker" width={40} height={40} className="rounded-md" />
        <div>
          <p className="font-semibold leading-tight">BetTracker</p>
          <p className="text-xs text-muted-foreground">v2.0</p>
        </div>
      </div>

      <nav className="flex md:flex-col flex-1 p-2 md:p-3 gap-1 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden md:flex flex-col gap-1 p-3 border-t border-border">
        {/* Subscription widget */}
        {!sub.loading && (
          <div className="mb-2">
            {/* Lifetime Pro */}
            {sub.isPro && sub.plan === 'lifetime' && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-500">Pro Lifetime</p>
                  <p className="text-[10px] text-muted-foreground">Neomezený přístup</p>
                </div>
              </div>
            )}

            {/* Pro s expirací */}
            {sub.isPro && !sub.isTrial && sub.plan !== 'lifetime' && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-500">Pro</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{sub.daysLeft} dní</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.min(100, ((sub.daysLeft ?? 0) / 365) * 100)}%` }}
                  />
                </div>
                <Link href="/subscription" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  Prodloužit →
                </Link>
              </div>
            )}

            {/* Trial */}
            {sub.isTrial && (
              <div className="rounded-lg border border-border px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Trial</span>
                  <span className="text-[10px] text-muted-foreground">{sub.daysLeft} dní zbývá</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, ((sub.daysLeft ?? 0) / 7) * 100)}%` }}
                  />
                </div>
                <Link
                  href="/subscription"
                  className="flex items-center justify-center gap-1.5 w-full mt-1 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  Aktivovat Pro
                </Link>
              </div>
            )}

            {/* Free */}
            {sub.isFree && (
              <div className="rounded-lg border border-border px-3 py-2.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Free plán</span>
                </div>
                <Link
                  href="/subscription"
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  Aktivovat Pro
                </Link>
              </div>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="justify-start"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          suppressHydrationWarning
        >
          {mounted ? (
            <>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span className="opacity-0">Theme</span>
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" className="justify-start" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

    </aside>
  );
}
