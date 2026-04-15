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
// app/layout.tsx
export const metadata = {
  title: 'BetTracker',
  description: 'Profesionální tracker sportovních sázek',
  icons: {
    icon: [
      { url: '/favicon.ico' }, // klasika
      { url: '/icon.png', sizes: '32x32', type: 'image/png' }, // pro jistotu
    ],
    apple: [
      { url: '/apple-icon.png' }, // pro iPhony
    ],
  },
}
export const metadata: Metadata = {
  title: 'BetTracker',
  description: 'Profesionální tracker sportovních sázek',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BetTracker',
  },
};

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
