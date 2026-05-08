import './drawer.css';
import type { TripEntry } from '../../types/trips';
import { I18N_DEBUG, d } from '../../scripts/i18n';
import {
  getGalleryImages,
  initGalleryLightbox,
  openGalleryAt,
  destroyGallery,
  type GalleryItem,
} from './gallery';

export function renderTags(tags: string[]): string {
  return I18N_DEBUG
    ? tags.map((_, i) => `<span class="trip-tag">trip.tags[${i}]</span>`).join('')
    : tags.map(t => `<span class="trip-tag">${t}</span>`).join('');
}

let overlayEl: HTMLElement;
let drawerEl:  HTMLElement;
let currentTripId: string | null = null;
let lastFocused:   Element | null = null;

export function initDrawer(): void {
  overlayEl = document.createElement('div');
  overlayEl.className = 'trip-detail-overlay';

  drawerEl = document.createElement('aside');
  drawerEl.className  = 'trip-detail-drawer';
  drawerEl.setAttribute('role',       'dialog');
  drawerEl.setAttribute('aria-modal', 'true');

  document.body.append(overlayEl, drawerEl);

  overlayEl.addEventListener('click', closeDrawer);

  drawerEl.addEventListener('click', (e) => {
    if (window.innerWidth >= 560) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('.drawer-back')        ||
      target.closest('.drawer-cta-mobile')  ||
      target.closest('.drawer-hero--collage')
    ) return;
    closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentTripId) {
      if (document.querySelector('.pswp--open')) return;
      closeDrawer();
    }
  });

  window.addEventListener('popstate', () => {
    if (!new URLSearchParams(location.search).has('trip') && currentTripId) _close();
  });
}

export function openDrawer(trip: TripEntry, bookLabel: string): void {
  lastFocused   = document.activeElement;
  currentTripId = trip.id;

  renderContent(trip, bookLabel);

  overlayEl.classList.add('open');
  drawerEl.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (!new URLSearchParams(location.search).has('trip')) {
    history.pushState({ trip: trip.id }, '', `?trip=${encodeURIComponent(trip.id)}`);
  }
}

export function refreshIfOpen(
  resolveTrip: (id: string) => TripEntry | undefined,
  bookLabel: string,
): void {
  if (!currentTripId) return;
  const trip = resolveTrip(currentTripId);
  if (trip) renderContent(trip, bookLabel);
}

export function closeDrawer(): void {
  if (!currentTripId) return;
  _close();
  if (new URLSearchParams(location.search).has('trip')) {
    const params = new URLSearchParams(location.search);
    params.delete('trip');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
  }
}

function _close(): void {
  currentTripId = null;
  drawerEl.classList.remove('open');
  overlayEl.classList.remove('open');
  document.body.style.overflow = '';
  (lastFocused as HTMLElement | null)?.focus();
}

function buildSimpleHero(trip: TripEntry): string {
  return `
    <div class="drawer-hero">
      ${trip.badge ? `<div class="trip-ribbon trip-ribbon--${trip.badge}">${trip.badge}</div>` : ''}
      <img class="drawer-hero-img" src="${trip.banner}" alt="${trip.title}" loading="lazy" />
    </div>`;
}

function buildCollageHero(trip: TripEntry, images: GalleryItem[]): string {
  // lightbox indices: 0 = banner, 1 = images[0], 2 = images[1], ...
  const totalCount = 1 + images.length;
  const moreCount  = Math.max(0, totalCount - 3);

  return `
    <div class="drawer-hero drawer-hero--collage">
      ${trip.badge ? `<div class="trip-ribbon trip-ribbon--${trip.badge}">${trip.badge}</div>` : ''}
      <button type="button" class="drawer-hero-main" data-pswp-index="0" aria-label="View photos">
        <img src="${trip.banner}" alt="${trip.title}" loading="lazy" />
      </button>
      <div class="drawer-hero-side">
        <button type="button" class="drawer-hero-thumb" data-pswp-index="1" aria-label="View photo 1">
          <img src="${images[0].thumb}" alt="" loading="lazy" />
        </button>
        ${images.length >= 2 ? `
        <button type="button" class="drawer-hero-thumb" data-pswp-index="2" aria-label="${moreCount > 0 ? `View all ${totalCount} photos` : 'View photo 2'}">
          <img src="${images[1].thumb}" alt="" loading="lazy" />
          ${moreCount > 0 ? `<span class="drawer-hero-more">+${moreCount}</span>` : ''}
        </button>` : ''}
      </div>
    </div>`;
}

function renderContent(trip: TripEntry, bookLabel: string): void {
  destroyGallery();

  const galleryImages = trip.gallery ? getGalleryImages(trip.gallery) : [];
  const hasGallery    = galleryImages.length > 0;

  drawerEl.innerHTML = `
    ${hasGallery ? buildCollageHero(trip, galleryImages) : buildSimpleHero(trip)}

    <div class="drawer-content">
      <div class="drawer-tags">${renderTags(trip.tags)}</div>
      <h2 class="drawer-title">${d(trip.title, 'trip.title')}</h2>
      <div class="drawer-meta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        ${d(trip.meta, 'trip.meta')}
      </div>
      <p class="drawer-body">${d(trip.body, 'trip.body')}</p>
    </div>

    <div class="drawer-cta-area">
      <div class="drawer-cta-row">
        ${trip.price ? `
          <div class="drawer-price">
            <span class="drawer-price-from">${trip.price.split(/\s(.+)/)[0]}</span>
            <span class="drawer-price-amount">${trip.price.split(/\s(.+)/)[1]}</span>
          </div>` : ''}
        <a href="#contact" class="btn-primary drawer-cta">${bookLabel}</a>
      </div>
    </div>

    <div class="drawer-bottombar">
      <button class="drawer-back" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        <span>Back</span>
      </button>
      <a href="#contact" class="btn-primary drawer-cta-mobile">${bookLabel}</a>
    </div>`;

  drawerEl.querySelector('.drawer-back')?.addEventListener('click', closeDrawer);
  drawerEl.querySelector('.drawer-cta')?.addEventListener('click', _close);
  drawerEl.querySelector('.drawer-cta-mobile')?.addEventListener('click', _close);

  if (hasGallery) {
    const srcs = [trip.banner, ...galleryImages.map(img => img.full)];
    initGalleryLightbox(srcs);

    drawerEl.querySelector('.drawer-hero--collage')?.addEventListener('click', (e) => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-pswp-index]');
      if (!cell) return;
      openGalleryAt(Number(cell.dataset.pswpIndex));
    });
  }
}
