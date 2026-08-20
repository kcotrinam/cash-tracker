'use client';

import { NextIntlClientProvider } from 'next-intl';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { authenticatedFetch, getApiUrl } from './authenticated-fetch';
import en from './messages/en.json';
import es from './messages/es.json';

type Locale = 'en' | 'es';
type Language = 'EN' | 'ES';
const messages = { en, es };
const LocaleContext = createContext<{ locale: Locale; setLanguage: (language: Language) => void }>({
  locale: 'en',
  setLanguage: () => undefined,
});

export function useAppLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  useEffect(() => {
    authenticatedFetch(`${getApiUrl()}/settings/preferences`)
      .then(async (response) => {
        if (!response.ok) return;
        const preferences = (await response.json()) as { language?: Language };
        setLocale(preferences.language === 'ES' ? 'es' : 'en');
      })
      .catch(() => undefined);
  }, []);
  const value = useMemo(
    () => ({ locale, setLanguage: (language: Language) => setLocale(language === 'ES' ? 'es' : 'en') }),
    [locale],
  );
  return <LocaleContext.Provider value={value}><NextIntlClientProvider locale={locale} messages={messages[locale]}>{children}</NextIntlClientProvider></LocaleContext.Provider>;
}
