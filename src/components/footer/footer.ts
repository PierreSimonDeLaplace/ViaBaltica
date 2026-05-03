import html from './footer.html?raw';
import './footer.css';

export function mount(): void {
  document.body.insertAdjacentHTML('beforeend', html);
}
