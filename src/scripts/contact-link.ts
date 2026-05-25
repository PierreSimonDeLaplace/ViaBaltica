import config from '../data/contact.json';
import { I18N_DEBUG } from './i18n';

type Kind = 'phone' | 'email';

export function injectContactLink(slotId: string, kind: Kind, className: string): void {
  const slot = document.getElementById(slotId);
  if (!slot) return;

  if (I18N_DEBUG) {
    slot.textContent = `[contact.json → ${kind}]`;
    return;
  }

  const value = config[kind];
  const a = document.createElement('a');
  a.href        = kind === 'phone' ? `tel:${value.replace(/\s/g, '')}` : `mailto:${value}`;
  a.textContent = value;
  a.className   = className;
  slot.appendChild(a);
}
