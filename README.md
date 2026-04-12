# Username Login — instalační instrukce

Tento patch přidává možnost přihlašovat se uživatelským jménem **i** emailem.

## Co je v ZIPu

```
supabase/
  migration_username.sql                        ← NOVÝ — spustit v SQL Editoru
src/
  app/(auth)/login/page.tsx                     ← PŘEPSAT
  app/(auth)/register/page.tsx                  ← PŘEPSAT
  components/auth/username-onboarding-dialog.tsx ← NOVÝ
  i18n/messages/PATCH_i18n.txt                  ← MERGE do cs/en/ru.json
```

## Postup nasazení (v tomto pořadí!)

### 1) Spustit migraci v Supabase
Otevři Supabase SQL Editor a spusť celý obsah `supabase/migration_username.sql`.
Migrace je čistě additivní (žádný drop sloupců, žádná ztráta dat) — přidává:
- Case-insensitive unique index na `lower(username)`
- CHECK constraint na formát `^[a-zA-Z0-9_.\-]{3,20}$`
- Tři RPC funkce: `get_email_by_username`, `is_username_available`, `set_my_username`

### 2) Zkopírovat soubory do projektu
```
src/app/(auth)/login/page.tsx          → přepsat
src/app/(auth)/register/page.tsx       → přepsat
src/components/auth/username-onboarding-dialog.tsx → nový soubor
```

### 3) Mergnout i18n stringy
Otevři `src/i18n/messages/PATCH_i18n.txt` a přidej uvedené klíče do
`auth` (a případně `common`) sekcí ve všech třech `cs.json`, `en.json`, `ru.json`.

### 4) Zaregistrovat onboarding dialog do app layoutu
Otevři `src/app/(app)/layout.tsx` a přidej:

```tsx
import { UsernameOnboardingDialog } from '@/components/auth/username-onboarding-dialog';
```

A někam dovnitř return JSX (nejlépe hned nad `<Sidebar />` nebo na konec layoutu) přidej:

```tsx
<UsernameOnboardingDialog />
```

Komponenta se sama rozhodne, jestli se má zobrazit (jen pokud
`profile.username === null`), takže ji můžeš nechat tam vždy.

### 5) Test
- **Nový user:** registrace s username `test_user_1` → měla by projít, login pak jde i přes username
- **Test kolize:** zkus se zaregistrovat se stejným usernamem podruhé → očekává se error "obsazené"
- **Stávající user bez username:** v Supabase SQL ručně `update profiles set username = null where id = '<tvoje uuid>';`,
  pak se přihlas → mělo by se objevit modální okno
- **Login emailem** musí pořád fungovat (kontrolu na `@` v identifieru)
- **Forgot password** netřeba měnit, jede dál přes email

## Co se NEMĚNÍ
- Supabase Auth flow (signUp, signIn, sessions)
- Forgot/reset password (jede přes email jako dosud)
- RLS politiky
- Trial / subscription / payments

## Bezpečnostní poznámky
- `get_email_by_username` je SECURITY DEFINER s `grant execute to anon` —
  je to nutné, aby login fungoval. Endpoint je sice teoreticky username enumeration,
  ale to je u jakéhokoli systému s username loginem (i GitHub, Twitter...).
  Pokud chceš později přitvrdit, můžeš přidat rate limiting na úrovni Vercelu
  nebo přes Supabase Edge Function wrapper.
- `set_my_username` kontroluje `auth.uid()`, takže nelze přepsat cizí username.
- Format regex je shodný v DB CHECK i v JS — pokud bys ho měnil, změň na obou místech.
