import html from './footer.html?raw';
import './footer.css';
import { I18N_DEBUG, onLanguageChange } from '../../scripts/i18n';
import { getString, type Locale } from '../../types/locale';
import config from '../../data/contact.json';

function updateCopyright(dict: Locale): void {
  const el = document.querySelector<HTMLElement>('.footer-copyright');
  if (!el) return;
  if (I18N_DEBUG) { el.textContent = 'footer.copyright'; return; }
  const tpl = getString(dict, 'footer.copyright', '© {year} Mark Jeziak');
  el.textContent = tpl.replace('{year}', String(new Date().getFullYear()));
}

function injectPhone(): void {
  const slot = document.getElementById('footer-phone-slot');
  if (!slot) return;
  if (I18N_DEBUG) { slot.textContent = '[contact.json → phone]'; return; }
  const a = document.createElement('a');
  a.href      = 'tel:' + config.phone.replace(/\s/g, '');
  a.textContent = config.phone;
  a.className = 'footer-contact-link';
  slot.appendChild(a);
}

function injectEmail(): void {
  const slot = document.getElementById('footer-email-slot');
  if (!slot) return;
  if (I18N_DEBUG) { slot.textContent = '[contact.json → email]'; return; }
  const a = document.createElement('a');
  a.href        = 'mailto:' + config.email;
  a.textContent = config.email;
  a.className   = 'footer-contact-link';
  slot.appendChild(a);
}

export function mount(): void {
  document.body.insertAdjacentHTML('beforeend', html);
  injectPhone();
  injectEmail();
  onLanguageChange((_lang, dict) => updateCopyright(dict));
}
