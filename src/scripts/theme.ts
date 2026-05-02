/**
 * Theme — applies and toggles the dark/light theme.
 *
 * The active theme is stored in `localStorage` and reflected as a
 * `data-theme` attribute on `<html>`. CSS custom properties in
 * `styles/tokens.css` swap based on that attribute.
 */

const STORAGE_KEY = 'preferred-theme';

type Theme = 'light' | 'dark';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function toggleTheme(): void {
  applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
}

/**
 * Restores the saved theme (or follows the system preference) and wires up
 * any `.theme-btn` buttons in the DOM. Call after the nav is mounted.
 */
export function initTheme(): void {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (isTheme(saved)) {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  document.querySelectorAll<HTMLButtonElement>('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
}
