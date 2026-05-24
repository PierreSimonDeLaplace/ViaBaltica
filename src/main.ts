import './styles/reset.css';
import './styles/tokens.css';
import './styles/buttons.css';
import './styles/badge.css';

import { mount as mountNav }     from './components/nav/nav';
import { mount as mountHero }    from './components/hero/hero';
import { mount as mountAbout }   from './components/about/about';
import { mount as mountTrips }   from './components/trips/trips';
import { mount as mountReviews } from './components/reviews/reviews';
import { mount as mountFaq }     from './components/faq/faq';
import { mount as mountContact } from './components/contact/contact';
import { mount as mountFooter }  from './components/footer/footer';

import { initTheme } from './scripts/theme';
import { initI18n }  from './scripts/i18n';

const main = document.querySelector<HTMLElement>('main');
if (!main) throw new Error('main.ts: <main> element not found in index.html');

mountNav();
mountHero(main);
mountAbout(main);
mountTrips(main);
mountReviews(main);
mountFaq(main);
mountContact(main);
mountFooter();
initTheme();
initI18n();
