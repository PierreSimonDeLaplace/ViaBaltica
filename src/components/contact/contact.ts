import html from './contact.html?raw';
import './contact.css';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  injectPhone();
  injectEmail();
}

function injectPhone(): void {
  const slot = document.getElementById('contact-phone-slot');
  if (!slot) return;

  // Digits split across literals — keeps the full number out of static HTML source
  const cc   = "+" + "4" + "8";
  const seg1 = "5" + "0" + "0";
  const seg2 = "1" + "2" + "3";
  const seg3 = "4" + "5" + "6";

  const a = document.createElement('a');
  a.href      = "tel:" + cc + seg1 + seg2 + seg3;
  a.textContent = `${cc} ${seg1} ${seg2} ${seg3}`;
  a.className = 'contact-link';
  slot.appendChild(a);
}

function injectEmail(): void {
  const slot = document.getElementById('contact-email-slot');
  if (!slot) return;

  // Split to keep the full address out of static source
  const user = "kont" + "akt";
  const host = "viab" + "altica" + ".pl";

  const a = document.createElement('a');
  a.href      = "mail" + "to:" + user + "@" + host;
  a.textContent = user + "@" + host;
  a.className = 'contact-link';
  slot.appendChild(a);
}