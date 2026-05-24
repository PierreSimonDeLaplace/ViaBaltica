/**
 * About — static section. Just injects markup; no behaviour.
 */

import html from './about.html?raw';
import '../../styles/polaroid.css';
import './about.css';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
}
