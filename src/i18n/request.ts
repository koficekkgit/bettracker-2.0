import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['cs', 'en', 'ru'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'cs';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
