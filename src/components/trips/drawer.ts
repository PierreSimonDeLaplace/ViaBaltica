import './drawer.css';
import type { TripEntry } from '../../types/trips';
import { I18N_DEBUG, d } from '../../scripts/i18n';

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
    if (target.closest('.drawer-back') || target.closest('.drawer-cta-mobile')) return;
    closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentTripId) closeDrawer();
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

  drawerEl.querySelector<HTMLElement>('.drawer-close')?.focus();
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

function renderContent(trip: TripEntry, bookLabel: string): void {
  drawerEl.innerHTML = `
    <button class="drawer-close" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <div class="drawer-hero" style="background:${trip.color}">
      <img class="drawer-hero-img" src="${trip.banner}" alt="${trip.title}" loading="lazy" />
    </div>

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
      <a href="#contact" class="btn-primary drawer-cta">${bookLabel}</a>
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

  drawerEl.querySelector('.drawer-close')?.addEventListener('click', closeDrawer);
  drawerEl.querySelector('.drawer-back')?.addEventListener('click', closeDrawer);
  drawerEl.querySelector('.drawer-cta')?.addEventListener('click', _close);
  drawerEl.querySelector('.drawer-cta-mobile')?.addEventListener('click', _close);
}
