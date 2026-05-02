/**
 * App entry point.
 *
 * Order matters:
 *   1. Mount all components so the DOM contains every `data-i18n` and
 *      `.theme-btn`/`.lang-btn` element.
 *   2. Initialise theme and i18n — both query the DOM, so they need step 1
 *      to have happened first.
 */

import './styles/reset.css';
import './styles/tokens.css';
import './styles/buttons.css';
import './styles/badge.css';

import { mount as mountNav }     from './components/nav/nav';
import { mount as mountHero }    from './components/hero/hero';
import { mount as mountAbout }   from './components/about/about';
import { mount as mountTrips }   from './components/trips/trips';
import { mount as mountReviews } from './components/reviews/reviews';

import { initTheme } from './scripts/theme';
import { initI18n }  from './scripts/i18n';

const main = document.querySelector<HTMLElement>('main');
if (!main) throw new Error('main.ts: <main> element not found in index.html');

mountNav();
mountHero(main);
mountAbout(main);
mountTrips(main);
mountReviews(main);

initTheme();
void initI18n();
