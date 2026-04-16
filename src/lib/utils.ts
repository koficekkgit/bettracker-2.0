import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCIES = ['CZK', 'EUR', 'USD', 'GBP', 'PLN'] as const;
export type Currency = typeof CURRENCIES[number];

export const BOOKMAKERS = [
  { id: 'tipsport', name: 'Tipsport', logo: '/bookmakers/tipsport.jpg' },
  { id: 'fortuna', name: 'Fortuna', logo: '/bookmakers/fortuna.jpg' },
  { id: 'chance', name: 'Chance', logo: '/bookmakers/chance.jpg' },
  { id: 'betano', name: 'Betano', logo: '/bookmakers/betano.png' },
  { id: 'synot', name: 'Synot', logo: '/bookmakers/synot.png' },
  { id: 'kingsbet', name: 'Kingsbet', logo: '/bookmakers/kingsbet.jpg' },
  { id: 'sazkabet', name: 'Sazkabet', logo: '/bookmakers/sazkabet.png' },
  { id: 'fbet', name: 'Fbet', logo: '' },
  { id: 'foreign', name: 'Zahraniční', logo: '' },
] as const;

export function formatCurrency(amount: number, currency: string = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(d);
}
