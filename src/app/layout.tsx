
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

// 1. Definice metadat (Název a Ikona v záložce)
export const metadata: Metadata = {
  title: "BetTracker",
  description: "Trackuj své sázky a statistiky na jednom místě.",
  icons: {
    icon: "/favicon.ico",
    url: '/favicon.ico', // Přidejte ?v=3 (nebo jiné číslo)
    href: '/favicon.ico',
  },
};

// 2. Definice viewportu (Nastavení barev a chování na mobilu)
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

// 3. Hlavní layout aplikace (Všechny poskytovatele a obal webu)
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