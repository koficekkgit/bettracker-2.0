import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zásady cookies | BetTracker',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mt-8 mb-3 text-foreground">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-5 mb-2 text-foreground">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}

export default function CookiesPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Zásady cookies</h1>
      <p className="text-sm text-muted-foreground mb-10">Platné od 1. 1. 2025 · bettracker.cz</p>

      <P>
        Web bettracker.cz používá cookies za účelem správné funkčnosti webu, analýzy návštěvnosti
        a zlepšování služeb.
      </P>

      <H2>Typy cookies, které používáme</H2>

      <H3>Technické cookies</H3>
      <P>
        Nezbytné pro fungování webu. Zajišťují přihlášení, zabezpečení session a základní funkce
        aplikace. Bez těchto cookies není možné službu provozovat.
      </P>

      <H3>Analytické cookies</H3>
      <P>
        Pomáhají nám porozumět tomu, jak uživatelé web používají (např. Google Analytics).
        Data jsou anonymizovaná a slouží výhradně ke zlepšování služby.
      </P>

      <H2>Správa cookies</H2>
      <P>
        Používáním webu souhlasíte s použitím cookies. Cookies můžete kdykoliv smazat nebo
        zakázat v nastavení svého prohlížeče. Upozorňujeme, že zakázání technických cookies
        může omezit funkčnost služby.
      </P>

      <H2>Kontakt</H2>
      <P>
        V případě dotazů nás kontaktujte na{' '}
        <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">
          kontakt@bettracker.cz
        </a>.
      </P>
    </div>
  );
}
