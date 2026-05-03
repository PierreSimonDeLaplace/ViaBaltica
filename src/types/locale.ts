export const SUPPORTED_LANGS = ['en', 'pl'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'en';

export type Locale = Readonly<Record<string, string>>;

export type LanguageChangeListener = (lang: SupportedLang, dict: Locale) => void;

export function getString(dict: Locale, key: string, fallback = key): string {
  const value: string | undefined = dict[key];
  return value ?? fallback;
}

export function isSupportedLang(value: unknown): value is SupportedLang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
}
