import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { ServiceWorkerRegister } from '@/components/sw-register';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'] });

// layout.tsx
import type { Metadata } from "next"; // Tento import tam může a nemusí být

export const metadata: Metadata = {
  title: "BetTracker", // <-- Zde změňte název, který se ukazuje v záložce
  description: "Trackuj své sázky a statistiky na jednom místě.",
  icons: {
    icon: "/favicon.ico", // <-- Cesta k vaší ikoně
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
// /app/layout.tsx
export const metadata = {
  title: 'BetTracker',
  icons: {
    icon: '/favicon.ico', // Soubor musí být v /public/favicon.ico
  },
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              {children}
              <ServiceWorkerRegister />
              <Toaster richColors position="top-right" />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
