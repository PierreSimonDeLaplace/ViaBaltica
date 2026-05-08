# ViaBaltica — Project Rules

Vite + TypeScript SPA, Cloudflare Workers. Tour guide Mark Jeziak, Gdańsk.

## CSS tokens
Never hardcode colours, fonts, shadows, or spacing in component files. All values live in `src/styles/tokens.css`. Add missing tokens there (with a `[data-theme="light"]` variant if needed). Theme overrides go in `tokens.css` only — never in component files.

Always append a generic fallback after font tokens:
```
font-family: var(--font-serif), serif;
font-family: var(--font-sans), sans-serif;
```

## i18n
Never put visible text in HTML or TS. All copy lives in `src/locales/en.json` and `src/locales/pl.json` — adding a key to one requires adding it to the other immediately.

- `data-i18n="key"` — text content; `data-i18n-html="key"` — innerHTML (only for `<br>`/`<em>`)
- Key format: `section.subkey` lowercase dot-separated (`reviews.r1.text`, `hero.heading`)
- `?debug=true` surfaces bare keys — use to catch untranslated strings

## Project structure
- `src/assets/` — everything imported by code (Vite hashes + optimises it)
- `public/` — only files needing a stable URL: `favicon.ico`, `robots.txt`, OG image
- One component = one folder: `<name>.ts` + `<name>.html` + `<name>.css`. Child pieces go in the same folder (e.g. `drawer.ts`), not a new top-level folder.
- Gallery images: `NN.jpg` (full ~1600px) + `NN-thumb.jpg` (~400px). Loader matches by `-thumb` suffix.

## Code quality
Clean, minimal code — no unused variables, no dead branches, no comments restating what the code says. One function, one responsibility. Never use `any` to silence a TypeScript error.

## SEO
- One `<h1>` per page; heading hierarchy (`h1→h2→h3`) must be logical, never skip levels.
- `<title>` and `<meta name="description">` reflect the active language.
- Anchor text is always descriptive — never "click here".
- `application/ld+json` with `LocalBusiness` or `TouristAttraction` schema for rich Google results.

## Accessibility
- Every `<img>` has `alt`; decorative images use `alt=""`.
- Icon-only buttons and links have `aria-label`.
- Colour contrast meets WCAG AA on both themes.
- All interactive elements keyboard-reachable; tab order follows visual order.
- Overlays trap focus while open, restore it on close; ESC always closes them.
- Use semantic HTML (`<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) — free SEO and a11y signal.

## UI/UX
- Whitespace is content — don't tighten spacing to fit more on screen.
- Every interactive element has a visible hover and focus state.
- Transitions: 0.2s colour/border, 0.3–0.45s layout (drawers, accordions).
- Mobile-first: 375px test, tap targets ≥ 44×44px, primary CTA reachable without scrolling.
- `loading="lazy"` on all below-fold images; hero stays eager.
- Serif (`--font-serif`) for headlines and prices; sans (`--font-sans`) for UI and body. Never mix within one element.
