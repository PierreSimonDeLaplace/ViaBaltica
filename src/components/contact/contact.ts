import html from './contact.html?raw';
import './contact.css';
import { I18N_DEBUG } from '../../scripts/i18n';
import config from '../../data/contact.json';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  injectPhone();
  injectEmail();
}

function injectPhone(): void {
  const slot = document.getElementById('contact-phone-slot');
  if (!slot) return;

  if (I18N_DEBUG) {
    slot.textContent = '[contact.json → phone]';
    return;
  }

  const a = document.createElement('a');
  a.href        = 'tel:' + config.phone.replace(/\s/g, '');
  a.textContent = config.phone;
  a.className   = 'contact-link';
  slot.appendChild(a);
}

function injectEmail(): void {
  const slot = document.getElementById('contact-email-slot');
  if (!slot) return;

  if (I18N_DEBUG) {
    slot.textContent = '[contact.json → email]';
    return;
  }

  const a = document.createElement('a');
  a.href        = 'mailto:' + config.email;
  a.textContent = config.email;
  a.className   = 'contact-link';
  slot.appendChild(a);
}

