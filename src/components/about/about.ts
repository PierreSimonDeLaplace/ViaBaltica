/**
 * About — static section. Just injects markup; no behaviour.
 */

import html from './about.html?raw';
import '../../styles/polaroid.css';
import './about.css';
import markPhoto from '../../assets/images/about/mark-photo.jpg';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
}

document.addEventListener('DOMContentLoaded', () => {
  const photoEl = document.getElementById('about-photo') as HTMLImageElement | null;
  if (photoEl) {
    photoEl.src = markPhoto;
  } else {
    console.warn('about-photo element not found');
  }
});

