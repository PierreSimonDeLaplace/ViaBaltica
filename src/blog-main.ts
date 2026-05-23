import './styles/reset.css';
import './styles/tokens.css';
import './styles/buttons.css';
import './styles/badge.css';

import { mount as mountNav }    from './components/nav/nav';
import { mount as mountBlog }   from './components/blog/blog';
import { mount as mountFooter } from './components/footer/footer';

import { initTheme } from './scripts/theme';
import { initI18n }  from './scripts/i18n';

const main = document.querySelector<HTMLElement>('main');
if (!main) throw new Error('blog-main.ts: <main> element not found in blog.html');

mountNav();
mountBlog(main);
mountFooter();
initTheme();
initI18n();
