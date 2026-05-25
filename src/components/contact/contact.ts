import html from './contact.html?raw';
import './contact.css';
import { injectContactLink } from '../../scripts/contact-link';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  injectContactLink('contact-phone-slot', 'phone', 'contact-link');
  injectContactLink('contact-email-slot', 'email', 'contact-link');
}
