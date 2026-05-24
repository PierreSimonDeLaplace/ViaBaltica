import './drawer.css';
import type { TripEntry } from '../../types/trips';
import { I18N_DEBUG } from '../../scripts/i18n';
import { getGalleryImages, destroyGallery, initGalleryLightbox, openGalleryAt } from './gallery';

/* ── Public types ─────────────────────────────────────────────────────────── */

export interface DrawerStrings {
  book:             string;
  drawerLabel:      string;
  drawerClose:      string;
  fromGroup:        string;
  highlights:       string;
  cancellation:     string;
  cancellationNote: string;
  from:             string;
}

export function renderTags(tags: string[]): string {
  return I18N_DEBUG
    ? tags.map((_, i) => `<span class="trip-tag">trip.tags[${i}]</span>`).join('')
    : tags.map(t => `<span class="trip-tag">${t}</span>`).join('');
}

/* ── Module state ─────────────────────────────────────────────────────────── */

let overlayEl: HTMLElement;
let drawerEl: HTMLElement;
let currentSlug: string | null = null;
let lastFocused: Element | null = null;
let storedStrings: DrawerStrings = {
  book:             'Book this tour',
  drawerLabel:      'Tour detail',
  drawerClose:      'Close',
  fromGroup:        'From / group',
  highlights:       "What we'll see",
  cancellation:     'Free cancellation up to 48h.',
  cancellationNote: 'No upfront payment — confirmation by email.',
  from:             'from',
};
let resolveFn: ((slug: string) => TripEntry | undefined) | null = null;

/* ── Init ─────────────────────────────────────────────────────────────────── */

export function initDrawer(): void {
  overlayEl = document.createElement('div');
  overlayEl.className = 'trip-detail-overlay';
  overlayEl.setAttribute('aria-hidden', 'true');

  drawerEl = document.createElement('aside');
  drawerEl.className = 'trip-detail-drawer';
  drawerEl.setAttribute('role', 'dialog');
  drawerEl.setAttribute('aria-modal', 'true');
  drawerEl.setAttribute('aria-labelledby', 'tour-drawer-title');

  document.body.append(overlayEl, drawerEl);

  overlayEl.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentSlug) closeDrawer();
  });

  window.addEventListener('hashchange', () => {
    const slug = hashSlug();
    if (!slug && currentSlug) {
      _close();
    } else if (slug && slug !== currentSlug && resolveFn) {
      const trip = resolveFn(slug);
      if (trip) _open(trip);
    }
  });
}

/* ── Public API ───────────────────────────────────────────────────────────── */

export function openDrawer(trip: TripEntry, strings: DrawerStrings): void {
  storedStrings = strings;
  lastFocused   = document.activeElement;

  const next = `#tour=${trip.slug}`;
  if (location.hash !== next) history.pushState({ tour: trip.slug }, '', next);
  _open(trip);
}

export function refreshIfOpen(
  resolveTrip: (slug: string) => TripEntry | undefined,
  strings: DrawerStrings,
): void {
  resolveFn     = resolveTrip;
  storedStrings = strings;
  if (!currentSlug) return;
  const trip = resolveTrip(currentSlug);
  if (trip) renderContent(trip);
}

export function closeDrawer(): void {
  if (!currentSlug) return;
  if (location.hash.startsWith('#tour=')) {
    history.pushState({}, '', location.pathname + location.search);
  }
  _close();
}

/* ── Internals ────────────────────────────────────────────────────────────── */

function hashSlug(): string | null {
  const m = location.hash.match(/^#tour=([\w-]+)/);
  return m ? m[1] : null;
}

function _open(trip: TripEntry): void {
  currentSlug = trip.slug;
  renderContent(trip);
  overlayEl.classList.add('open');
  drawerEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    drawerEl.querySelector<HTMLElement>('.drawer-close')?.focus();
  });
}

function _close(): void {
  currentSlug = null;
  drawerEl.classList.remove('open');
  overlayEl.classList.remove('open');
  document.body.style.overflow = '';
  (lastFocused as HTMLElement | null)?.focus();
}

interface Photo { src: string; thumb: string; alt: string; }

function buildPhotoList(trip: TripEntry): Photo[] {
  const photos: Photo[] = [{ src: trip.banner, thumb: trip.banner, alt: trip.title }];
  if (trip.gallery) {
    getGalleryImages(trip.gallery).forEach((img, i) => {
      photos.push({ src: img.full, thumb: img.thumb, alt: `${trip.title} — photo ${i + 2}` });
    });
  }
  return photos;
}

function renderContent(trip: TripEntry): void {
  destroyGallery();
  const s = storedStrings;
  const photos = buildPhotoList(trip);
  let activeIndex = 0;

  drawerEl.innerHTML = buildHTML(trip, s, photos);

  // Close
  drawerEl.querySelector('.drawer-close')?.addEventListener('click', closeDrawer);

  // Book CTAs — close drawer, scroll to contact
  drawerEl.querySelectorAll('.drawer-book-cta').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Gallery — PhotoSwipe lightbox + thumbnail strip
  if (photos.length > 0) {
    initGalleryLightbox(photos.map(p => p.src));

    const mainWrap = drawerEl.querySelector<HTMLElement>('.drawer-gallery-main-wrap');
    const mainImg  = drawerEl.querySelector<HTMLImageElement>('.drawer-gallery-main');
    const counter  = drawerEl.querySelector<HTMLElement>('.drawer-gallery-counter');

    // Click main photo → open lightbox at current active photo
    mainWrap?.addEventListener('click', () => openGalleryAt(activeIndex));

    // Thumbnail clicks → swap main photo + keep lightbox index in sync
    drawerEl.querySelectorAll<HTMLButtonElement>('.drawer-thumb-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        activeIndex = i;
        if (mainImg) { mainImg.src = btn.dataset.src ?? ''; mainImg.alt = btn.dataset.alt ?? ''; }
        if (counter) counter.textContent = `${i + 1} / ${photos.length}`;
        drawerEl.querySelectorAll('.drawer-thumb-btn').forEach((b, j) => {
          b.classList.toggle('drawer-thumb-btn--active', j === i);
        });
      });
    });
  }
}

function buildHTML(
  trip: TripEntry,
  s: DrawerStrings,
  photos: Photo[],
): string {
  if (I18N_DEBUG) {
    return `<div class="drawer-debug">
      <p>trips.drawer_label</p><p>${trip.slug}</p>
    </div>`;
  }

  const photo = photos[0];

  const priceHTML = trip.price !== undefined ? `
    <div class="drawer-price">
      <div class="drawer-price-label">${s.fromGroup}</div>
      <div class="drawer-price-amount">€${trip.price}</div>
    </div>` : '';

  const highlightsHTML = trip.highlights?.length ? `
    <div class="drawer-highlights">
      <h3 class="drawer-highlights-title">${s.highlights}</h3>
      <ul class="drawer-highlights-list">
        ${trip.highlights.map(h => `
          <li>
            <span class="drawer-check" aria-hidden="true">✓</span>
            <span>${h}</span>
          </li>`).join('')}
      </ul>
    </div>` : '';

  const groupHTML = trip.group
    ? `<span>${trip.group}</span>`
    : '';

  const longDesc = (trip.longDescription ?? trip.body).replace(/\n/g, '\n');

  return `
    <div class="drawer-handle" aria-hidden="true"><span></span></div>

    <div class="drawer-topbar">
      <span class="drawer-topbar-label">${s.drawerLabel}</span>
      <button type="button" class="drawer-close" aria-label="${s.drawerClose}">×</button>
    </div>

    <div class="drawer-body">
      <div class="drawer-gallery">
        <div class="drawer-gallery-main-wrap${photos.length > 1 ? ' drawer-gallery-main-wrap--zoomable' : ''}">
          <img class="drawer-gallery-main" src="${photo.src}" alt="${photo.alt}" />
          <span class="drawer-gallery-counter">1 / ${photos.length}</span>
        </div>
        ${photos.length > 1 ? `
        <div class="drawer-thumbnails">
          ${photos.map((p, i) => `
            <button type="button"
              class="drawer-thumb-btn${i === 0 ? ' drawer-thumb-btn--active' : ''}"
              data-src="${p.src}" data-alt="${p.alt}"
              aria-label="Photo ${i + 1}">
              <img src="${p.thumb}" alt="" loading="lazy" />
            </button>`).join('')}
        </div>` : ''}
      </div>

      <div class="drawer-content">
        <div class="drawer-tags">${renderTags(trip.tags)}</div>
        <h2 id="tour-drawer-title" class="drawer-title">${trip.title}</h2>
        <div class="drawer-meta">
          <span class="drawer-meta-clock">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
            </svg>
            ${trip.duration}
          </span>
          <span>${trip.location}</span>
          ${groupHTML}
        </div>
        <p class="drawer-description">${longDesc}</p>
        ${highlightsHTML}
        <div class="drawer-cancellation">
          <strong>${s.cancellation}</strong> ${s.cancellationNote}
        </div>
      </div>
    </div>

    <div class="drawer-bookbar">
      ${priceHTML}
      <a href="#contact" class="drawer-book-cta btn-primary">${s.book} →</a>
    </div>`;
}
