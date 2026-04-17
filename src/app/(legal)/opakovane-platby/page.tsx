import type { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCw, CreditCard, X, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Opakované platby | BetTracker',
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

export default function OpakovnePlatbyPage() {
  const plans = [
    { name: 'Měsíční', price: '99 Kč', cycle: 'každý měsíc', days: 30 },
    { name: 'Čtvrtletní', price: '249 Kč', cycle: 'každé 3 měsíce', days: 90 },
    { name: 'Roční', price: '699 Kč', cycle: 'každý rok', days: 365 },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Opakované platby</h1>
      <p className="text-sm text-muted-foreground mb-10">bettracker.cz · platební brána GoPay</p>

      {/* Přehled */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center text-center gap-2">
          <RefreshCw className="w-6 h-6 text-amber-500" />
          <p className="text-sm font-medium">Automatické obnovení</p>
          <p className="text-xs text-muted-foreground">Platba proběhne automaticky před koncem období</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center text-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-500" />
          <p className="text-sm font-medium">Bezpečná platba</p>
          <p className="text-xs text-muted-foreground">Zpracováno přes GoPay — karta se ukládá šifrovaně</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center text-center gap-2">
          <X className="w-6 h-6 text-amber-500" />
          <p className="text-sm font-medium">Zrušení kdykoliv</p>
          <p className="text-xs text-muted-foreground">Bez výpovědní doby, okamžitě v nastavení</p>
        </div>
      </div>

      <H2>Jak opakované platby fungují</H2>
      <P>
        Při aktivaci předplatného BetTracker Pro pomocí platební karty souhlasíš s tím, že
        po uplynutí zvoleného období bude z tvé karty automaticky stržena částka odpovídající
        danému tarifu. Platbu zpracovává platební brána <strong>GoPay</strong> — číslo karty
        ukládáme pouze v zašifrované podobě na serverech GoPay, nikoli na našich serverech.
      </P>
      <P>
        Před každou opakovanou platbou obdržíš e-mail s upozorněním alespoň 3 dny předem.
      </P>

      <H2>Tarify a výše opakované platby</H2>
      <div className="rounded-lg border border-border bg-card overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Tarif</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Výše platby</th>
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Frekvence</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p, i) => (
              <tr key={p.name} className={i < plans.length - 1 ? 'border-b border-border' : ''}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.price}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.cycle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>Lifetime licence je jednorázová platba — opakování se na ni nevztahuje.</P>

      <H2>Zrušení opakované platby</H2>
      <P>Opakovanou platbu (předplatné) můžeš kdykoliv zrušit:</P>
      <UL>
        <li>V nastavení účtu na bettracker.cz → sekce Předplatné</li>
        <li>E-mailem na <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">kontakt@bettracker.cz</a></li>
      </UL>
      <P>
        Po zrušení zůstává přístup aktivní do konce zaplaceného období. Žádná další platba
        poté nebude stržena.
      </P>

      <H2>Vrácení platby</H2>
      <P>
        Digitální obsah je zpřístupněn okamžitě po platbě. Uživatel bere na vědomí, že
        tím ztrácí právo odstoupit od smlouvy ve lhůtě 14 dnů dle § 1837 občanského zákoníku.
        V případě technické chyby nebo duplicitní platby kontaktuj{' '}
        <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">kontakt@bettracker.cz</a>.
      </P>

      <H2>Kontakt</H2>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground space-y-0.5">
        <p><span className="font-medium text-foreground">Jan Adam</span> · IČO: 23405538</p>
        <p>Krestova 1289/11, 700 30 Ostrava</p>
        <p>
          <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">
            kontakt@bettracker.cz
          </a>
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex gap-4 text-xs text-muted-foreground">
        <Link href="/podminky" className="hover:text-foreground transition-colors">Obchodní podmínky</Link>
        <Link href="/podminky-opakovanych-plateb" className="hover:text-foreground transition-colors">Podmínky opakovaných plateb</Link>
        <Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link>
      </div>
    </div>
  );
}
