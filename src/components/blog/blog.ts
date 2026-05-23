import { getString, type Locale, type SupportedLang } from '../../types/locale';
import { onLanguageChange } from '../../scripts/i18n';
import { marked } from 'marked';
import './blog.css';

interface PostTranslation {
  title:   string;
  excerpt: string;
  content: string;
}

interface Post {
  slug:  string;
  date:  string;
  image: string;
  en:    PostTranslation;
  pl:    PostTranslation;
}

const postModules = import.meta.glob<{ default: Post }>('../../data/blog/*.json', { eager: true });
const posts: Post[] = Object.values(postModules)
  .map(m => m.default)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string, lang: SupportedLang): string {
  return new Date(iso).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function renderList(container: HTMLElement, dict: Locale, lang: SupportedLang): void {
  container.innerHTML = `
    <section class="blog-listing">
      <div class="blog-listing-header">
        <span class="badge">${getString(dict, 'blog.badge', 'Blog')}</span>
        <h1>${getString(dict, 'blog.heading', "From Mark's Notebook")}</h1>
      </div>
      <div class="blog-grid">
        ${posts.length === 0
          ? `<p class="blog-empty">${getString(dict, 'blog.empty', 'No posts yet.')}</p>`
          : posts.map(p => {
              const t = p[lang] ?? p.en;
              const img = p.image
                ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(t.title)}" loading="lazy">`
                : '';
              return `
                <a href="/blog/${escapeHtml(p.slug)}" class="blog-card">
                  <div class="blog-card-image">${img}</div>
                  <div class="blog-card-body">
                    <time class="blog-card-date">${formatDate(p.date, lang)}</time>
                    <h2 class="blog-card-title">${escapeHtml(t.title)}</h2>
                    <p class="blog-card-excerpt">${escapeHtml(t.excerpt)}</p>
                    <span class="blog-card-cta" aria-hidden="true">${getString(dict, 'blog.read_more', 'Read more →')}</span>
                  </div>
                </a>`;
            }).join('')
        }
      </div>
    </section>`;
}

function renderPost(container: HTMLElement, post: Post, dict: Locale, lang: SupportedLang): void {
  const t = post[lang] ?? post.en;

  container.innerHTML = `
    <article class="blog-post">
      <div class="blog-post-body">
        <a href="/blog" class="blog-back">${getString(dict, 'blog.back', '← All posts')}</a>
        <header class="blog-post-header">
          <time class="blog-post-date">${formatDate(post.date, lang)}</time>
          <h1 class="blog-post-title">${escapeHtml(t.title)}</h1>
        </header>
        <div class="post-content">${marked.parse(t.content, { async: false })}</div>
      </div>
    </article>`;
}

export function mount(target: HTMLElement): void {
  const slug = window.location.pathname.split('/blog/')[1]?.replace(/\/$/, '') || null;
  const post = slug ? (posts.find(p => p.slug === slug) ?? null) : null;

  const container = document.createElement('div');
  container.className = 'blog-page';
  target.appendChild(container);

  if (slug && !post) {
    container.innerHTML = `<p class="blog-not-found">Post not found.</p>`;
    return;
  }

  onLanguageChange((lang, dict) => {
    if (post) {
      renderPost(container, post, dict, lang);
    } else {
      renderList(container, dict, lang);
    }
  });
}
