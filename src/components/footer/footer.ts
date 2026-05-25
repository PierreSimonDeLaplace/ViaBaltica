import html from './footer.html?raw';
import './footer.css';
import { I18N_DEBUG, onLanguageChange } from '../../scripts/i18n';
import { injectContactLink } from '../../scripts/contact-link';
import { getString, type Locale } from '../../types/locale';

function updateCopyright(dict: Locale): void {
  const el = document.querySelector<HTMLElement>('.footer-copyright');
  if (!el) return;
  if (I18N_DEBUG) { el.textContent = 'footer.copyright'; return; }
  const tpl = getString(dict, 'footer.copyright', '© {year} Mark Jeziak');
  el.textContent = tpl.replace('{year}', String(new Date().getFullYear()));
}

export function mount(): void {
  document.body.insertAdjacentHTML('beforeend', html);
  injectContactLink('footer-phone-slot', 'phone', 'footer-contact-link');
  injectContactLink('footer-email-slot', 'email', 'footer-contact-link');
  onLanguageChange((_lang, dict) => updateCopyright(dict));
}
