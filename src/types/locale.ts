/**
 * Locale shape — what we expect inside `src/locales/{lang}.json`.
 *
 * Locale files are mostly flat string-keyed maps (e.g. `nav.home → "Home"`),
 * with one structured exception: the `trips.data` key carries the trip
 * categories so translators can edit copy and structure in one place.
 */

export const SUPPORTED_LANGS = ['en', 'pl'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'en';

export interface Trip {
  emoji: string;
  color: string;
  title: string;
  meta: string;
  tags: readonly string[];
  body: string;
}

export interface TripCategory {
  icon: string;
  title: string;
  subtitle: string;
  trips: readonly Trip[];
}

export type LocaleValue = string | readonly TripCategory[];
export type Locale = Readonly<Record<string, LocaleValue>>;

export type LanguageChangeListener = (lang: SupportedLang, dict: Locale) => void;

/* ──────────────────────────────────────────────────────────────────────────
   Narrowing helpers — locale values are a union, so keep callers tidy.
   ────────────────────────────────────────────────────────────────────── */

export function getString(dict: Locale, key: string, fallback = ''): string {
  const value = dict[key];
  return typeof value === 'string' ? value : fallback;
}

export function getTripCategories(dict: Locale): readonly TripCategory[] {
  const value = dict['trips.data'];
  return Array.isArray(value) ? value : [];
}

export function isSupportedLang(value: unknown): value is SupportedLang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
}
