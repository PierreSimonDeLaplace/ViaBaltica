import html from './faq.html?raw';
import './faq.css';

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);

  const section = target.querySelector<HTMLElement>('.faq-section');
  if (!section) return;

  section.querySelectorAll<HTMLButtonElement>('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item    = btn.closest<HTMLElement>('.faq-item');
      const isOpen  = item?.classList.contains('open') ?? false;

      // Collapse whichever item is currently open
      section.querySelectorAll<HTMLElement>('.faq-item.open').forEach((el) => {
        el.classList.remove('open');
        el.querySelector<HTMLButtonElement>('.faq-question')
          ?.setAttribute('aria-expanded', 'false');
      });

      // Expand the clicked item (unless it was already open)
      if (!isOpen && item) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
