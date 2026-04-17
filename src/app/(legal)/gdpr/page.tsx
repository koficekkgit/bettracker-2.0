import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ochrana osobních údajů (GDPR) | BetTracker',
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

export default function GdprPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Zásady ochrany osobních údajů</h1>
      <p className="text-sm text-muted-foreground mb-10">GDPR · Platné od 1. 1. 2025 · bettracker.cz</p>

      <H2>Správce údajů</H2>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground mb-3 space-y-0.5">
        <p><span className="font-medium text-foreground">Jan Adam</span></p>
        <p>IČO: 23405538</p>
        <p>Krestova 1289/11, 700 30 Ostrava</p>
        <p>Email: <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">kontakt@bettracker.cz</a></p>
      </div>

      <H2>Jaké údaje zpracováváme</H2>
      <P>Zpracováváme:</P>
      <UL>
        <li>e-mailovou adresu</li>
        <li>přihlašovací údaje</li>
        <li>IP adresu</li>
        <li>cookies</li>
        <li>statistiky sázek vložené uživatelem</li>
        <li>platební informace prostřednictvím GoPay</li>
      </UL>

      <H2>Účel zpracování</H2>
      <P>Údaje zpracováváme za účelem:</P>
      <UL>
        <li>provozu služby</li>
        <li>správy uživatelského účtu</li>
        <li>zajištění plateb</li>
        <li>zabezpečení systému</li>
        <li>zlepšování služby</li>
      </UL>

      <H2>Doba uchování údajů</H2>
      <P>Údaje uchováváme po dobu existence účtu nebo dle zákonných povinností.</P>

      <H2>Předávání třetím stranám</H2>
      <P>Údaje mohou být předány:</P>
      <UL>
        <li>poskytovateli hostingu</li>
        <li>platební bráně GoPay</li>
        <li>analytickým nástrojům (např. Google Analytics)</li>
      </UL>

      <H2>Práva uživatele</H2>
      <P>Uživatel má právo:</P>
      <UL>
        <li>požadovat přístup k údajům</li>
        <li>požadovat opravu</li>
        <li>požadovat výmaz</li>
        <li>požadovat omezení zpracování</li>
        <li>podat stížnost u Úřadu pro ochranu osobních údajů (uoou.cz)</li>
      </UL>
      <P>
        Pro uplatnění práv nás kontaktujte na{' '}
        <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">
          kontakt@bettracker.cz
        </a>.
      </P>
    </div>
  );
}
