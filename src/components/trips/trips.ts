import html from './trips.html?raw';
import './trips.css';

import { onLanguageChange, d } from '../../scripts/i18n';
import { getString, type Locale, type SupportedLang } from '../../types/locale';
import { type TripCategoryFile, type TripCategoryLang, type TripEntry } from '../../types/trips';
import { initDrawer, openDrawer, refreshIfOpen, renderTags } from './drawer';

// All category JSON files loaded eagerly at build time — drop a new file in
// src/data/trips/ and it appears automatically on next build.
const raw = import.meta.glob<{ default: TripCategoryFile }>(
  '../../data/trips/*.json',
  { eager: true },
);
const CATEGORIES: TripCategoryFile[] = Object.values(raw).map(m => m.default);

/* ──────────────────────────────────────────────────────────────────────── */

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  initDrawer();
  onLanguageChange((lang, dict) => {
    renderCategories(lang, dict);
    refreshIfOpen(
      (id) => {
        for (const cat of CATEGORIES) {
          const found = cat[lang].trips.find(t => t.id === id);
          if (found) return found;
        }
        return undefined;
      },
      getString(dict, 'trips.book', 'trips.book'),
    );
  });
}

/* ──────────────────────────────────────────────────────────────────────── */

function renderCategories(lang: SupportedLang, dict: Locale): void {
  const list = document.getElementById('tripsList');
  if (!list) return;

  const bookLabel  = getString(dict, 'trips.book',  'trips.book');
  const toursLabel = getString(dict, 'trips.tours', 'trips.tours');

  list.replaceChildren(
    ...CATEGORIES.map(cat => buildCategoryRow(cat, lang, bookLabel, toursLabel)),
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function buildCategoryRow(
  cat: TripCategoryFile,
  lang: SupportedLang,
  bookLabel: string,
  toursLabel: string,
): HTMLElement {
  const langData = cat[lang];
  const row      = document.createElement('div');
  const header   = buildCategoryHeader(cat.photo, langData, toursLabel);
  const drawer   = buildCategoryDrawer(langData, bookLabel);
  row.className  = 'cat-row';

  header.addEventListener('click', () => {
    const wasOpen = row.classList.contains('open');
    document.querySelectorAll('.cat-row.open').forEach(r => r.classList.remove('open'));
    if (!wasOpen) row.classList.add('open');
  });

  row.append(header, drawer);
  return row;
}

function buildCategoryHeader(
  photo: string,
  lang: TripCategoryLang,
  toursLabel: string,
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'cat-header';
  header.innerHTML = `
    <div class="cat-photo">
      <img src="${photo}" alt="${lang.title}" loading="lazy" />
    </div>
    <div class="cat-info">
      <div class="cat-title">${d(lang.title, 'category.title')}</div>
      <div class="cat-subtitle">${d(lang.subtitle, 'category.subtitle')}</div>
    </div>
    <span class="cat-count">${lang.trips.length} ${toursLabel}</span>
    <svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>`;
  return header;
}

function buildCategoryDrawer(
  lang: TripCategoryLang,
  bookLabel: string,
): HTMLElement {
  const drawer   = document.createElement('div');
  drawer.className = 'cat-drawer';

  const wrap     = document.createElement('div');
  wrap.className = 'trip-slider-wrap';

  const viewport = document.createElement('div');
  viewport.className = 'trip-slider-viewport';

  const track    = document.createElement('div');
  track.className = 'trip-slider-track';
  lang.trips.forEach(trip => track.appendChild(buildTripCard(trip, bookLabel)));

  viewport.appendChild(track);
  wrap.append(viewport, buildSlider(viewport, lang.trips.length));
  drawer.appendChild(wrap);
  return drawer;
}

function buildTripCard(trip: TripEntry, bookLabel: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'trip-card';

  const [pricePrefix = '', priceAmount = ''] = trip.price?.split(/\s(.+)/) ?? [];

  card.innerHTML = `
    <div class="trip-card-img">
      ${trip.badge ? `<div class="trip-ribbon trip-ribbon--${trip.badge}">${trip.badge}</div>` : ''}
      <img src="${trip.thumb}" alt="${trip.title}" loading="lazy" />
    </div>
    <div class="trip-card-body">
      <div class="trip-card-top">
        <div class="trip-card-title">${d(trip.title, 'trip.title')}</div>
        ${trip.price ? `
          <div class="trip-price-circle">
            <span class="trip-price-from">${pricePrefix}</span>
            <span class="trip-price-amount">${priceAmount}</span>
          </div>` : ''}
      </div>
      <div class="trip-card-tags">${renderTags(trip.tags)}</div>
      <p class="trip-card-desc">${d(trip.body, 'trip.body')}</p>
      <div class="trip-card-footer">
        <span class="trip-card-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          ${d(trip.meta, 'trip.meta')}
        </span>
        <a href="#contact" class="btn-primary trip-card-book">${bookLabel}</a>
      </div>
    </div>`;

  // Clicking anywhere on the card except the Book button opens the detail drawer
  card.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.trip-card-book')) return;
    openDrawer(trip, bookLabel);
  });

  return card;
}

/* ──────────────────────────────────────────────────────────────────────── */

function buildSlider(viewport: HTMLElement, count: number): HTMLElement {
  let current = 0;

  const dots = document.createElement('div');
  dots.className = 'trip-slider-dots';

  const prev = makeArrowButton('Previous', 'M15 18l-6-6 6-6');
  const next = makeArrowButton('Next',     'M9 18l6-6-6-6');

  const arrows = document.createElement('div');
  arrows.className = 'trip-slider-arrows';
  arrows.append(prev, next);

  const controls = document.createElement('div');
  controls.className = 'trip-slider-controls';
  controls.append(dots, arrows);

  const sync = (): void => {
    dots.querySelectorAll('.trip-slider-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
    prev.disabled = current === 0;
    next.disabled = current === count - 1;
  };

  const goTo = (index: number): void => {
    current = Math.max(0, Math.min(index, count - 1));
    viewport.scrollTo({ left: viewport.clientWidth * current, behavior: 'smooth' });
    sync();
  };

  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('button');
    dot.type      = 'button';
    dot.className = `trip-slider-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Trip ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots.appendChild(dot);
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  let settleTimer: number | undefined;
  viewport.addEventListener('scroll', () => {
    if (settleTimer !== undefined) clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const w = viewport.clientWidth;
      if (w === 0) return;
      const newIndex = Math.round(viewport.scrollLeft / w);
      if (newIndex !== current) {
        current = newIndex;
        sync();
      }
    }, 80);
  });

  sync();
  return controls;
}

function makeArrowButton(label: string, pathD: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type  = 'button';
  btn.className = 'trip-slider-arrow';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="${pathD}" />
    </svg>`;
  return btn;
}
