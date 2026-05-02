/**
 * Trips component.
 *
 * Mounting injects the section shell (header + empty `#tripsList` slot) into
 * the page. The category list itself is data-driven: it's (re)rendered
 * whenever the language changes — categories, titles, descriptions, button
 * labels are all pulled from `dict['trips.data']` and the locale strings.
 */

import html from './trips.html?raw';
import './trips.css';

import { onLanguageChange } from '../../scripts/i18n';
import { getString, getTripCategories, type Locale, type Trip, type TripCategory } from '../../types/locale';

const SWIPE_THRESHOLD_PX = 40;

interface SliderLabels {
  book: string;
  tours: string;
}

/* ──────────────────────────────────────────────────────────────────────── */

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  onLanguageChange((_lang, dict) => renderCategories(dict));
}

function renderCategories(dict: Locale): void {
  const list = document.getElementById('tripsList');
  if (!list) return;

  const labels: SliderLabels = {
    book:  getString(dict, 'trips.book',  'Book tour'),
    tours: getString(dict, 'trips.tours', 'tours'),
  };

  list.replaceChildren(
    ...getTripCategories(dict).map((cat) => buildCategoryRow(cat, labels)),
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function buildCategoryRow(cat: TripCategory, labels: SliderLabels): HTMLElement {
  const row    = document.createElement('div');
  const header = buildCategoryHeader(cat, labels.tours);
  const drawer = buildCategoryDrawer(cat, labels);
  row.className = 'cat-row';

  // Accordion: opening one row closes any other open row.
  header.addEventListener('click', () => {
    const wasOpen = row.classList.contains('open');
    document.querySelectorAll('.cat-row.open').forEach((r) => r.classList.remove('open'));
    if (!wasOpen) row.classList.add('open');
  });

  row.append(header, drawer);
  return row;
}

function buildCategoryHeader(cat: TripCategory, toursLabel: string): HTMLElement {
  const header = document.createElement('div');
  header.className = 'cat-header';
  header.innerHTML = `
    <div class="cat-icon">${cat.icon}</div>
    <div class="cat-info">
      <div class="cat-title">${cat.title}</div>
      <div class="cat-subtitle">${cat.subtitle}</div>
    </div>
    <span class="cat-count">${cat.trips.length} ${toursLabel}</span>
    <svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>`;
  return header;
}

function buildCategoryDrawer(cat: TripCategory, labels: SliderLabels): HTMLElement {
  const drawer = document.createElement('div');
  drawer.className = 'cat-drawer';

  const wrap = document.createElement('div');
  wrap.className = 'trip-slider-wrap';

  const viewport = document.createElement('div');
  viewport.className = 'trip-slider-viewport';

  const track = document.createElement('div');
  track.className = 'trip-slider-track';
  cat.trips.forEach((trip) => track.appendChild(buildTripCard(trip, labels.book)));

  viewport.appendChild(track);
  wrap.append(viewport, buildSlider(track, cat.trips.length));
  drawer.appendChild(wrap);

  return drawer;
}

function buildTripCard(trip: Trip, bookLabel: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'trip-card';
  card.innerHTML = `
    <div class="trip-card-img" style="background:${trip.color};">${trip.emoji}</div>
    <div class="trip-card-body">
      <div class="trip-card-title">${trip.title}</div>
      <div class="trip-card-tags">
        ${trip.tags.map((tag) => `<span class="trip-tag">${tag}</span>`).join('')}
      </div>
      <p class="trip-card-desc">${trip.body}</p>
      <div class="trip-card-footer">
        <span class="trip-card-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          ${trip.meta}
        </span>
        <a href="#" class="btn-primary trip-card-book">${bookLabel}</a>
      </div>
    </div>`;
  return card;
}

/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Builds the dot/arrow controls for a slider track and wires up:
 *   • dot clicks → goTo(i)
 *   • arrow clicks → goTo(±1)
 *   • pointer swipe on the track → goTo(±1)
 *
 * Returns the controls element to be appended next to the track.
 */
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
    dot.type = 'button';
    dot.className = `trip-slider-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Trip ${i + 1}`);
    const idx = i;
    dot.addEventListener('click', () => goTo(idx));
    dots.appendChild(dot);
  }

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));

  // Pointer swipe on the track itself.
  let startX = 0;
  let dragging = false;

  track.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    dragging = true;
    track.classList.add('dragging');
    track.setPointerCapture(e.pointerId);
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

  goTo(0);
  return controls;
}

function makeArrowButton(label: string, pathD: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'trip-slider-arrow';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="${pathD}" />
    </svg>`;
  return btn;
}
