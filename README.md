# BetTracker v2

Moderní tracker sportovních sázek. Postaveno na Next.js 14, Supabase a Tailwind CSS.

## Co umí

- 📊 **Dashboard** - bankroll, ROI, win rate, graf zisku v čase
- 📝 **Sázky** - sólo i AKO, 7 stavů (čeká, výhra, prohra, storno, cashout, polovina vyhrála/prohrála)
- 🏷️ **Kategorie** - vlastní kategorie pro každého uživatele
- 🎰 **Bookmakeři** - Tipsport, Fortuna, Chance, Betano, Synot, Kingsbet
- 📈 **Statistiky** - rozpad podle kategorie, kanceláře, streaky
- 🌍 **3 jazyky** - CZ / EN / RU
- 💰 **5 měn** - CZK, EUR, USD, GBP, PLN
- 🌓 **Light / Dark mode**
- 🔐 **Bezpečné přihlášení** přes Supabase Auth (žádné heslo v localStorage!)
- 📱 **Responsivní** - funguje na mobilu i desktopu

## Quick start

### 1. Lokální spuštění

```bash
npm install
cp .env.example .env.local
# Vyplň NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Otevři http://localhost:3000

### 2. Deploy do produkce (krok za krokem)

#### A) Supabase (databáze)

1. Jdi na [supabase.com](https://supabase.com), přihlas se přes GitHub
2. Klikni **"New project"**
   - Name: `bettracker`
   - Database password: vygeneruj a ulož
   - Region: **Frankfurt (eu-central-1)** - nejbližší
3. Počkej ~2 minuty, než se projekt vytvoří
4. V levém menu klikni **SQL Editor → New query**
5. Otevři soubor `supabase/schema.sql` z tohoto projektu, **zkopíruj celý obsah** a vlož do editoru
6. Klikni **Run** (vpravo dole). Mělo by být zeleně "Success".
7. V levém menu **Settings → API**, zkopíruj si:
   - `Project URL` (např. `https://abcdxyz.supabase.co`)
   - `anon public` klíč (dlouhý JWT token)

#### B) GitHub

1. Vytvoř nový prázdný repo na [github.com/new](https://github.com/new), pojmenuj `bettracker-v2`
2. V terminálu:
   ```bash
   cd bettracker-new
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TVOJE_JMENO/bettracker-v2.git
   git push -u origin main
   ```

#### C) Vercel (hosting)

1. Jdi na [vercel.com](https://vercel.com), přihlas se přes GitHub
2. Klikni **"Add New → Project"**
3. Vyber svůj `bettracker-v2` repo, klikni **Import**
4. V sekci **Environment Variables** přidej:
   - `NEXT_PUBLIC_SUPABASE_URL` = tvoje project URL ze Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tvůj anon key ze Supabase
5. Klikni **Deploy**
6. Po ~2 minutách máš běžící aplikaci na `bettracker-v2.vercel.app` 🎉

#### D) Vlastní doména bettracker.cz

1. Ve Vercel projektu jdi do **Settings → Domains**
2. Přidej `bettracker.cz` a `www.bettracker.cz`
3. Vercel ti ukáže DNS záznamy, které musíš nastavit u registrátora domény (typicky A záznam `76.76.21.21` a CNAME `cname.vercel-dns.com`)
4. Po propagaci DNS (10 min – 24 h) je doména aktivní s HTTPS

## Struktura projektu

```
bettracker-new/
├── src/
│   ├── app/
│   │   ├── (auth)/          # login, register
│   │   ├── (app)/           # dashboard, bets, stats, settings
│   │   ├── layout.tsx       # root layout
│   │   └── page.tsx         # redirect
│   ├── components/
│   │   ├── ui/              # Button, Input, Card, Select, Label
│   │   ├── layout/          # Sidebar
│   │   ├── bets/            # BetFormDialog, StatusBadge
│   │   └── stats/           # StatCard, ProfitChart
│   ├── hooks/
│   │   └── use-bets.ts      # React Query hooks pro CRUD
│   ├── lib/
│   │   ├── supabase/        # browser + server klienti
│   │   ├── stats.ts         # výpočty ROI, win rate, streaks
│   │   ├── types.ts         # TypeScript typy
│   │   └── utils.ts         # formátování měn, bookmakeři
│   ├── i18n/
│   │   └── messages/        # cs.json, en.json, ru.json
│   └── middleware.ts        # auth ochrana routes
├── supabase/
│   └── schema.sql           # databázové schéma + RLS
├── public/
│   ├── logo.png             # SM BetTracker logo
│   └── bookmakers/          # loga sázkových kanceláří
└── package.json
```

## Technologie

| Vrstva | Technologie | Proč |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Moderní React, SSR, file-based routing |
| Jazyk | **TypeScript** | Type safety, méně chyb |
| Styly | **Tailwind CSS** | Rychlý vývoj, konzistentní design |
| Databáze | **Supabase (PostgreSQL)** | Hosted PostgreSQL + auth + RLS |
| Auth | **Supabase Auth** | Bezpečné, hotové, nemusíš řešit hashing |
| Data fetching | **TanStack Query** | Cache, optimistic updates, refetch |
| Grafy | **Recharts** | Pěkné, snadno použitelné |
| i18n | **next-intl** | Multi-jazyk podpora |
| Themes | **next-themes** | Light/dark mode |
| Notifikace | **sonner** | Toast notifikace |
| Hosting | **Vercel** | Free tier, auto-deploy z GitHubu |

## Co se opravilo oproti staré verzi

| Stará verze | Nová verze |
|---|---|
| 5917 řádků v jednom `app.js` | Modulární komponenty, max ~250 řádků na soubor |
| Heslo v localStorage 😬 | Supabase Auth (httpOnly cookies, bcrypt) |
| Custom backend (Netlify Functions) | Přímé volání Supabase z frontendu (RLS) |
| Globální proměnné, race conditions | React Query + Zustand state management |
| Vanilla JS, žádný typový systém | TypeScript |
| Custom CSS 40 KB | Tailwind utility-first |
| Žádné testy, žádný linting | ESLint, TypeScript checker |

## Licence

MIT
