/**
 * Nav component — injects markup directly after `#menu-toggle` so the
 * checkbox-based hamburger CSS keeps working (sibling selectors).
 *
 * Behaviour for the buttons inside (`.lang-btn`, `.theme-btn`) is wired up
 * by `scripts/i18n.ts` and `scripts/theme.ts` respectively — the nav module
 * is intentionally markup-only.
 */

import html from './nav.html?raw';
import './nav.css';

export function mount(): void {
  const toggle = document.getElementById('menu-toggle') as HTMLInputElement | null;
  if (!toggle) throw new Error('Nav.mount: missing #menu-toggle in document');
  toggle.insertAdjacentHTML('afterend', html);

  document.querySelectorAll<HTMLAnchorElement>('.nav-links a, .mobile-links a').forEach(a => {
    const href = a.getAttribute('href') ?? '';
    const active = href === '/'
      ? window.location.pathname === '/'
      : window.location.pathname.startsWith(href);
    a.classList.toggle('active', active);
  });

  document.querySelector('.mobile-drawer')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.theme-btn')) return;
    toggle.checked = false;
  });
}
