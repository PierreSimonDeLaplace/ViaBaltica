/**
 * i18n — language detection, locale loading, and DOM translation.
 *
 *   • `data-i18n="key"`      → element's text content is replaced.
 *   • `data-i18n-html="key"` → element's innerHTML is replaced (allows <br>, <em>).
 *
 * Components that need to react to language changes (e.g. dynamic lists) can
 * subscribe via `onLanguageChange(...)`.
 */

import {
  DEFAULT_LANG,
  isSupportedLang,
  type LanguageChangeListener,
  type Locale,
  type SupportedLang,
} from '../types/locale';

const STORAGE_KEY = 'preferred-lang';
export const I18N_DEBUG = new URLSearchParams(location.search).get('debug') === 'true';

export const d = (value: string, key: string): string => I18N_DEBUG ? key : value;

const cache = new Map<SupportedLang, Locale>();
const listeners = new Set<LanguageChangeListener>();

if (I18N_DEBUG) console.warn('[i18n] debug mode — translations suppressed, bare keys visible');

/* ────────────────────────────────────────────────────────────────────────── */

async function loadLocale(lang: SupportedLang): Promise<Locale> {
  const cached = cache.get(lang);
  if (cached) return cached;

  const mod = await import(`../locales/${lang}.json`);
  const dict = mod.default as Locale;
  cache.set(lang, dict);
  return dict;
}

function detectLanguage(): SupportedLang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isSupportedLang(saved)) return saved;

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.split('-')[0]?.toLowerCase();
    if (isSupportedLang(base)) return base;
  }
  return DEFAULT_LANG;
}

function applyTranslations(lang: SupportedLang, dict: Locale): void {
  if (!I18N_DEBUG) {
    // text-only translations
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;

      const value = dict[key];
      if (typeof value !== 'string') return;

      // If the element also contains an SVG (e.g. a chevron), only update the
      // text node — we don't want to wipe out the icon.
      if (el.querySelector('svg')) {
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = `${value} `;
            return;
          }
        }
      }
      el.textContent = value;
    });

    // HTML-allowed translations (used for headings with <br>, <em>)
    document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
      const key = el.dataset.i18nHtml;
      if (!key) return;
      const value = dict[key];
      if (typeof value === 'string') el.innerHTML = value;
    });

    // page title
    const title = dict['page.title'];
    if (typeof title === 'string') document.title = title;
  }

  // Always update regardless of debug mode
  document.documentElement.lang = lang;
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
    const isActive = btn.dataset.lang === lang;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

/* ────────────────────────────────────────────────────────────────────────── */

export function onLanguageChange(listener: LanguageChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function switchLanguage(lang: SupportedLang): Promise<void> {
  const dict = await loadLocale(lang);
  applyTranslations(lang, dict);
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach((listen) => listen(lang, I18N_DEBUG ? {} as Locale : dict));
}

/**
 * Wires up `.lang-btn` click handlers and applies the initial language.
 * Call after all components that contain `data-i18n` are mounted.
 */
export async function initI18n(): Promise<void> {
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (isSupportedLang(lang)) void switchLanguage(lang);
    });
  });

  await switchLanguage(detectLanguage());
}
