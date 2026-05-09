import html from './reviews.html?raw';
import './reviews.css';
import { onLanguageChange } from '../../scripts/i18n';
import { getString, type Locale, type SupportedLang } from '../../types/locale';

const fallbacks = {
  en: () => import('../../data/reviews/en.json'),
  pl: () => import('../../data/reviews/pl.json'),
};

interface Review {
  author: string;
  rating: number;
  text:   string;
  time:   string;
  avatar: string;
}

interface ReviewsPayload {
  rating:  number;
  total:   number;
  reviews: Review[];
}

const AVATAR_COLORS = [
  'var(--avatar-1)', 'var(--avatar-2)', 'var(--avatar-3)',
  'var(--avatar-4)', 'var(--avatar-5)', 'var(--avatar-6)',
];

function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? 'var(--avatar-2)';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function starsHtml(n: number): string {
  return '★'.repeat(Math.min(5, Math.max(0, Math.round(n))));
}

function countLabel(total: number, dict: Locale): string {
  return getString(dict, 'reviews.count_format', `(${total})`).replace('{n}', String(total));
}

function buildControls(grid: HTMLElement, controls: HTMLElement): void {
  controls.innerHTML = '';

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.review-card'));
  if (cards.length < 2) return;

  const gap          = parseFloat(getComputedStyle(grid).columnGap) || 0;
  const cardWidth    = cards[0]!.offsetWidth;
  const cardsPerPage = Math.max(1, Math.round(grid.clientWidth / (cardWidth + gap)));
  const pageCount    = Math.ceil(cards.length / cardsPerPage);

  if (pageCount <= 1) return;

  const prev = document.createElement('button');
  prev.className = 'reviews-arrow';
  prev.setAttribute('aria-label', 'Previous');
  prev.innerHTML = '&#8249;';

  const next = document.createElement('button');
  next.className = 'reviews-arrow';
  next.setAttribute('aria-label', 'Next');
  next.innerHTML = '&#8250;';

  const dots = Array.from({ length: pageCount }, (_, i) => {
    const dot = document.createElement('button');
    dot.className = 'reviews-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Page ${i + 1}`);
    return dot;
  });

  controls.append(prev, ...dots, next);

  let currentPage = 0;
  let programmatic = false;

  function updateUI(): void {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === currentPage));
    prev.disabled = currentPage === 0;
    next.disabled = currentPage === pageCount - 1;
  }

  function goToPage(pageIdx: number): void {
    currentPage = Math.max(0, Math.min(pageCount - 1, pageIdx));
    programmatic = true;
    const card = cards[currentPage * cardsPerPage];
    if (card) grid.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
    updateUI();
  }

  prev.addEventListener('click', () => { goToPage(currentPage - 1); });
  next.addEventListener('click', () => { goToPage(currentPage + 1); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goToPage(i); }));

  let scrollTimer: ReturnType<typeof setTimeout>;
  grid.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    // Ignore scroll events fired by our own programmatic scrollTo
    if (programmatic) {
      scrollTimer = setTimeout(() => { programmatic = false; }, 400);
      return;
    }
    scrollTimer = setTimeout(() => {
      let closestPage = 0;
      let minDist = Infinity;
      for (let i = 0; i < pageCount; i++) {
        const card = cards[i * cardsPerPage];
        if (!card) continue;
        const dist = Math.abs(card.offsetLeft - grid.scrollLeft);
        if (dist < minDist) { minDist = dist; closestPage = i; }
      }
      currentPage = closestPage;
      updateUI();
    }, 80);
  });

  goToPage(0);
}

function syncControls(grid: HTMLElement, controls: HTMLElement): void {
  // Double rAF ensures percentage-based flex layout is fully resolved
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (grid.scrollWidth > grid.clientWidth + 4) {
        buildControls(grid, controls);
      } else {
        controls.innerHTML = '';
      }
    });
  });
}

function renderCards(payload: ReviewsPayload, dict: Locale): void {
  const grid     = document.querySelector<HTMLElement>('.reviews-grid');
  const controls = document.querySelector<HTMLElement>('.reviews-controls');
  const score    = document.querySelector<HTMLElement>('.summary-score');
  const count    = document.querySelector<HTMLElement>('.summary-count');

  if (score) score.textContent = payload.rating.toFixed(1);
  if (count) count.textContent = countLabel(payload.total, dict);

  if (!grid) return;
  grid.innerHTML = payload.reviews.filter(r => r.text.trim()).map(r => {
    const initial = (r.author[0] ?? '?').toUpperCase();
    const color   = avatarColor(r.author);
    return `
      <article class="review-card">
        <div class="review-stars">${starsHtml(r.rating)}</div>
        <p class="review-text">${escapeHtml(r.text)}</p>
        <div class="reviewer">
          <div class="reviewer-avatar" style="background:${color}">${initial}</div>
          <div class="reviewer-info">
            <span class="reviewer-name">${escapeHtml(r.author)}</span>
            <span class="reviewer-date">${escapeHtml(r.time)}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  if (controls) syncControls(grid, controls);
}

async function loadReviews(lang: SupportedLang, dict: Locale): Promise<void> {
  try {
    const res = await fetch(`/api/reviews?lang=${lang}`);
    if (res.ok) {
      const data = await res.json() as ReviewsPayload;
      renderCards(data, dict);
      return;
    }
  } catch {
    // fall through to static fallback
  }

  const mod = await fallbacks[lang]();
  renderCards(mod.default as ReviewsPayload, dict);
}

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);

  onLanguageChange((newLang, dict) => {
    void loadReviews(newLang, dict);
  });

  // Re-evaluate carousel visibility when the section resizes (window resize / breakpoint change)
  const wrap = target.querySelector('.reviews-slider-wrap');
  if (wrap) {
    new ResizeObserver(() => {
      const grid     = target.querySelector<HTMLElement>('.reviews-grid');
      const controls = target.querySelector<HTMLElement>('.reviews-controls');
      if (grid && controls && grid.childElementCount > 0) syncControls(grid, controls);
    }).observe(wrap);
  }
}
