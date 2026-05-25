import { getString, type Locale, type SupportedLang } from '../../types/locale';
import { onLanguageChange } from '../../scripts/i18n';
import { escapeHtml } from '../../scripts/dom';
import { marked, type Tokens } from 'marked';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import '../../styles/polaroid.css';
import './blog.css';

/* ── ::youtube[VIDEO_ID] shortcode ───────────────────────────────────────── */
marked.use({
  extensions: [{
    name:  'youtube',
    level: 'block' as const,
    start: (src: string) => src.indexOf('::youtube['),
    tokenizer(src: string): Tokens.Generic | undefined {
      const m = src.match(/^::youtube\[([A-Za-z0-9_-]+)\]/);
      if (m) return { type: 'youtube', raw: m[0], id: m[1] };
      return undefined;
    },
    renderer(token: Tokens.Generic): string {
      return `<div class="post-video-wrap">` +
        `<iframe src="https://www.youtube-nocookie.com/embed/${token['id'] as string}"` +
        ` title="YouTube video" loading="lazy"` +
        ` allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` +
        ` allowfullscreen></iframe>` +
        `</div>\n`;
    },
  }],
});

let pswpLightbox: PhotoSwipeLightbox | null = null;

interface PostTranslation {
  title: string;
  excerpt: string;
  content: string;
}

interface Post {
  slug: string;
  date: string;
  image: string;
  ratio?: number;    // width / height; drives the polaroid card proportions
  caption?: string;   // handwritten-style caption on the polaroid
  location?: string;   // small location label below the caption
  gallery?: string[];
  en: PostTranslation;
  pl: PostTranslation;
}

const postModules = import.meta.glob<{ default: Post }>('../../data/blog/*.json', {eager: true});
const posts: Post[] = Object.values(postModules)
  .map(m => m.default)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

function formatDate(iso: string, lang: SupportedLang): string {
  return new Date(iso).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function calcReadTime(content: string, dict: Locale): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} ${getString(dict, 'blog.min_read', 'min read')}`;
}

/** Returns [width, height] for a polaroid photo given its aspect ratio and longest-edge cap. */
function polaroidDims(ratio: number, maxDim: number): [number, number] {
  return ratio >= 1
    ? [maxDim, Math.round(maxDim / ratio)]
    : [Math.round(maxDim * ratio), maxDim];
}

function renderList(container: HTMLElement, dict: Locale, lang: SupportedLang): void {
  container.innerHTML = `
    <section class="blog-listing">
      <div class="blog-listing-header">
        <span class="eyebrow">${getString(dict, 'blog.badge', 'Blog')}</span>
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
  pswpLightbox?.destroy();
  pswpLightbox = null;

  const t = post[lang] ?? post.en;
  const ratio = post.ratio ?? 4 / 3;

  // Compute photo dimensions for both breakpoints so CSS can switch via custom properties.
  // Desktop: landscape cap = 420 px, portrait cap = 340 px.
  // Mobile:  landscape cap = 290 px, portrait cap = 240 px.
  const [dW, dH] = polaroidDims(ratio, ratio >= 1 ? 420 : 340);
  const [mW, mH] = polaroidDims(ratio, ratio >= 1 ? 290 : 240);

  const captionHtml = (post.caption || post.location)
    ? `<div class="polaroid-caption" aria-hidden="true">
        ${post.caption ? `<span class="polaroid-caption-text">${escapeHtml(post.caption)}</span>` : ''}
        ${post.location ? `<span class="polaroid-location">${escapeHtml(post.location)}</span>` : ''}
      </div>`
    : '';

  const headerHtml = post.image
    ? `<div class="blog-post-banner">
        <div class="polaroid-wrap">
          <div class="polaroid"
               style="--photo-w:${dW}px;--photo-h:${dH}px;--photo-w-m:${mW}px;--photo-h-m:${mH}px">
            <div class="polaroid-tape" aria-hidden="true"></div>
            <div class="polaroid-photo">
              <img src="${escapeHtml(post.image)}" alt="${escapeHtml(t.title)}"
                   loading="eager" fetchpriority="high">
            </div>
            ${captionHtml}
          </div>
        </div>
        <div class="blog-post-titleblock">
          <time class="blog-post-date">${formatDate(post.date, lang)}</time>
          <h1 class="blog-post-title">${escapeHtml(t.title)}</h1>
          <p class="blog-post-dek">${escapeHtml(t.excerpt)}</p>
          <div class="blog-post-meta">
            <span>${calcReadTime(t.content, dict)}</span>
            <span class="blog-post-meta-dot" aria-hidden="true"></span>
            <span>${getString(dict, 'blog.by', 'By')} Mark Jeziak</span>
          </div>
        </div>
      </div>`
    : `<header class="blog-post-header">
        <time class="blog-post-date">${formatDate(post.date, lang)}</time>
        <h1 class="blog-post-title">${escapeHtml(t.title)}</h1>
      </header>`;

  const galleryHtml = post.gallery?.length
    ? `<div class="post-gallery pswp-gallery">
        ${post.gallery.map((src, i) =>
      `<a href="${escapeHtml(src)}">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(t.title)} — photo ${i + 1}" loading="lazy">
          </a>`
    ).join('')}
      </div>`
    : '';

  const bannerSection = post.image
    ? `<div class="blog-post-banner-wrap">
        <a href="/blog" class="blog-back">${getString(dict, 'blog.back', '← All posts')}</a>
        ${headerHtml}
      </div>`
    : '';

  const fallbackHeader = !post.image
    ? `<a href="/blog" class="blog-back">${getString(dict, 'blog.back', '← All posts')}</a>
       ${headerHtml}`
    : '';

  container.innerHTML = `
    <article class="blog-post">
      ${bannerSection}
      <div class="blog-post-body">
        ${fallbackHeader}
        <div class="post-content">${marked.parse(t.content, {async: false})}</div>
        ${galleryHtml}
      </div>
    </article>`;

  const galleryEl = container.querySelector<HTMLElement>('.pswp-gallery');
  if (!galleryEl) return;

  pswpLightbox = new PhotoSwipeLightbox({
    gallery: galleryEl,
    children: 'a',
    pswpModule: () => import('photoswipe'),
  });

  pswpLightbox.addFilter('domItemData', (itemData, _element, linkEl) => {
    const img = linkEl?.querySelector<HTMLImageElement>('img');
    itemData.src = linkEl?.href ?? '';
    itemData.w = img?.naturalWidth ?? 0;
    itemData.h = img?.naturalHeight ?? 0;
    itemData.msrc = img?.src;
    itemData.alt = img?.alt;
    return itemData;
  });

  pswpLightbox.init();
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
