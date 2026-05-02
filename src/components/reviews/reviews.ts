/**
 * Reviews — static section. Just injects markup; no behaviour.
 */

import html from './reviews.html?raw';
import './reviews.css';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
}
