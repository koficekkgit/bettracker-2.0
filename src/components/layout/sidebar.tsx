'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ListOrdered, BarChart3, CalendarDays, Calculator, Users, Trophy, Settings, ShieldCheck, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { data: profile } = useProfile();
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
    { href: '/settings', label: t('settings'), icon: Settings },
    ...(profile?.is_admin ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-full md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-border bg-card flex md:flex-col">
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
