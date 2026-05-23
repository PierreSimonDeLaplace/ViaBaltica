import {defineConfig, type Plugin} from 'vite';
import {cloudflare} from '@cloudflare/vite-plugin';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

function parseDevVars(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(
    readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter(line => line.includes('=') && !line.startsWith('#'))
      .map(line => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      }),
  );
}

function devReviewsProxy(): Plugin {
  return {
    name: 'dev-reviews-proxy',
    enforce: 'pre',
    configureServer(server) {
      const vars = parseDevVars(resolve(__dirname, '.dev.vars'));
      const FIELDS = 'rating,user_ratings_total,reviews';

      server.middlewares.use('/api/reviews', async (req, res) => {
        const url = new URL(`http://localhost${req.url ?? '/'}`);
        const lang = url.searchParams.get('lang') === 'pl' ? 'pl' : 'en';

        const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        apiUrl.searchParams.set('place_id', vars['GOOGLE_PLACE_ID'] ?? '');
        apiUrl.searchParams.set('fields', FIELDS);
        apiUrl.searchParams.set('reviews_sort', 'most_relevant');
        apiUrl.searchParams.set('language', lang);
        apiUrl.searchParams.set('key', vars['GOOGLE_API_KEY'] ?? '');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        interface GReview {
          author_name: string;
          rating: number;
          text: string;
          relative_time_description: string;
          profile_photo_url: string;
        }

        interface GPlacesResponse {
          status: string;
          result: { rating: number; user_ratings_total: number; reviews?: GReview[] };
        }

        try {
          const apiRes = await fetch(apiUrl.toString());
          const data = await apiRes.json() as GPlacesResponse;

          if (data.status !== 'OK') {
            res.statusCode = 502;
            res.end(JSON.stringify({error: data.status}));
            return;
          }

          const {result} = data;
          res.end(JSON.stringify({
            rating: result.rating,
            total: result.user_ratings_total,
            reviews: (result.reviews ?? []).filter(r => r.text?.trim()).slice(0, 5).map(r => ({
              author: r.author_name,
              rating: r.rating,
              text: r.text,
              time: r.relative_time_description,
              avatar: r.profile_photo_url,
            })),
          }));
        } catch (err) {
          res.statusCode = 502;
          res.end(JSON.stringify({error: 'fetch_failed', detail: String(err)}));
        }
      });
    },
  };
}

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            blog: resolve(__dirname, 'blog.html'),
          },
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  plugins: [devReviewsProxy(), cloudflare()],
});
