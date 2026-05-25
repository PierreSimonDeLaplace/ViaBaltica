import html from './hero.html?raw';
import './hero.css';

interface Slide { src: string; alt: string; }

const SLIDES: Slide[] = [
  {
    src: '/images/hero/gdansk.jpg',
    alt: 'Gdańsk waterfront along the Motława river at dusk',
  },
  {
    src: '/images/hero/krzywy_domek.jpg',
    alt: 'Krzywy Domek — the famously crooked building in Sopot',
  },
  {
    src: '/images/hero/torun.jpg',
    alt: 'Toruń old town reflected in the Vistula river',
  },
];

const AUTOPLAY_MS     = 5000;
const SWIPE_THRESHOLD = 50;


export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);

  const section  = target.querySelector<HTMLElement>('.page-hero')!;
  const slidesEl = section.querySelector<HTMLElement>('.hero-slides')!;
  const dotsEl   = section.querySelector<HTMLElement>('.hero-dots')!;

  // count = number of real slides; DOM has count+1 elements (clone of slide 0 at the end)
  let count   = 0;
  let pos     = 0;  // transform position: 0..count (count = clone of slide 0)
  let current = 0;  // active dot index: 0..count-1
  let timer: ReturnType<typeof setInterval> | null = null;
  let dots: HTMLButtonElement[] = [];

  function moveTo(newPos: number, animate = true): void {
    if (!animate) {
      slidesEl.style.transition = 'none';
      void slidesEl.offsetWidth;          // commit transition:none
    }
    pos = newPos;
    slidesEl.style.transform = `translateX(-${pos * 100}%)`;
    if (!animate) {
      void slidesEl.offsetWidth;          // commit new position as the base before re-enabling
      slidesEl.style.transition = '';
    }

    const dotIdx = pos < count ? pos : 0;
    dots[current].classList.remove('hero-dot--active');
    current = dotIdx;
    dots[current].classList.add('hero-dot--active');
  }

  // After the forward animation into the clone lands, silently snap to real slide 0
  slidesEl.addEventListener('transitionend', () => {
    if (pos === count) moveTo(0, false);
  });

  function startAutoplay(): void {
    timer = setInterval(() => moveTo(pos + 1), AUTOPLAY_MS);
  }

  function stopAutoplay(): void {
    if (timer !== null) { clearInterval(timer); timer = null; }
  }

  function buildSlides(slides: Slide[]): void {
    count = slides.length;

    slidesEl.style.transition = 'none';

    // Real slides + clone of the first slide for the seamless forward wrap
    slidesEl.innerHTML = [...slides, slides[0]].map((s, i) =>
      `<img class="hero-slide" src="${s.src}" alt="${s.alt}" draggable="false"${i > 0 ? ' loading="lazy"' : ''}>`
    ).join('');

    dotsEl.innerHTML = slides.map((_, i) =>
      `<button class="hero-dot${i === 0 ? ' hero-dot--active' : ''}" aria-label="Slide ${i + 1}"></button>`
    ).join('');

    dots = Array.from(dotsEl.querySelectorAll<HTMLButtonElement>('.hero-dot'));
    dots.forEach((dot, i) => dot.addEventListener('click', () => {
      stopAutoplay();
      moveTo(i);
      startAutoplay();
    }));

    pos = 0;
    current = 0;
    slidesEl.style.transform = 'translateX(0)';
    requestAnimationFrame(() => { slidesEl.style.transition = ''; });
  }

  // Touch swipe — listeners on section so they fire over the copy overlay too
  let touchStartX = 0;
  section.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  section.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < SWIPE_THRESHOLD) return;
    stopAutoplay();
    if (diff > 0) {
      moveTo(pos + 1);           // swipe left  → forward (wraps via clone)
    } else if (pos > 0) {
      moveTo(pos - 1);           // swipe right → backward (clamps at first slide)
    }
    startAutoplay();
  }, { passive: true });

  // Pause while hovering
  section.addEventListener('pointerenter', stopAutoplay);
  section.addEventListener('pointerleave', startAutoplay);

  buildSlides(SLIDES);
  startAutoplay();
}
