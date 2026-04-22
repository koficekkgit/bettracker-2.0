'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, ListOrdered, BarChart3, CalendarDays,
  Calculator, Users, UsersRound, Trophy, Wallet,
  Medal, Settings, ShieldCheck, LogOut, Moon, Sun, Zap, Crown,
  UserCircle2, ClipboardList, Sparkles, Pin, PinOff,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/hooks/use-profile';
import { useSubscription } from '@/hooks/use-subscription';
import { usePendingFriendRequestCount } from '@/hooks/use-friends';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  color: string;
  badge?: 'beta';
};

type NavGroup = {
  label?: string;
  accent?: string; // tailwind bg + text classes for the section label dot
  items: NavItem[];
};

export function Sidebar() {
  const t        = useTranslations('nav');
  const tPayouts = useTranslations('payouts');
  const tAch     = useTranslations('achievements');
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { data: profile } = useProfile();
  const sub = useSubscription();
  const { data: pendingRequests = 0 } = usePendingFriendRequestCount();
  const [mounted,  setMounted]  = useState(false);
  const [hovered,  setHovered]  = useState(false);
  const [pinned,   setPinned]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const expanded = pinned || hovered;

  const groups: NavGroup[] = [
    {
      items: [
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, color: 'text-blue-400' },
      ],
    },
    {
      label: 'Sázky',
      accent: 'bg-blue-500',
      items: [
        { href: '/bets',     label: t('bets'),     icon: ListOrdered,  color: 'text-blue-400' },
        { href: '/stats',    label: t('stats'),    icon: BarChart3,    color: 'text-violet-400' },
        { href: '/calendar', label: t('calendar'), icon: CalendarDays, color: 'text-indigo-400' },
        { href: '/surebet',  label: t('surebet'),  icon: Calculator,   color: 'text-cyan-400' },
      ],
    },
    {
      label: 'Komunita',
      accent: 'bg-emerald-500',
      items: [
        { href: '/friends',     label: t('friends'),     icon: Users,      color: 'text-emerald-400' },
        { href: '/groups',      label: t('groups'),      icon: UsersRound, color: 'text-emerald-400', badge: 'beta' },
        { href: '/leaderboard', label: t('leaderboard'), icon: Trophy,     color: 'text-amber-400' },
      ],
    },
    {
      label: 'SM',
      accent: 'bg-amber-500',
      items: [
        { href: '/achievements', label: tAch('title'),  icon: Medal,         color: 'text-amber-400' },
        { href: '/tasks',        label: 'Úkoly',        icon: ClipboardList, color: 'text-amber-400' },
        { href: '/character',    label: 'Postava & Bedny', icon: UserCircle2, color: 'text-violet-400' },
      ],
    },
    ...(profile?.payouts_enabled ? [{
      label: 'Finance',
      items: [
        { href: '/payouts', label: tPayouts('title'), icon: Wallet, color: 'text-green-400' },
      ],
    }] : []),
    {
      label: 'Předplatné',
      accent: 'bg-amber-500',
      items: [
        { href: '/subscription', label: 'Předplatné', icon: Crown, color: 'text-amber-400' },
      ],
    },
    {
      label: 'Účet',
      items: [
        { href: '/settings', label: t('settings'), icon: Settings,    color: 'text-slate-400' },
        ...(profile?.is_admin
          ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck, color: 'text-red-400' }]
          : []),
      ],
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        // Mobile: full-width horizontal bar at top
        'w-full border-b border-border bg-card flex md:flex-col',
        // Desktop: narrow icon rail that expands
        'md:border-b-0 md:border-r md:h-screen md:flex-shrink-0',
        'md:transition-[width] md:duration-200 md:ease-out',
        expanded ? 'md:w-60' : 'md:w-14',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'hidden md:flex items-center border-b border-border flex-shrink-0 overflow-hidden',
        expanded ? 'gap-3 px-4 py-4 justify-between' : 'px-0 py-4 justify-center',
      )}>
        <div className={cn('flex items-center gap-3', !expanded && 'justify-center w-full')}>
          <Image src="/logo.png" alt="BetTracker" width={34} height={34} className="rounded-md flex-shrink-0" />
          {expanded && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight whitespace-nowrap">BetTracker</p>
              <p className="text-[10px] text-muted-foreground tracking-wide">v2.0</p>
            </div>
          )}
        </div>
        {/* Pin button */}
        {expanded && (
          <button
            onClick={() => setPinned(p => !p)}
            className="p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary transition-colors flex-shrink-0"
            title={pinned ? 'Odepnout' : 'Připnout'}
          >
            {pinned
              ? <Pin className="w-3.5 h-3.5 fill-current" />
              : <PinOff className="w-3.5 h-3.5" />
            }
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex md:flex-col flex-1 px-2 py-3 gap-0.5 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden">
        {groups.map((group, gi) => (
          <div key={gi} className={cn('flex md:flex-col', gi > 0 && 'md:mt-3')}>

            {/* Section label — only when expanded */}
            {group.label && expanded && (
              <div className="hidden md:flex items-center gap-2 px-3 mb-1">
                {group.accent && (
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', group.accent)} />
                )}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none whitespace-nowrap overflow-hidden">
                  {group.label}
                </p>
              </div>
            )}

            {/* Divider when collapsed */}
            {group.label && !expanded && gi > 0 && (
              <div className="hidden md:block mx-auto w-6 h-px bg-border my-1.5" />
            )}

            {group.items.map((item) => {
              const Icon   = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!expanded ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap overflow-hidden',
                    // When collapsed on desktop: center the icon
                    expanded ? 'px-3 py-2' : 'md:justify-center md:px-0 md:py-2 px-3 py-2',
                    active
                      ? 'bg-secondary text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                  )}
                >
                  {/* Active bar */}
                  {active && expanded && (
                    <span className={cn('absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full', item.color.replace('text-', 'bg-'))} />
                  )}

                  {/* Active dot when collapsed */}
                  {active && !expanded && (
                    <span className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full hidden md:block', item.color.replace('text-', 'bg-'))} />
                  )}

                  <Icon className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    active ? item.color : 'text-muted-foreground group-hover:' + item.color.replace('text-', 'text-'),
                  )} />

                  {/* Label — hidden on desktop when collapsed */}
                  <span className={cn(
                    'flex-1 transition-all duration-150',
                    !expanded && 'md:hidden',
                  )}>
                    {item.label}
                  </span>

                  {/* BETA badge */}
                  {item.badge === 'beta' && expanded && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-violet-500/15 border border-violet-500/25 text-violet-400">
                      Beta
                    </span>
                  )}

                  {/* Pending requests */}
                  {item.href === '/friends' && pendingRequests > 0 && (
                    <span className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse flex-shrink-0',
                      !expanded && 'md:absolute md:top-0.5 md:right-0.5 md:h-3 md:w-3',
                    )}>
                      {!expanded ? '' : pendingRequests > 9 ? '9+' : pendingRequests}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom widgets */}
      <div className="hidden md:flex flex-col gap-1.5 p-3 border-t border-border overflow-hidden">

        {/* Subscription — only when expanded */}
        {expanded && !sub.loading && (
          <div className="mb-1">
            {sub.isPro && sub.plan === 'lifetime' && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-500 whitespace-nowrap">Pro Lifetime</p>
                  <p className="text-[10px] text-muted-foreground">Neomezený přístup</p>
                </div>
              </div>
            )}
            {sub.isPro && !sub.isTrial && sub.plan !== 'lifetime' && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-amber-500">Pro</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{sub.daysLeft} dní</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, ((sub.daysLeft ?? 0) / 365) * 100)}%` }} />
                </div>
                <Link href="/subscription" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Prodloužit →</Link>
              </div>
            )}
            {sub.isTrial && (
              <div className="rounded-lg border border-border px-3 py-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Trial</span>
                  <span className="text-[10px] text-muted-foreground">{sub.daysLeft} dní</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, ((sub.daysLeft ?? 0) / 7) * 100)}%` }} />
                </div>
                <Link href="/subscription" className="flex items-center justify-center gap-1.5 w-full mt-1 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all">
                  <Zap className="w-3 h-3" /> Aktivovat Pro
                </Link>
              </div>
            )}
            {sub.isFree && (
              <div className="rounded-lg border border-border px-3 py-2">
                <Link href="/subscription" className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 transition-all">
                  <Zap className="w-3 h-3" /> Aktivovat Pro
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Pro icon when collapsed */}
        {!expanded && sub.isPro && (
          <div className="flex justify-center mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={expanded ? undefined : theme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}
          suppressHydrationWarning
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all',
            !expanded && 'justify-center',
          )}
        >
          {mounted
            ? theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />
            : <Moon className="w-4 h-4 flex-shrink-0" />
          }
          {expanded && mounted && <span className="whitespace-nowrap">{theme === 'dark' ? 'Světlý' : 'Tmavý'} režim</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={expanded ? undefined : 'Odhlásit se'}
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all',
            !expanded && 'justify-center',
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {expanded && <span className="whitespace-nowrap">Odhlásit se</span>}
        </button>

        {/* Legal links — only expanded */}
        {expanded && (
          <div className="flex gap-2 flex-wrap pt-1.5 border-t border-border mt-0.5">
            <Link href="/podminky" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Podmínky</Link>
            <span className="text-[10px] text-muted-foreground">·</span>
            <Link href="/gdpr"      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">GDPR</Link>
            <span className="text-[10px] text-muted-foreground">·</span>
            <Link href="/cookies"   className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Cookies</Link>
          </div>
        )}
      </div>
    </aside>
  );
}
