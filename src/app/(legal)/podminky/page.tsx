import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Obchodní podmínky | BetTracker',
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

export default function PodminkyPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-1">Obchodní podmínky</h1>
      <p className="text-sm text-muted-foreground mb-10">Platné od 1. 1. 2025 · bettracker.cz</p>

      <H2>1. Úvodní ustanovení</H2>
      <P>
        Tyto obchodní podmínky upravují práva a povinnosti mezi provozovatelem služby BetTracker
        a uživatelem při využívání webové aplikace dostupné na adrese bettracker.cz.
      </P>
      <P>
        Služba BetTracker slouží výhradně jako nástroj pro evidenci a analýzu vlastních sázek
        uživatele. Nejedná se o sázkovou kancelář ani poskytovatele hazardních her.
      </P>
      <P>Používáním služby uživatel souhlasí s těmito obchodními podmínkami.</P>

      <H2>2. Identifikace provozovatele</H2>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground mb-3 space-y-0.5">
        <p><span className="font-medium text-foreground">Jan Adam</span></p>
        <p>IČO: 23405538</p>
        <p>Krestova 1289/11, Hrabůvka, 700 30 Ostrava</p>
        <p>Email: <a href="mailto:kontakt@bettracker.cz" className="text-foreground hover:underline">kontakt@bettracker.cz</a></p>
      </div>

      <H2>3. Popis služby</H2>
      <P>BetTracker je online analytický nástroj umožňující uživatelům:</P>
      <UL>
        <li>evidovat vlastní sázky</li>
        <li>sledovat statistiky sázení</li>
        <li>analyzovat dlouhodobou úspěšnost</li>
        <li>spravovat historii sázek</li>
      </UL>
      <P>Služba neposkytuje:</P>
      <UL>
        <li>sázkové tipy</li>
        <li>predikce výsledků</li>
        <li>investiční doporučení</li>
        <li>hazardní hry</li>
      </UL>

      <H2>4. Registrace uživatele</H2>
      <P>Registrací vzniká uživatelský účet. Uživatel je povinen:</P>
      <UL>
        <li>uvádět pravdivé údaje</li>
        <li>chránit přístupové údaje</li>
        <li>nepředávat účet třetím osobám</li>
      </UL>
      <P>Provozovatel si vyhrazuje právo účet zrušit při porušení podmínek.</P>

      <H2>5. Zkušební období zdarma (7 dní)</H2>
      <P>
        Každý nový uživatel získá 7denní zkušební období zdarma. Po jeho uplynutí dojde
        automaticky k aktivaci placeného předplatného dle zvoleného tarifu, pokud uživatel
        před koncem zkušebního období předplatné nezruší.
      </P>
      <P>Předplatné lze kdykoliv zrušit v nastavení účtu.</P>

      <H2>6. Předplatné služby</H2>
      <P>BetTracker nabízí tyto varianty předplatného:</P>
      <UL>
        <li>měsíční předplatné</li>
        <li>čtvrtletní předplatné</li>
        <li>roční předplatné</li>
        <li>lifetime licence</li>
      </UL>
      <P>
        Předplatné se automaticky obnovuje po skončení zvoleného období, pokud není zrušeno
        uživatelem. Cena předplatného je uvedena na stránce ceníku.
      </P>

      <H2>7. Lifetime licence</H2>
      <P>
        Lifetime licence poskytuje přístup ke službě po dobu její existence. Provozovatel si
        vyhrazuje právo službu kdykoliv upravit nebo ukončit.
      </P>

      <H2>8. Platební podmínky</H2>
      <P>
        Platby probíhají prostřednictvím zabezpečené platební brány třetí strany (např. GoPay).
        Po úspěšném dokončení platby je přístup ke službě aktivován automaticky.
      </P>

      <H2>9. Odstoupení od smlouvy</H2>
      <P>
        Uživatel souhlasí se zpřístupněním digitální služby ihned po aktivaci účtu a bere na
        vědomí, že tím ztrácí právo odstoupit od smlouvy ve lhůtě 14 dnů dle § 1837
        občanského zákoníku.
      </P>

      <H2>10. Zrušení předplatného</H2>
      <P>
        Předplatné lze kdykoliv ukončit v uživatelském účtu. Po zrušení zůstává přístup aktivní
        do konce zaplaceného období.
      </P>

      <H2>11. Odpovědnost</H2>
      <P>Provozovatel nenese odpovědnost za:</P>
      <UL>
        <li>finanční ztráty vzniklé sázením</li>
        <li>rozhodnutí uživatele při sázení</li>
        <li>nedostupnost služeb třetích stran</li>
      </UL>
      <P>Služba slouží pouze jako analytický nástroj.</P>

      <H2>12. Omezení služby</H2>
      <P>
        Provozovatel může službu upravit, omezit, pozastavit nebo ukončit bez předchozího
        upozornění.
      </P>

      <H2>13. Ochrana proti zneužití</H2>
      <P>Je zakázáno:</P>
      <UL>
        <li>pokoušet se narušit systém</li>
        <li>sdílet účet</li>
        <li>automatizovaně získávat data služby</li>
      </UL>
      <P>Porušení může vést ke zrušení účtu.</P>

      <H2>14. Věkové omezení</H2>
      <P>Služba je určena pouze osobám starším 18 let.</P>

      <H2>15. Závěrečná ustanovení</H2>
      <P>
        Tyto podmínky se řídí právním řádem České republiky. Provozovatel si vyhrazuje právo
        podmínky změnit.
      </P>
    </div>
  );
}
