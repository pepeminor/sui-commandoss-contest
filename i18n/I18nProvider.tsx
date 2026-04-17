'use client';

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import en from './en.json';
import vi from './vi.json';

type Locale = 'en' | 'vi';
type Messages = Record<string, string>;

const locales: Record<Locale, Messages> = { en, vi };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

const LOCALE_KEY = 'locale';
const VALID_LOCALES: readonly Locale[] = ['en', 'vi'];

let listeners: Array<() => void> = [];

function subscribeLocale(callback: () => void) {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getLocaleSnapshot(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY);
  return saved && VALID_LOCALES.includes(saved as Locale) ? (saved as Locale) : 'en';
}

function getLocaleServerSnapshot(): Locale {
  return 'en';
}

function emitLocaleChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(LOCALE_KEY, l);
    emitLocaleChange();
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let msg = locales[locale]?.[key] ?? locales.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          msg = msg.replace(`{${k}}`, String(v));
        }
      }
      return msg;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
