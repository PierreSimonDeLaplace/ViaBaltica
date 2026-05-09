export interface Env {
  GOOGLE_API_KEY: string;
  GOOGLE_PLACE_ID: string;
  ASSETS?: Fetcher; // provided in production; Vite plugin handles assets in dev
}

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
}

interface GooglePlaceResult {
  rating: number;
  user_ratings_total: number;
  reviews?: GoogleReview[];
}

interface GooglePlacesResponse {
  status: string;
  result: GooglePlaceResult;
}

const CORS: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const FIELDS = 'rating,user_ratings_total,reviews';

async function handleReviews(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url  = new URL(request.url);
  const lang = url.searchParams.get('lang') === 'pl' ? 'pl' : 'en';

  const cacheKey = new Request(`https://cache.internal/reviews/${lang}`);
  const cache    = caches.default;

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  apiUrl.searchParams.set('place_id', env.GOOGLE_PLACE_ID);
  apiUrl.searchParams.set('fields',   FIELDS);
  apiUrl.searchParams.set('reviews_sort', 'newest');
  apiUrl.searchParams.set('language', lang);
  apiUrl.searchParams.set('key',      env.GOOGLE_API_KEY);

  let apiRes: Response;
  try {
    apiRes = await fetch(apiUrl.toString());
  } catch (err) {
    return new Response(JSON.stringify({ error: 'fetch_failed', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const data = await apiRes.json() as GooglePlacesResponse;

  if (data.status !== 'OK') {
    return new Response(JSON.stringify({ error: data.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const { result } = data;
  const payload = JSON.stringify({
    rating:  result.rating,
    total:   result.user_ratings_total,
    reviews: (result.reviews ?? []).filter(r => r.text?.trim()).slice(0, 5).map(r => ({
      author: r.author_name,
      rating: r.rating,
      text:   r.text,
      time:   r.relative_time_description,
      avatar: r.profile_photo_url,
    })),
  });

  const response = new Response(payload, {
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'public, max-age=14400, s-maxage=86400',
      ...CORS,
    },
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (pathname === '/api/reviews') {
      return handleReviews(request, env, ctx);
    }

    return env.ASSETS
      ? env.ASSETS.fetch(request)
      : new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
