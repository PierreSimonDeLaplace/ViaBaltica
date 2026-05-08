import 'photoswipe/style.css';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

const allUrls = import.meta.glob<string>(
  '../../assets/gallery/**/*.{jpg,jpeg,png,webp}',
  { eager: true, query: '?url', import: 'default' },
);

export interface GalleryItem { thumb: string; full: string; }

export function getGalleryImages(folder: string): GalleryItem[] {
  const prefix = `../../assets/gallery/${folder}/`;
  const fulls: Record<string, string> = {};
  const thumbs: Record<string, string> = {};

  for (const [path, url] of Object.entries(allUrls)) {
    if (!path.startsWith(prefix)) continue;
    const filename = path.slice(prefix.length);
    const m = filename.match(/^(.+)-thumb(\.[^.]+)$/);
    if (m) thumbs[m[1] + m[2]] = url;
    else    fulls[filename]      = url;
  }

  return Object.keys(fulls).sort().map(key => ({
    full:  fulls[key],
    thumb: thumbs[key] ?? fulls[key],
  }));
}

let activeLightbox: PhotoSwipeLightbox | null = null;

export function destroyGallery(): void {
  activeLightbox?.destroy();
  activeLightbox = null;
}

export function initGalleryLightbox(srcs: string[]): void {
  destroyGallery();
  activeLightbox = new PhotoSwipeLightbox({
    dataSource: srcs.map(src => ({ src, width: 1600, height: 1067 })),
    pswpModule: () => import('photoswipe'),
  });
  activeLightbox.init();
}

export function openGalleryAt(index: number): void {
  activeLightbox?.loadAndOpen(index);
}
