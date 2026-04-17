import Link from 'next/link';
import Image from 'next/image';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="BetTracker" width={26} height={26} className="rounded-md" />
            <span className="font-semibold text-sm">BetTracker</span>
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-border mt-10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-4 text-xs text-muted-foreground justify-between">
          <span>© {new Date().getFullYear()} BetTracker · Jan Adam · IČO: 23405538</span>
          <div className="flex gap-4">
            <Link href="/podminky" className="hover:text-foreground transition-colors">Obchodní podmínky</Link>
            <Link href="/gdpr" className="hover:text-foreground transition-colors">GDPR</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
