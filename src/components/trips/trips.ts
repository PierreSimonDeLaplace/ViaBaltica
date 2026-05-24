import html from './trips.html?raw';
import './trips.css';

import { onLanguageChange, d } from '../../scripts/i18n';
import { getString, type Locale, type SupportedLang } from '../../types/locale';
import {
  type TripCategoryFile,
  type TripCategoryLang,
  type TripEntry,
} from '../../types/trips';
import {
  initDrawer,
  openDrawer,
  refreshIfOpen,
  renderTags,
  type DrawerStrings,
} from './drawer';

const raw = import.meta.glob<{ default: TripCategoryFile }>(
  '../../data/trips/*.json',
  { eager: true },
);
const CATEGORIES: TripCategoryFile[] = Object.values(raw).map(m => m.default);

let initialHashChecked = false;

function findBySlug(slug: string, lang: SupportedLang): TripEntry | undefined {
  for (const cat of CATEGORIES) {
    const found = cat[lang].trips.find(t => t.slug === slug);
    if (found) return found;
  }
  return undefined;
}

function extractStrings(dict: Locale): DrawerStrings {
  return {
    book:             getString(dict, 'trips.book',              'Book this tour'),
    drawerLabel:      getString(dict, 'trips.drawer_label',      'Tour detail'),
    drawerClose:      getString(dict, 'trips.drawer_close',      'Close'),
    fromGroup:        getString(dict, 'trips.from_group',        'From / group'),
    highlights:       getString(dict, 'trips.highlights',        "What we'll see"),
    cancellation:     getString(dict, 'trips.cancellation',      'Free cancellation up to 48h.'),
    cancellationNote: getString(dict, 'trips.cancellation_note', 'No upfront payment — confirmation by email.'),
    from:             getString(dict, 'trips.from',              'from'),
  };
}

/* ──────────────────────────────────────────────────────────────────────────── */

export function mount(target: HTMLElement): void {
  target.insertAdjacentHTML('beforeend', html);
  initDrawer();

  onLanguageChange((lang, dict) => {
    const strings = extractStrings(dict);

    renderSection(lang, dict, strings);

    if (!initialHashChecked) {
      initialHashChecked = true;
      const m = location.hash.match(/^#tour=([\w-]+)/);
      if (m) {
        const trip = findBySlug(m[1], lang);
        if (trip) openDrawer(trip, strings);
      }
    }

    refreshIfOpen((slug) => findBySlug(slug, lang), strings);
  });
}

/* ──────────────────────────────────────────────────────────────────────────── */

function renderSection(lang: SupportedLang, dict: Locale, strings: DrawerStrings): void {
  const list = document.getElementById('tripsList');
  if (!list) return;

  const prevLabel  = getString(dict, 'trips.prev',  'Previous');
  const nextLabel  = getString(dict, 'trips.next',  'Next');
  const toursLabel = getString(dict, 'trips.tours', 'tours');

  list.replaceChildren(
    ...CATEGORIES.map(cat =>
      buildCategoryRow(cat[lang], strings, prevLabel, nextLabel, toursLabel),
    ),
  );
}

function buildCategoryRow(
  langData: TripCategoryLang,
  strings: DrawerStrings,
  prevLabel: string,
  nextLabel: string,
  toursLabel: string,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'cat-row';

  const rail   = buildRail(langData.trips, strings);
  const header = buildRowHeader(langData, prevLabel, nextLabel, toursLabel, rail);
  const dots   = buildDotIndicator(rail, langData.trips.length);

  section.append(header, rail, dots);
  return section;
}

/* ── Row header ──────────────────────────────────────────────────────────── */

function buildRowHeader(
  langData: TripCategoryLang,
  prevLabel: string,
  nextLabel: string,
  toursLabel: string,
  rail: HTMLElement,
): HTMLElement {
  const header = document.createElement('div');
  header.className = 'cat-row-header';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'cat-row-title-wrap';

  const h3 = document.createElement('h3');
  h3.className   = 'cat-row-title';
  h3.textContent = d(langData.title, 'cat.title');

  const p = document.createElement('p');
  p.className   = 'cat-row-subtitle';
  p.textContent = d(langData.subtitle, 'cat.subtitle');

  titleWrap.append(h3, p);

  const controls = document.createElement('div');
  controls.className = 'cat-row-controls';

  const count = document.createElement('span');
  count.className   = 'cat-row-count';
  count.textContent = `${langData.trips.length} ${toursLabel}`;

  const arrows = document.createElement('div');
  arrows.className = 'cat-row-arrows';

  const prev = makeArrowBtn(prevLabel, '←');
  const next = makeArrowBtn(nextLabel, '→');
  prev.addEventListener('click', () => rail.scrollBy({ left: -340, behavior: 'smooth' }));
  next.addEventListener('click', () => rail.scrollBy({ left: 340, behavior: 'smooth' }));

  arrows.append(prev, next);
  controls.append(count, arrows);
  header.append(titleWrap, controls);
  return header;
}

function makeArrowBtn(label: string, glyph: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cat-arrow';
  btn.setAttribute('aria-label', label);
  btn.textContent = glyph;
  return btn;
}

/* ── Rail ────────────────────────────────────────────────────────────────── */

function buildRail(trips: TripEntry[], strings: DrawerStrings): HTMLElement {
  const rail = document.createElement('div');
  rail.className = 'cat-row-rail';

  // Leading spacer — provides the left gutter via a flex item rather than
  // padding-inline-start, which Safari/WebKit drops on scroll containers.
  const lead = document.createElement('div');
  lead.className = 'cat-row-lead';
  lead.setAttribute('aria-hidden', 'true');
  rail.appendChild(lead);

  trips.forEach(trip => {
    const slot = document.createElement('div');
    slot.className = 'cat-row-slot';
    slot.dataset.tourCard = '';
    slot.appendChild(buildCard(trip, strings));
    rail.appendChild(slot);
  });

  const trail = document.createElement('div');
  trail.className = 'cat-row-trail';
  trail.setAttribute('aria-hidden', 'true');
  rail.appendChild(trail);

  attachDragScroll(rail);
  return rail;
}

/* ── Drag-to-scroll (mouse) ──────────────────────────────────────────────── */

function attachDragScroll(rail: HTMLElement): void {
  let startX     = 0;
  let scrollStart = 0;
  let didDrag    = false;

  rail.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button !== 0) return;
    startX      = e.clientX;
    scrollStart = rail.scrollLeft;
    didDrag     = false;
    rail.classList.add('is-dragging');
    rail.style.scrollSnapType = 'none'; // suspend snap so dragging feels fluid
    e.preventDefault();                 // prevent text-selection highlight

    const onMove = (mv: MouseEvent) => {
      const dx = mv.clientX - startX;
      if (Math.abs(dx) > 4) didDrag = true;
      rail.scrollLeft = scrollStart - dx;
    };

    const onUp = () => {
      rail.classList.remove('is-dragging');
      rail.style.scrollSnapType = '';   // restore → browser snaps to nearest card
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  });

  // Swallow the click that fires after a drag so no card opens on release.
  // Capture phase ensures this runs before the card's own click handler.
  rail.addEventListener('click', (e: MouseEvent) => {
    if (!didDrag) return;
    e.stopPropagation();
    didDrag = false;
  }, true);
}

/* ── Tour card ───────────────────────────────────────────────────────────── */

function buildCard(trip: TripEntry, strings: DrawerStrings): HTMLElement {
  const article = document.createElement('article');
  article.className = 'tour-card';
  article.setAttribute('tabindex', '0');
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', trip.title);

  // Image block
  const imgWrap = document.createElement('div');
  imgWrap.className = 'tour-card-img-wrap';

  const img = document.createElement('img');
  img.src     = trip.thumb;
  img.alt     = trip.title;
  img.loading = 'lazy';
  imgWrap.appendChild(img);

  if (trip.price !== undefined) {
    const chip = document.createElement('div');
    chip.className = 'tour-card-price';
    chip.innerHTML = `<span class="tour-card-price-from">${d(strings.from, 'trips.from')} </span>€${trip.price}`;
    imgWrap.appendChild(chip);
  }

  if (trip.badge) {
    const badge = document.createElement('div');
    badge.className   = 'tour-card-badge';
    badge.textContent = d(trip.badge, 'trip.badge');
    imgWrap.appendChild(badge);
  }

  // Body block
  const body = document.createElement('div');
  body.className = 'tour-card-body';

  const tagsEl = document.createElement('div');
  tagsEl.className = 'tour-card-tags';
  tagsEl.innerHTML = renderTags(trip.tags);

  const titleEl = document.createElement('h4');
  titleEl.className   = 'tour-card-title';
  titleEl.textContent = d(trip.title, 'trip.title');

  const meta = document.createElement('div');
  meta.className = 'tour-card-meta';

  const durSpan = document.createElement('span');
  durSpan.textContent = d(trip.duration, 'trip.duration');

  const dot = document.createElement('span');
  dot.className = 'tour-card-dot';
  dot.setAttribute('aria-hidden', 'true');

  const locSpan = document.createElement('span');
  locSpan.textContent = d(trip.location, 'trip.location');

  meta.append(durSpan, dot, locSpan);
  body.append(tagsEl, titleEl, meta);
  article.append(imgWrap, body);

  const open = (): void => openDrawer(trip, strings);
  article.addEventListener('click', open);
  article.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });

  return article;
}

/* ── Dot indicator ───────────────────────────────────────────────────────── */

function buildDotIndicator(rail: HTMLElement, count: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'cat-row-dots';
  wrap.setAttribute('aria-hidden', 'true');

  const dots: HTMLElement[] = [];
  const max = Math.min(count, 8);
  for (let i = 0; i < max; i++) {
    const dot = document.createElement('span');
    dot.className = `cat-dot${i === 0 ? ' cat-dot--active' : ''}`;
    wrap.appendChild(dot);
    dots.push(dot);
  }

  let timer: number | undefined;
  rail.addEventListener('scroll', () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = window.setTimeout(() => {
      const cards = rail.querySelectorAll<HTMLElement>('[data-tour-card]');
      if (!cards.length) return;
      const railLeft = rail.getBoundingClientRect().left;
      let closest = 0, minDist = Infinity;
      cards.forEach((el, i) => {
        const dist = Math.abs(el.getBoundingClientRect().left - railLeft);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      const idx = Math.min(closest, dots.length - 1);
      dots.forEach((dot, i) => dot.classList.toggle('cat-dot--active', i === idx));
    }, 50);
  }, { passive: true });

  return wrap;
}
