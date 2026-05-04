import html from './trips.html?raw';
import './trips.css';

import { onLanguageChange, I18N_DEBUG } from '../../scripts/i18n';

const d = (value: string, key: string): string => I18N_DEBUG ? key : value;
import { getString, type Locale, type SupportedLang } from '../../types/locale';
import { type TripCategoryFile, type TripEntry } from '../../types/trips';
import { initDrawer, openDrawer, updateDrawerContent, getCurrentTripId } from './drawer';

const SWIPE_THRESHOLD_PX = 40;

// All category JSON files loaded eagerly at build time — drop a new file in
// src/data/trips/ and it appears automatically on next build.
const raw = import.meta.glob<{ default: TripCategoryFile }>(
  '../../data/trips/*.json',
  { eager: true },
);
const CATEGORIES: TripCategoryFile[] = Object.values(raw).map(m => m.default);

interface SliderLabels {
  book:  string;
  tours: string;
}

/* ──────────────────────────────────────────────────────────────────────── */

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  initDrawer();
  onLanguageChange((lang, dict) => {
    renderCategories(lang, dict);
    // Keep drawer in sync when the user switches language mid-view
    const openId = getCurrentTripId();
    if (openId) {
      const trip = findTripById(openId, lang);
      if (trip) updateDrawerContent(trip, getString(dict, 'trips.book', 'trips.book'));
    }
  });
}

function findTripById(id: string, lang: SupportedLang): TripEntry | undefined {
  for (const cat of CATEGORIES) {
    const found = cat[lang].trips.find(t => t.id === id);
    if (found) return found;
  }
  return undefined;
}

/* ──────────────────────────────────────────────────────────────────────── */

function renderCategories(lang: SupportedLang, dict: Locale): void {
  const list = document.getElementById('tripsList');
  if (!list) return;

  const labels: SliderLabels = {
    book:  getString(dict, 'trips.book',  'trips.book'),
    tours: getString(dict, 'trips.tours', 'trips.tours'),
  };

  list.replaceChildren(
    ...CATEGORIES.map(cat => buildCategoryRow(cat, lang, labels)),
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function buildCategoryRow(
  cat: TripCategoryFile,
  lang: SupportedLang,
  labels: SliderLabels,
): HTMLElement {
  const langData = cat[lang];
  const row      = document.createElement('div');
  const header   = buildCategoryHeader(cat.photo, langData, labels.tours);
  const drawer   = buildCategoryDrawer(langData, labels);
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
  lang: { title: string; subtitle: string; trips: TripEntry[] },
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
  lang: { trips: TripEntry[] },
  labels: SliderLabels,
): HTMLElement {
  const drawer   = document.createElement('div');
  drawer.className = 'cat-drawer';

  const wrap     = document.createElement('div');
  wrap.className = 'trip-slider-wrap';

  const viewport = document.createElement('div');
  viewport.className = 'trip-slider-viewport';

  const track    = document.createElement('div');
  track.className = 'trip-slider-track';
  lang.trips.forEach(trip => track.appendChild(buildTripCard(trip, labels)));

  viewport.appendChild(track);
  wrap.append(viewport, buildSlider(track, lang.trips.length));
  drawer.appendChild(wrap);
  return drawer;
}

function buildTripCard(trip: TripEntry, labels: SliderLabels): HTMLElement {
  const card = document.createElement('div');
  card.className = 'trip-card';
  const tags = I18N_DEBUG
    ? trip.tags.map((_, i) => `<span class="trip-tag">trip.tags[${i}]</span>`).join('')
    : trip.tags.map(tag => `<span class="trip-tag">${tag}</span>`).join('');

  card.innerHTML = `
    <div class="trip-card-img" style="background:${trip.color};">
      <img src="${trip.thumb}" alt="${trip.title}" loading="lazy" />
    </div>
    <div class="trip-card-body">
      <div class="trip-card-title">${d(trip.title, 'trip.title')}</div>
      <div class="trip-card-tags">${tags}</div>
      <p class="trip-card-desc">${d(trip.body, 'trip.body')}</p>
      <div class="trip-card-footer">
        <span class="trip-card-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          ${d(trip.meta, 'trip.meta')}
        </span>
        <a href="#contact" class="btn-primary trip-card-book">${labels.book}</a>
      </div>
    </div>`;

  // Clicking anywhere on the card except the Book button opens the detail drawer
  card.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.trip-card-book')) return;
    openDrawer(trip, labels.book);
  });

  return card;
}

/* ──────────────────────────────────────────────────────────────────────── */

function buildSlider(track: HTMLElement, count: number): HTMLElement {
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

  const goTo = (index: number): void => {
    current = Math.max(0, Math.min(index, count - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.querySelectorAll('.trip-slider-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
    prev.disabled = current === 0;
    next.disabled = current === count - 1;
  };

  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('button');
    dot.type      = 'button';
    dot.className = `trip-slider-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Trip ${i + 1}`);
    const idx = i;
    dot.addEventListener('click', () => goTo(idx));
    dots.appendChild(dot);
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  let startX   = 0;
  let dragging = false;

  track.addEventListener('pointerdown', (e) => {
    startX   = e.clientX;
    dragging = true;
  });

  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!track.hasPointerCapture(e.pointerId) && Math.abs(e.clientX - startX) > 5) {
      track.setPointerCapture(e.pointerId);
      track.classList.add('dragging');
    }
  });

  track.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    const dx = e.clientX - startX;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      goTo(dx < 0 ? current + 1 : current - 1);
    }
  });

  track.addEventListener('pointercancel', () => {
    dragging = false;
    track.classList.remove('dragging');
  });

  goTo(0);
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
