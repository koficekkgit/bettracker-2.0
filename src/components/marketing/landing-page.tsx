'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  Calculator,
  Users,
  Trophy,
  Medal,
  CreditCard,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Crown,
  TrendingUp,
  ListOrdered,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'cs', label: 'CS', name: 'Čeština' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ru', label: 'RU', name: 'Русский' },
] as const;

function LanguageSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('cs');

  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (match) setCurrent(match[1]);
  }, []);

  function switchLang(code: string) {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
    setCurrent(code);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Globe className="w-3.5 h-3.5" />
        {current.toUpperCase()}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary transition-colors',
                  current === lang.code ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                <span className="text-xs font-mono w-5">{lang.label}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const FEATURES = [
  {
    icon: ListOrdered,
    title: 'Evidence sázek',
    subtitle: 'Vše na jednom místě',
    description:
      'Přidávej sázky s kurzem, vkladem, sázkovnou a kategorií. Přehledný seznam s filtry a vyhledáváním. Podporuje přes 8 sázkových kanceláří.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    mockup: <BetsMockup />,
  },
  {
    icon: BarChart3,
    title: 'Statistiky & ROI',
    subtitle: 'Víš, kde vyděláváš?',
    description:
      'Sleduj svůj profit, ROI, strike rate a formu za libovolné období. Grafy ukazují vývoj zisku v čase a výkonnost podle kategorie.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    mockup: <StatsMockup />,
  },
  {
    icon: CalendarDays,
    title: 'Kalendář',
    subtitle: 'Přehled podle dne',
    description:
      'Vidíš všechny sázky v kalendářovém pohledu. Klikni na den a zobraz detaily. Ideální pro sledování aktivity a plánování.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    mockup: <CalendarMockup />,
  },
  {
    icon: Calculator,
    title: 'Surebet kalkulačka',
    subtitle: 'Bez rizika',
    description:
      'Zadej kurzy od více sázkovek a kalkulačka ti spočítá optimální rozdělení vkladu pro garantovaný zisk bez ohledu na výsledek.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    mockup: <SurebetMockup />,
  },
  {
    icon: Trophy,
    title: 'Žebříček & Přátelé',
    subtitle: 'Soutěž s ostatními',
    description:
      'Porovnávej svůj profit a ROI s ostatními uživateli. Přidávej přátele, sleduj jejich tipy a výsledky. Žebříček se aktualizuje každý den.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    mockup: <LeaderboardMockup />,
  },
  {
    icon: Medal,
    title: 'Úspěchy & Bankroll',
    subtitle: 'Gamifikace sázení',
    description:
      'Odemykej achievementy za milníky jako 100 sázek nebo 50% strike rate. Spravuj svůj bankroll a sleduj vývoj kapitálu.',
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    mockup: <AchievementsMockup />,
  },
  {
    icon: Sparkles,
    title: 'AI analýza screenshotů',
    subtitle: 'Vyplní tiket za tebe',
    description:
      'Nahraj screenshot tiketu z mobilu nebo počítače. AI automaticky rozpozná kurz, vklad, výběr, sázkovnu i výsledek — a předvyplní celý formulář.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    mockup: <AIMockup />,
  },
];

const PLANS = [
  {
    name: 'Trial',
    price: '0',
    period: '7 dní zdarma',
    badge: 'Začni zde',
    features: [
      'Plný Pro přístup na 7 dní',
      'Bez platební karty',
      'Aktivace jedním kliknutím',
      'Vše co Pro nabízí',
    ],
    cta: 'Vyzkoušet zdarma',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 'od 99',
    period: '/měsíc',
    features: [
      'Neomezené sázky',
      'Statistiky & všechna období',
      'Kalendář, Surebet, Přátelé',
      'Úspěchy & Bankroll',
      'AI analýza screenshotů',
    ],
    cta: 'Koupit Pro',
    href: '/register',
    highlight: false,
  },
];

export function LandingPage() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((p) => (p + 1) % FEATURES.length), []);
  const prev = useCallback(() => setActive((p) => (p - 1 + FEATURES.length) % FEATURES.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next]);

  const feature = FEATURES[active];
  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="BetTracker" width={28} height={28} className="rounded-md" />
            <span className="font-semibold text-sm">BetTracker</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">Přihlásit se</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white">
                Začít zdarma
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          Trial 7 dní zdarma · bez platební karty
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
          Sleduj sázky.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            Zlepšuj výsledky.
          </span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
          Profesionální nástroj pro sázkaře. Evidence tiketu, statistiky, kalkulačka, žebříček a AI analýza screenshotů — vše na jednom místě.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8">
              <Zap className="w-4 h-4" />
              Vyzkoušet zdarma
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Mám účet
            </Button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          {[
            { value: '8+', label: 'sázkovek' },
            { value: '7 dní', label: 'trial zdarma' },
            { value: '99 Kč', label: 'od měsíčně' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features carousel */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Co BetTracker umí</h2>
          <p className="text-muted-foreground">Přejeď nebo klikni na šipky pro zobrazení všech funkcí</p>
        </div>

        <div
          className="rounded-2xl border border-border bg-card overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Main slide */}
          <div className="grid md:grid-cols-2 min-h-[380px]">

            {/* Left: text */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className={cn('inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg border mb-5', feature.bg, feature.border)}>
                <Icon className={cn('w-4 h-4', feature.color)} />
                <span className={cn('text-xs font-medium', feature.color)}>{feature.subtitle}</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Dot indicators */}
              <div className="flex items-center gap-2 mt-8">
                {FEATURES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      i === active
                        ? 'w-5 h-2 bg-amber-500'
                        : 'w-2 h-2 bg-border hover:bg-muted-foreground'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <div className="relative bg-secondary/30 border-t md:border-t-0 md:border-l border-border flex items-center justify-center p-6 overflow-hidden min-h-[240px]">
              <div className="w-full max-w-xs transition-all duration-500">
                {feature.mockup}
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="border-t border-border px-6 py-3 flex items-center justify-between bg-secondary/20">
            <button
              onClick={prev}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Předchozí
            </button>
            <span className="text-xs text-muted-foreground">
              {active + 1} / {FEATURES.length}
            </span>
            <button
              onClick={next}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Další
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature tab pills */}
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {FEATURES.map((f, i) => {
            const FIcon = f.icon;
            return (
              <button
                key={i}
                onClick={() => { setActive(i); setPaused(true); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  i === active
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <FIcon className="w-3 h-3" />
                {f.title}
              </button>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-secondary/20">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Ceny</h2>
            <p className="text-muted-foreground">Začni zdarma, Pro od 99 Kč/měsíc</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-xl border p-6 flex flex-col gap-4',
                  plan.highlight
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-border bg-card'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">Kč</span>
                    <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className={cn(
                      'w-full',
                      plan.highlight
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white'
                        : ''
                    )}
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
            Každý nový uživatel získá 7denní zkušební období zdarma. Po jeho uplynutí bude automaticky
            aktivováno placené předplatné dle zvoleného tarifu, pokud nebude před koncem zkušební doby
            zrušeno. Předplatné se automaticky obnovuje po skončení zvoleného období, dokud není
            uživatelem zrušeno. Lifetime licence poskytuje přístup ke službě po dobu existence BetTrackeru.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="BetTracker" width={20} height={20} className="rounded" />
              <span>BetTracker v2.0</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/login" className="hover:text-foreground transition-colors">Přihlásit se</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Registrace</Link>
              <Link href="/podminky" className="hover:text-foreground transition-colors">Obchodní podmínky</Link>
              <Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            BetTracker není sázková kancelář ani neposkytuje sázkové tipy nebo doporučení. Slouží výhradně jako analytický nástroj pro evidenci vlastních sázek uživatele. Služba je určena osobám starším 18 let. · Jan Adam · IČO: 23405538 · <a href="mailto:kontakt@bettracker.cz" className="hover:text-foreground transition-colors">kontakt@bettracker.cz</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Mockup components ─────────────────────────────── */

function BetsMockup() {
  const bets = [
    { team: 'Real Madrid vs Barcelona', odds: '2.10', stake: '500 Kč', result: 'win', book: 'Tipsport' },
    { team: 'Manchester City BTTS', odds: '1.85', stake: '300 Kč', result: 'loss', book: 'Fortuna' },
    { team: 'Novak Djokovic vítěz', odds: '1.65', stake: '200 Kč', result: 'win', book: 'Betano' },
  ];
  return (
    <div className="space-y-2">
      {bets.map((b, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
          <div
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              b.result === 'win' ? 'bg-emerald-500' : 'bg-red-500'
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{b.team}</p>
            <p className="text-[10px] text-muted-foreground">{b.book}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-mono font-medium">{b.odds}</p>
            <p className="text-[10px] text-muted-foreground">{b.stake}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsMockup() {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  const labels = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Profit', value: '+7 434 Kč', positive: true },
          { label: 'ROI', value: '+18.4 %', positive: true },
          { label: 'Strike rate', value: '58 %', positive: null },
          { label: 'Sázky', value: '142', positive: null },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-2.5">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn('text-sm font-bold mt-0.5', s.positive === true ? 'text-emerald-500' : s.positive === false ? 'text-red-500' : '')}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[10px] text-muted-foreground mb-2">Profit tento týden</p>
        <div className="flex items-end gap-1 h-12">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-amber-500/60"
                style={{ height: `${h}%` }}
              />
              <span className="text-[8px] text-muted-foreground">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const hasBet: Record<number, 'win' | 'loss' | 'both'> = {
    3: 'win', 5: 'loss', 8: 'both', 11: 'win', 14: 'win',
    17: 'loss', 19: 'win', 22: 'both', 25: 'win', 27: 'win',
  };
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold">Duben 2025</span>
        <div className="flex gap-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />výhra</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />prohra</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {['Po','Út','St','Čt','Pá','So','Ne'].map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground py-0.5">{d}</div>
        ))}
        {days.map((d) => {
          const mark = hasBet[d];
          return (
            <div
              key={d}
              className={cn(
                'rounded text-center text-[10px] py-1 relative',
                mark ? 'font-semibold' : 'text-muted-foreground'
              )}
            >
              {d}
              {mark && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {(mark === 'win' || mark === 'both') && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                  {(mark === 'loss' || mark === 'both') && <span className="w-1 h-1 rounded-full bg-red-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SurebetMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Zápas</p>
        <p className="text-xs font-semibold">Chelsea vs Arsenal</p>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {[
            { label: 'Chelsea', odds: '2.15', book: 'Tipsport', stake: '465 Kč' },
            { label: 'Remíza', odds: '3.40', book: 'Fortuna', stake: '294 Kč' },
            { label: 'Arsenal', odds: '3.20', book: 'Betano', stake: '313 Kč' },
          ].map((o) => (
            <div key={o.label} className="rounded border border-border p-2 text-center">
              <p className="text-[9px] text-muted-foreground">{o.label}</p>
              <p className="text-sm font-bold font-mono mt-0.5">{o.odds}</p>
              <p className="text-[9px] text-muted-foreground">{o.book}</p>
              <p className="text-[9px] font-medium text-amber-500 mt-1">{o.stake}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Garantovaný zisk</p>
          <p className="text-lg font-bold text-emerald-500">+47 Kč</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Celkový vklad</p>
          <p className="text-sm font-semibold">1 072 Kč</p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardMockup() {
  const rows = [
    { pos: 1, name: 'Xeon', profit: '+12 840', roi: '+24.1%', crown: true },
    { pos: 2, name: 'koficekk', profit: '+7 434', roi: '+18.4%', crown: false },
    { pos: 3, name: 'TipsterPro', profit: '+5 210', roi: '+15.7%', crown: false },
    { pos: 4, name: 'sazkar99', profit: '+2 100', roi: '+8.3%', crown: false },
  ];
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold">Žebříček — 30 dní</span>
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
      </div>
      {rows.map((r) => (
        <div key={r.pos} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-0">
          <span className={cn('w-4 text-center text-xs font-bold', r.pos === 1 ? 'text-amber-500' : 'text-muted-foreground')}>
            {r.pos === 1 ? '👑' : r.pos}
          </span>
          <span className="flex-1 text-xs font-medium">{r.name}</span>
          <span className="text-xs text-emerald-500 font-mono font-semibold">{r.profit} Kč</span>
          <span className="text-[10px] text-muted-foreground font-mono w-12 text-right">{r.roi}</span>
        </div>
      ))}
    </div>
  );
}

function AchievementsMockup() {
  const achievements = [
    { emoji: '🎯', name: 'První sázka', unlocked: true },
    { emoji: '🔥', name: '10 výher v řadě', unlocked: true },
    { emoji: '💰', name: '10 000 Kč profit', unlocked: true },
    { emoji: '🏆', name: '50% strike rate', unlocked: false },
    { emoji: '⚡', name: '100 sázek', unlocked: false },
    { emoji: '👑', name: 'Top 10 žebříček', unlocked: false },
  ];
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Bankroll</p>
          <p className="text-lg font-bold">24 580 Kč</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Celkový růst</p>
          <p className="text-sm font-semibold text-emerald-500">+43.2 %</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {achievements.map((a) => (
          <div
            key={a.name}
            className={cn(
              'rounded-lg border p-2 text-center',
              a.unlocked ? 'border-amber-500/30 bg-amber-500/10' : 'border-border bg-card opacity-40'
            )}
          >
            <p className="text-lg">{a.emoji}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{a.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-cyan-400/40 bg-cyan-400/5 p-4 text-center">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
        <p className="text-xs font-medium">Nahraj screenshot tiketu</p>
        <p className="text-[10px] text-muted-foreground mt-1">Drag & drop, Ctrl+V nebo klikni</p>
      </div>
      <div className="space-y-1.5">
        {[
          { label: 'Kurz', value: '2.10', filled: true },
          { label: 'Vklad', value: '500 Kč', filled: true },
          { label: 'Výběr', value: 'Manchester City vítěz', filled: true },
          { label: 'Sázkovna', value: 'Tipsport', filled: true },
          { label: 'Výsledek', value: 'Výhra ✓', filled: true },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground w-14 shrink-0">{f.label}</span>
            <span className={cn('text-xs font-medium', f.filled ? 'text-foreground' : 'text-muted-foreground/40')}>
              {f.value}
            </span>
            {f.filled && <Check className="w-3 h-3 text-emerald-500 ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  );
}
