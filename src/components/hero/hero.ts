/**
 * Hero — static section. Just injects markup; no behaviour.
 */

import html from './hero.html?raw';
import './hero.css';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
}
