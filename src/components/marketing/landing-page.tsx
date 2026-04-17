'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3, CalendarDays, Calculator, Users, Trophy,
  Medal, Sparkles, Check, ChevronLeft, ChevronRight,
  Zap, Globe, ListOrdered,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'cs' | 'en' | 'ru';

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  cs: {
    login: 'Přihlásit se',
    register: 'Začít zdarma',
    heroBadge: 'Trial 7 dní zdarma · bez platební karty',
    heroTitle1: 'Sleduj sázky.',
    heroTitle2: 'Zlepšuj výsledky.',
    heroDesc: 'Profesionální nástroj pro sázkaře. Evidence tiketu, statistiky, kalkulačka, žebříček a AI analýza screenshotů — vše na jednom místě.',
    heroCta: 'Vyzkoušet zdarma',
    heroLogin: 'Mám účet',
    stat1: 'sázkovek',
    stat2: 'trial zdarma',
    stat3: 'od měsíčně',
    featuresTitle: 'Co BetTracker umí',
    featuresSubtitle: 'Přejeď nebo klikni na šipky pro zobrazení všech funkcí',
    prev: 'Předchozí',
    next: 'Další',
    pricingTitle: 'Ceny',
    pricingSubtitle: 'Začni s triálem, Pro od 99 Kč/měsíc',
    pricingDisclaimer: 'Každý nový uživatel získá 7denní zkušební období zdarma. Po jeho uplynutí bude automaticky aktivováno placené předplatné dle zvoleného tarifu, pokud nebude před koncem zkušební doby zrušeno. Předplatné se automaticky obnovuje, dokud není uživatelem zrušeno.',
    footerLogin: 'Přihlásit se',
    footerRegister: 'Registrace',
    footerTerms: 'Obchodní podmínky',
    footerLegal: 'BetTracker není sázková kancelář ani neposkytuje sázkové tipy nebo doporučení. Slouží výhradně jako analytický nástroj pro evidenci vlastních sázek uživatele. Služba je určena osobám starším 18 let.',
    trialBadge: 'Začni zde',
    trialPeriod: '7 dní zdarma',
    trialFeatures: ['Plný Pro přístup na 7 dní', 'Bez platební karty', 'Aktivace jedním kliknutím', 'Vše co Pro nabízí'],
    trialCta: 'Vyzkoušet zdarma',
    proPeriod: '/měsíc',
    proFeatures: ['Neomezené sázky', 'Statistiky & všechna období', 'Kalendář, Surebet, Přátelé', 'Úspěchy & Bankroll', 'AI analýza screenshotů'],
    proCta: 'Koupit Pro',
    features: [
      { title: 'Evidence sázek', subtitle: 'Vše na jednom místě', desc: 'Přidávej sázky s kurzem, vkladem, sázkovnou a kategorií. Přehledný seznam s filtry a vyhledáváním. Podporuje přes 8 sázkovek.' },
      { title: 'Statistiky & ROI', subtitle: 'Víš, kde vyděláváš?', desc: 'Sleduj svůj profit, ROI, strike rate a formu za libovolné období. Grafy ukazují vývoj zisku v čase a výkonnost podle kategorie.' },
      { title: 'Kalendář', subtitle: 'Přehled podle dne', desc: 'Vidíš všechny sázky v kalendářovém pohledu. Klikni na den a zobraz detaily. Ideální pro sledování aktivity a plánování.' },
      { title: 'Surebet kalkulačka', subtitle: 'Bez rizika', desc: 'Zadej kurzy od více sázkovek a kalkulačka ti spočítá optimální rozdělení vkladu pro garantovaný zisk bez ohledu na výsledek.' },
      { title: 'Žebříček & Přátelé', subtitle: 'Soutěž s ostatními', desc: 'Porovnávej svůj profit a ROI s ostatními uživateli. Přidávej přátele, sleduj jejich výsledky. Žebříček se aktualizuje každý den.' },
      { title: 'Úspěchy & Bankroll', subtitle: 'Gamifikace sázení', desc: 'Odemykej achievementy za milníky jako 100 sázek nebo 50% strike rate. Spravuj svůj bankroll a sleduj vývoj kapitálu.' },
      { title: 'AI analýza screenshotů', subtitle: 'Vyplní tiket za tebe', desc: 'Nahraj screenshot tiketu z mobilu nebo počítače. AI automaticky rozpozná kurz, vklad, výběr, sázkovnu i výsledek — a předvyplní celý formulář.' },
    ],
  },
  en: {
    login: 'Log in',
    register: 'Start free',
    heroBadge: '7-day free trial · no credit card required',
    heroTitle1: 'Track your bets.',
    heroTitle2: 'Improve your results.',
    heroDesc: 'Professional tool for bettors. Bet tracking, statistics, calculator, leaderboard and AI screenshot analysis — all in one place.',
    heroCta: 'Try for free',
    heroLogin: 'I have an account',
    stat1: 'bookmakers',
    stat2: 'free trial',
    stat3: 'from/month',
    featuresTitle: 'What BetTracker can do',
    featuresSubtitle: 'Swipe or click the arrows to see all features',
    prev: 'Previous',
    next: 'Next',
    pricingTitle: 'Pricing',
    pricingSubtitle: 'Start with a trial, Pro from 99 CZK/month',
    pricingDisclaimer: 'Every new user gets a 7-day free trial. After it expires, a paid subscription will be automatically activated according to the chosen plan, unless cancelled before the end of the trial period. Subscription renews automatically until cancelled.',
    footerLogin: 'Log in',
    footerRegister: 'Register',
    footerTerms: 'Terms of Service',
    footerLegal: 'BetTracker is not a bookmaker and does not provide betting tips or recommendations. It serves exclusively as an analytical tool for recording your own bets. The service is intended for persons over 18 years of age.',
    trialBadge: 'Start here',
    trialPeriod: '7 days free',
    trialFeatures: ['Full Pro access for 7 days', 'No credit card needed', 'One-click activation', 'Everything Pro offers'],
    trialCta: 'Try for free',
    proPeriod: '/month',
    proFeatures: ['Unlimited bets', 'Statistics & all periods', 'Calendar, Surebet, Friends', 'Achievements & Bankroll', 'AI screenshot analysis'],
    proCta: 'Buy Pro',
    features: [
      { title: 'Bet Tracking', subtitle: 'Everything in one place', desc: 'Add bets with odds, stake, bookmaker and category. Clean list with filters and search. Supports over 8 bookmakers.' },
      { title: 'Statistics & ROI', subtitle: 'Know where you profit?', desc: 'Track your profit, ROI, strike rate and form over any period. Charts show profit development over time and performance by category.' },
      { title: 'Calendar', subtitle: 'Daily overview', desc: 'See all bets in a calendar view. Click on a day to show details. Ideal for tracking activity and planning.' },
      { title: 'Surebet Calculator', subtitle: 'Risk-free', desc: 'Enter odds from multiple bookmakers and the calculator will find the optimal stake distribution for a guaranteed profit regardless of the result.' },
      { title: 'Leaderboard & Friends', subtitle: 'Compete with others', desc: 'Compare your profit and ROI with other users. Add friends, track their tips and results. Leaderboard updates every day.' },
      { title: 'Achievements & Bankroll', subtitle: 'Gamified betting', desc: 'Unlock achievements for milestones like 100 bets or 50% strike rate. Manage your bankroll and track capital growth.' },
      { title: 'AI Screenshot Analysis', subtitle: 'Auto-fills your ticket', desc: 'Upload a bet slip screenshot from your phone or computer. AI automatically detects odds, stake, pick, bookmaker and result — and pre-fills the whole form.' },
    ],
  },
  ru: {
    login: 'Войти',
    register: 'Начать бесплатно',
    heroBadge: 'Бесплатный триал 7 дней · без карты',
    heroTitle1: 'Отслеживай ставки.',
    heroTitle2: 'Улучшай результаты.',
    heroDesc: 'Профессиональный инструмент для беттеров. Учёт ставок, статистика, калькулятор, таблица лидеров и AI-анализ скриншотов — всё в одном месте.',
    heroCta: 'Попробовать бесплатно',
    heroLogin: 'У меня есть аккаунт',
    stat1: 'букмекеров',
    stat2: 'триал бесплатно',
    stat3: 'от/месяц',
    featuresTitle: 'Что умеет BetTracker',
    featuresSubtitle: 'Листайте или нажимайте стрелки для просмотра функций',
    prev: 'Назад',
    next: 'Вперёд',
    pricingTitle: 'Цены',
    pricingSubtitle: 'Начни с триала, Pro от 99 CZK/месяц',
    pricingDisclaimer: 'Каждый новый пользователь получает 7-дневный бесплатный триал. По истечении триала автоматически активируется платная подписка выбранного тарифа, если она не будет отменена до конца пробного периода. Подписка обновляется автоматически до отмены.',
    footerLogin: 'Войти',
    footerRegister: 'Регистрация',
    footerTerms: 'Условия использования',
    footerLegal: 'BetTracker не является букмекерской конторой и не предоставляет ставки или рекомендации. Служит исключительно аналитическим инструментом для учёта собственных ставок. Сервис предназначен для лиц старше 18 лет.',
    trialBadge: 'Начни здесь',
    trialPeriod: '7 дней бесплатно',
    trialFeatures: ['Полный Pro доступ на 7 дней', 'Без банковской карты', 'Активация в один клик', 'Всё что предлагает Pro'],
    trialCta: 'Попробовать бесплатно',
    proPeriod: '/месяц',
    proFeatures: ['Неограниченные ставки', 'Статистика и все периоды', 'Календарь, Surebet, Друзья', 'Достижения и Банкролл', 'AI-анализ скриншотов'],
    proCta: 'Купить Pro',
    features: [
      { title: 'Учёт ставок', subtitle: 'Всё в одном месте', desc: 'Добавляй ставки с коэффициентом, суммой, букмекером и категорией. Удобный список с фильтрами и поиском. Поддерживает более 8 букмекеров.' },
      { title: 'Статистика & ROI', subtitle: 'Знаешь, где зарабатываешь?', desc: 'Отслеживай прибыль, ROI, процент побед и форму за любой период. Графики показывают динамику прибыли и эффективность по категориям.' },
      { title: 'Календарь', subtitle: 'Обзор по дням', desc: 'Смотри все ставки в календарном виде. Нажми на день для просмотра деталей. Идеально для отслеживания активности и планирования.' },
      { title: 'Калькулятор Surebet', subtitle: 'Без риска', desc: 'Введи коэффициенты от нескольких букмекеров, и калькулятор рассчитает оптимальное распределение ставок для гарантированной прибыли.' },
      { title: 'Таблица & Друзья', subtitle: 'Соревнуйся с другими', desc: 'Сравнивай свою прибыль и ROI с другими пользователями. Добавляй друзей, следи за их результатами. Таблица обновляется каждый день.' },
      { title: 'Достижения & Банкролл', subtitle: 'Геймификация беттинга', desc: 'Открывай достижения за вехи: 100 ставок, 50% побед и другие. Управляй банкроллом и отслеживай рост капитала.' },
      { title: 'AI-анализ скриншотов', subtitle: 'Заполнит тикет за тебя', desc: 'Загрузи скриншот тикета с телефона или компьютера. AI автоматически распознает коэффициент, сумму, исход, букмекера и результат.' },
    ],
  },
} as const;

const FEATURE_STYLES = [
  { icon: ListOrdered, color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20' },
  { icon: BarChart3,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { icon: CalendarDays,color: 'text-violet-400',  bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  { icon: Calculator,  color: 'text-orange-400',  bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  { icon: Trophy,      color: 'text-amber-400',   bg: 'bg-amber-400/10',  border: 'border-amber-400/20' },
  { icon: Medal,       color: 'text-pink-400',    bg: 'bg-pink-400/10',   border: 'border-pink-400/20' },
  { icon: Sparkles,    color: 'text-cyan-400',    bg: 'bg-cyan-400/10',   border: 'border-cyan-400/20' },
];

const LANGUAGES: { code: Lang; label: string; name: string }[] = [
  { code: 'cs', label: 'CS', name: 'Čeština' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ru', label: 'RU', name: 'Русский' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function LandingPage() {
  const [lang, setLang] = useState<Lang>('cs');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Read lang from cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    const saved = match?.[1];
    if (saved === 'en' || saved === 'ru' || saved === 'cs') setLang(saved);
  }, []);

  function switchLang(code: Lang) {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000`;
    setLang(code);
    setLangOpen(false);
  }

  const t = T[lang];
  const features = t.features;

  const next = useCallback(() => setActive((p) => (p + 1) % features.length), [features.length]);
  const prev = useCallback(() => setActive((p) => (p - 1 + features.length) % features.length), [features.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [paused, next]);

  const feature = features[active];
  const style = FEATURE_STYLES[active];
  const Icon = style.icon;

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

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang.toUpperCase()}
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[130px] rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => switchLang(l.code)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary transition-colors',
                          lang === l.code ? 'text-foreground font-medium' : 'text-muted-foreground'
                        )}
                      >
                        <span className="text-xs font-mono w-5 shrink-0">{l.label}</span>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href="/login">
              <Button variant="ghost" size="sm">{t.login}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white">
                {t.register}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          {t.heroBadge}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-tight">
          {t.heroTitle1}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            {t.heroTitle2}
          </span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
          {t.heroDesc}
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8">
              <Zap className="w-4 h-4" />
              {t.heroCta}
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">{t.heroLogin}</Button>
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-4 max-w-sm mx-auto text-center">
          {[
            { value: '8+', label: t.stat1 },
            { value: '7 dní', label: t.stat2 },
            { value: '99 Kč', label: t.stat3 },
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
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.featuresTitle}</h2>
          <p className="text-muted-foreground">{t.featuresSubtitle}</p>
        </div>

        <div
          className="rounded-2xl border border-border bg-card overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="grid md:grid-cols-2 min-h-[380px]">
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className={cn('inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg border mb-5', style.bg, style.border)}>
                <Icon className={cn('w-4 h-4', style.color)} />
                <span className={cn('text-xs font-medium', style.color)}>{feature.subtitle}</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              <div className="flex items-center gap-2 mt-8">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      i === active ? 'w-5 h-2 bg-amber-500' : 'w-2 h-2 bg-border hover:bg-muted-foreground'
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="relative bg-secondary/30 border-t md:border-t-0 md:border-l border-border flex items-center justify-center p-6 overflow-hidden min-h-[240px]">
              <div className="w-full max-w-xs">
                <FeatureMockup index={active} lang={lang} />
              </div>
            </div>
          </div>

          <div className="border-t border-border px-6 py-3 flex items-center justify-between bg-secondary/20">
            <button onClick={prev} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />{t.prev}
            </button>
            <span className="text-xs text-muted-foreground">{active + 1} / {features.length}</span>
            <button onClick={next} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.next}<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {features.map((f, i) => {
            const FIcon = FEATURE_STYLES[i].icon;
            return (
              <button
                key={i}
                onClick={() => { setActive(i); setPaused(true); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  i === active
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                    : 'border-border text-muted-foreground hover:text-foreground'
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
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{t.pricingTitle}</h2>
            <p className="text-muted-foreground">{t.pricingSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
            {/* Trial */}
            <div className="relative rounded-xl border border-amber-500/50 bg-amber-500/5 p-6 flex flex-col gap-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                {t.trialBadge}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Trial</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">0</span>
                  <span className="text-sm text-muted-foreground">Kč</span>
                  <span className="text-xs text-muted-foreground ml-1">{t.trialPeriod}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {t.trialFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white">
                  {t.trialCta}
                </Button>
              </Link>
            </div>
            {/* Pro */}
            <div className="relative rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pro</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">od 99</span>
                  <span className="text-sm text-muted-foreground">Kč</span>
                  <span className="text-xs text-muted-foreground ml-1">{t.proPeriod}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {t.proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full">{t.proCta}</Button>
              </Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
            {t.pricingDisclaimer}
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
              <Link href="/login" className="hover:text-foreground transition-colors">{t.footerLogin}</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">{t.footerRegister}</Link>
              <Link href="/podminky" className="hover:text-foreground transition-colors">{t.footerTerms}</Link>
              <Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            {t.footerLegal} · Jan Adam · IČO: 23405538 ·{' '}
            <a href="mailto:kontakt@bettracker.cz" className="hover:text-foreground transition-colors">
              kontakt@bettracker.cz
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Feature mockups ──────────────────────────────────────────────────────────

function FeatureMockup({ index, lang }: { index: number; lang: Lang }) {
  const mockups = [
    <BetsMockup key="bets" lang={lang} />,
    <StatsMockup key="stats" lang={lang} />,
    <CalendarMockup key="cal" lang={lang} />,
    <SurebetMockup key="sure" lang={lang} />,
    <LeaderboardMockup key="lb" />,
    <AchievementsMockup key="ach" lang={lang} />,
    <AIMockup key="ai" lang={lang} />,
  ];
  return <>{mockups[index]}</>;
}

function BetsMockup({ lang }: { lang: Lang }) {
  const winner = lang === 'ru' ? 'победа' : lang === 'en' ? 'win' : 'výhra';
  const loser  = lang === 'ru' ? 'поражение' : lang === 'en' ? 'loss' : 'prohra';
  const bets = [
    { team: 'Real Madrid vs Barcelona', odds: '2.10', stake: '500 Kč', result: 'win' as const, book: 'Tipsport' },
    { team: 'Manchester City BTTS',     odds: '1.85', stake: '300 Kč', result: 'loss' as const, book: 'Fortuna' },
    { team: 'Novak Djokovic',           odds: '1.65', stake: '200 Kč', result: 'win' as const, book: 'Betano' },
  ];
  return (
    <div className="space-y-2">
      {bets.map((b, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
          <div className={cn('w-2 h-2 rounded-full shrink-0', b.result === 'win' ? 'bg-emerald-500' : 'bg-red-500')} />
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

function StatsMockup({ lang }: { lang: Lang }) {
  const bars = [40, 65, 45, 80, 55, 90, 70];
  const days = {
    cs: ['Po','Út','St','Čt','Pá','So','Ne'],
    en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
    ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  }[lang];
  const betsLabel = lang === 'en' ? 'Bets' : lang === 'ru' ? 'Ставки' : 'Sázky';
  const weekLabel = lang === 'en' ? 'Profit this week' : lang === 'ru' ? 'Прибыль за неделю' : 'Profit tento týden';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Profit', value: '+7 434 Kč', positive: true },
          { label: 'ROI', value: '+18.4 %', positive: true },
          { label: 'Strike rate', value: '58 %', positive: null },
          { label: betsLabel, value: '142', positive: null },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-2.5">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={cn('text-sm font-bold mt-0.5', s.positive === true ? 'text-emerald-500' : '')}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-[10px] text-muted-foreground mb-2">{weekLabel}</p>
        <div className="flex items-end gap-1 h-12">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t bg-amber-500/60" style={{ height: `${h}%` }} />
              <span className="text-[8px] text-muted-foreground">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarMockup({ lang }: { lang: Lang }) {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const hasBet: Record<number, 'win' | 'loss' | 'both'> = {
    3: 'win', 5: 'loss', 8: 'both', 11: 'win', 14: 'win',
    17: 'loss', 19: 'win', 22: 'both', 25: 'win', 27: 'win',
  };
  const month = lang === 'en' ? 'April 2025' : lang === 'ru' ? 'Апрель 2025' : 'Duben 2025';
  const winLabel  = lang === 'en' ? 'win' : lang === 'ru' ? 'победа' : 'výhra';
  const lossLabel = lang === 'en' ? 'loss' : lang === 'ru' ? 'поражение' : 'prohra';
  const dayNames = {
    cs: ['Po','Út','St','Čt','Pá','So','Ne'],
    en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
    ru: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  }[lang];
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold">{month}</span>
        <div className="flex gap-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{winLabel}</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{lossLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[9px] text-muted-foreground py-0.5">{d}</div>
        ))}
        {days.map((d) => {
          const mark = hasBet[d];
          return (
            <div key={d} className={cn('rounded text-center text-[10px] py-1 relative', mark ? 'font-semibold' : 'text-muted-foreground')}>
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

function SurebetMockup({ lang }: { lang: Lang }) {
  const match   = lang === 'en' ? 'Match' : lang === 'ru' ? 'Матч' : 'Zápas';
  const draw    = lang === 'en' ? 'Draw' : lang === 'ru' ? 'Ничья' : 'Remíza';
  const profit  = lang === 'en' ? 'Guaranteed profit' : lang === 'ru' ? 'Гарант. прибыль' : 'Garantovaný zisk';
  const total   = lang === 'en' ? 'Total stake' : lang === 'ru' ? 'Общая ставка' : 'Celkový vklad';
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{match}</p>
        <p className="text-xs font-semibold">Chelsea vs Arsenal</p>
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {[
            { label: 'Chelsea', odds: '2.15', book: 'Tipsport', stake: '465 Kč' },
            { label: draw,      odds: '3.40', book: 'Fortuna',  stake: '294 Kč' },
            { label: 'Arsenal', odds: '3.20', book: 'Betano',   stake: '313 Kč' },
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
          <p className="text-[10px] text-muted-foreground">{profit}</p>
          <p className="text-lg font-bold text-emerald-500">+47 Kč</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">{total}</p>
          <p className="text-sm font-semibold">1 072 Kč</p>
        </div>
      </div>
    </div>
  );
}

function LeaderboardMockup() {
  const rows = [
    { pos: 1, name: 'Xeon',       profit: '+12 840', roi: '+24.1%' },
    { pos: 2, name: 'koficekk',   profit: '+7 434',  roi: '+18.4%' },
    { pos: 3, name: 'TipsterPro', profit: '+5 210',  roi: '+15.7%' },
    { pos: 4, name: 'sazkar99',   profit: '+2 100',  roi: '+8.3%'  },
  ];
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold">Leaderboard — 30d</span>
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

function AchievementsMockup({ lang }: { lang: Lang }) {
  const bankroll = lang === 'en' ? 'Bankroll' : lang === 'ru' ? 'Банкролл' : 'Bankroll';
  const growth   = lang === 'en' ? 'Total growth' : lang === 'ru' ? 'Общий рост' : 'Celkový růst';
  const ach = [
    { emoji: '🎯', name: lang === 'en' ? 'First bet' : lang === 'ru' ? 'Первая ставка' : 'První sázka', unlocked: true },
    { emoji: '🔥', name: lang === 'en' ? '10 wins streak' : lang === 'ru' ? '10 побед подряд' : '10 výher v řadě', unlocked: true },
    { emoji: '💰', name: lang === 'en' ? '10k profit' : lang === 'ru' ? 'Прибыль 10k' : '10 000 Kč profit', unlocked: true },
    { emoji: '🏆', name: lang === 'en' ? '50% strike rate' : lang === 'ru' ? '50% побед' : '50% strike rate', unlocked: false },
    { emoji: '⚡', name: lang === 'en' ? '100 bets' : lang === 'ru' ? '100 ставок' : '100 sázek', unlocked: false },
    { emoji: '👑', name: lang === 'en' ? 'Top 10' : lang === 'ru' ? 'Топ 10' : 'Top 10', unlocked: false },
  ];
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-card p-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">{bankroll}</p>
          <p className="text-lg font-bold">24 580 Kč</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">{growth}</p>
          <p className="text-sm font-semibold text-emerald-500">+43.2 %</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {ach.map((a) => (
          <div key={a.name} className={cn('rounded-lg border p-2 text-center', a.unlocked ? 'border-amber-500/30 bg-amber-500/10' : 'border-border bg-card opacity-40')}>
            <p className="text-lg">{a.emoji}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{a.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIMockup({ lang }: { lang: Lang }) {
  const upload = lang === 'en' ? 'Upload bet slip screenshot' : lang === 'ru' ? 'Загрузи скриншот тикета' : 'Nahraj screenshot tiketu';
  const hint   = lang === 'en' ? 'Drag & drop, Ctrl+V or click' : lang === 'ru' ? 'Drag & drop, Ctrl+V или клик' : 'Drag & drop, Ctrl+V nebo klikni';
  const fields = lang === 'en'
    ? [{ label: 'Odds', value: '2.10' }, { label: 'Stake', value: '500 Kč' }, { label: 'Pick', value: 'Man City to win' }, { label: 'Bookmaker', value: 'Tipsport' }, { label: 'Result', value: 'Win ✓' }]
    : lang === 'ru'
    ? [{ label: 'Коэф.', value: '2.10' }, { label: 'Ставка', value: '500 Kč' }, { label: 'Выбор', value: 'Man City победит' }, { label: 'Букмекер', value: 'Tipsport' }, { label: 'Результат', value: 'Победа ✓' }]
    : [{ label: 'Kurz', value: '2.10' }, { label: 'Vklad', value: '500 Kč' }, { label: 'Výběr', value: 'Manchester City' }, { label: 'Sázkovna', value: 'Tipsport' }, { label: 'Výsledek', value: 'Výhra ✓' }];
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-cyan-400/40 bg-cyan-400/5 p-4 text-center">
        <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
        <p className="text-xs font-medium">{upload}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
      </div>
      <div className="space-y-1.5">
        {fields.map((f) => (
          <div key={f.label} className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">{f.label}</span>
            <span className="text-xs font-medium">{f.value}</span>
            <Check className="w-3 h-3 text-emerald-500 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
