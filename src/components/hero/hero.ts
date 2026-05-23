import html from './hero.html?raw';
import './hero.css';

interface Slide { src: string; alt: string; }

const SLIDES_LIGHT: Slide[] = [
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Gda%C5%84sk_G%C5%82%C3%B3wne_Miasto%2C_Ulica_Mariacka_-_panoramio.jpg/960px-Gda%C5%84sk_G%C5%82%C3%B3wne_Miasto%2C_Ulica_Mariacka_-_panoramio.jpg',
    alt: "Ulica Mariacka — Gdańsk's Gothic amber street",
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Neptune%27s_Fountain_in_the_center_of_Gdansk_-_panoramio.jpg/960px-Neptune%27s_Fountain_in_the_center_of_Gdansk_-_panoramio.jpg',
    alt: "Neptune's Fountain at Długi Targ",
  },
  {
    src: 'https://images8.alphacoders.com/742/thumb-1920-742355.jpg',
    alt: 'Gdańsk old town panorama',
  },
];

const SLIDES_DARK: Slide[] = [
  {
    src: 'https://images.unsplash.com/photo-1671921002984-4aaf9db971e2?w=1920&q=85',
    alt: 'Gdańsk old town at dusk viewed from the Motława river',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Gdansk_at_night.jpg/960px-Gdansk_at_night.jpg',
    alt: 'Gdańsk illuminated at night',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/%C5%BBuraw_in_Gda%C5%84sk.jpg/960px-%C5%BBuraw_in_Gda%C5%84sk.jpg',
    alt: 'The Żuraw — a 14th-century crane on the Motława waterfront',
  },
];

const AUTOPLAY_MS     = 5000;
const SWIPE_THRESHOLD = 50;

function isLight(): boolean {
  return document.documentElement.dataset.theme === 'light';
}

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

  // Touch swipe
  let touchStartX = 0;
  slidesEl.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  slidesEl.addEventListener('touchend', e => {
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

  // Swap slide sets when the theme toggles
  new MutationObserver(() => {
    stopAutoplay();
    buildSlides(isLight() ? SLIDES_LIGHT : SLIDES_DARK);
    startAutoplay();
  }).observe(document.documentElement, { attributeFilter: ['data-theme'] });

  buildSlides(isLight() ? SLIDES_LIGHT : SLIDES_DARK);
  startAutoplay();
}
