import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Podmínky opakovaných plateb | BetTracker',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mt-8 mb-3 text-foreground">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="text-sm text-muted-foreground leading-relaxed mb-3 space-y-1 list-disc list-inside">{children}</ul>;
}

export default function PodminkyOpakovychPlatebPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Podmínky opakovaných plateb</h1>
      <p className="text-sm text-muted-foreground mb-2">Platné od 1. 1. 2025 · bettracker.cz</p>
      <p className="text-xs text-muted-foreground mb-10">
        Tento dokument je samostatný od{' '}
        <Link href="/podminky" className="text-foreground hover:underline">všeobecných obchodních podmínek</Link>.
      </p>

      <H2>1. Provozovatel a správce plateb</H2>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground mb-6 space-y-0.5">
        <p><span className="font-medium text-foreground">Jan Adam</span></p>
        <p>IČO: 23405538 · Krestova 1289/11, 700 30 Ostrava</p>
        <p>Email: <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">kontakt@bettracker.cz</a></p>
        <p className="pt-1">Platby zpracovává: <span className="font-medium text-foreground">GoPay s.r.o.</span>, Planá 67, 370 01</p>
      </div>

      <H2>2. Souhlas s opakovanou platbou</H2>
      <P>
        Zakoupením předplatného BetTracker Pro s platbou kartou uživatel výslovně souhlasí
        s tím, že po uplynutí zvoleného předplatného období bude z karty automaticky stržena
        částka odpovídající danému tarifu, a to opakovaně, dokud uživatel předplatné nezruší.
      </P>
      <P>
        Souhlas je udělen při první platbě zaškrtnutím příslušného souhlasu na platební
        stránce GoPay.
      </P>

      <H2>3. Výše a frekvence opakované platby</H2>
      <UL>
        <li>Měsíční tarif: 99 Kč — opakuje se každých 30 dní</li>
        <li>Čtvrtletní tarif: 249 Kč — opakuje se každých 90 dní</li>
        <li>Roční tarif: 699 Kč — opakuje se každých 365 dní</li>
      </UL>
      <P>
        Lifetime licence je jednorázová platba a opakované strhávání se na ni nevztahuje.
      </P>

      <H2>4. Oznámení před platbou</H2>
      <P>
        Uživatel bude e-mailem upozorněn na nadcházející opakovanou platbu alespoň 3 dny
        před jejím provedením. Upozornění bude zasláno na e-mail registrovaný k účtu.
      </P>

      <H2>5. Zrušení opakované platby</H2>
      <P>Uživatel může opakovanou platbu (předplatné) zrušit kdykoliv:</P>
      <UL>
        <li>V nastavení účtu na bettracker.cz → sekce Předplatné → Zrušit předplatné</li>
        <li>
          E-mailem na{' '}
          <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">
            kontakt@bettracker.cz
          </a>
          {' '}— zrušení bude provedeno do 24 hodin
        </li>
      </UL>
      <P>
        Zrušení musí být provedeno nejpozději 24 hodin před datem plánované opakované platby,
        aby bylo účinné pro dané období. Po zrušení zůstává přístup aktivní do konce
        zaplaceného období. Žádná další platba poté nebude provedena.
      </P>

      <H2>6. Neúspěšná platba</H2>
      <P>
        Pokud opakovaná platba selže (např. z důvodu nedostatku prostředků nebo expirace
        karty), GoPay provede opakovaný pokus. Uživatel bude o neúspěšné platbě informován
        e-mailem. Pokud platba ani po opakování neproběhne, předplatné bude pozastaveno.
      </P>

      <H2>7. Vrácení platby</H2>
      <P>
        Digitální obsah (přístup ke službě) je zpřístupněn okamžitě po platbě. Uživatel
        bere na vědomí, že v souladu s § 1837 občanského zákoníku ztrácí právo odstoupit
        od smlouvy ve lhůtě 14 dnů.
      </P>
      <P>
        V případě technické chyby, duplicitní platby nebo jiné oprávněné reklamace kontaktuj
        {' '}<a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">kontakt@bettracker.cz</a>.
        Vrácení platby bude posouzeno individuálně.
      </P>

      <H2>8. Bezpečnost platebních údajů</H2>
      <P>
        Číslo platební karty není ukládáno na serverech BetTracker. Veškeré platební údaje
        jsou zpracovávány a uchovávány výhradně platební bránou GoPay s.r.o. v souladu
        se standardem PCI DSS.
      </P>

      <H2>9. Změna podmínek</H2>
      <P>
        Provozovatel si vyhrazuje právo tyto podmínky změnit. O změně bude uživatel
        informován e-mailem alespoň 14 dní předem. Pokračováním v používání služby po
        oznámené změně uživatel s novými podmínkami souhlasí.
      </P>

      <H2>10. Rozhodné právo</H2>
      <P>
        Tyto podmínky se řídí právním řádem České republiky. Případné spory budou řešeny
        příslušným soudem v České republice.
      </P>

      <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Link href="/podminky" className="hover:text-foreground transition-colors">Obchodní podmínky</Link>
        <Link href="/opakovane-platby" className="hover:text-foreground transition-colors">Opakované platby (info)</Link>
        <Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link>
        <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
      </div>
    </div>
  );
}
