/**
 * Blog Analytics Utility (Cabin)
 *
 * Fetches blog traffic from the Cabin analytics API at BUILD TIME and normalizes
 * it for the Writing page. The site is static and the API key is secret, so this
 * never runs in the browser: numbers are baked into the HTML at `npm run build`
 * and reflect "as of last build".
 *
 * Cabin tracks `blog.damato.design` (the blog that the Writing collection links
 * out to; see content.config.ts). We join Cabin's per-page rows to our posts by
 * path, since each post's canonical URL is `${siteUrl}/posts/<slug>` and Cabin
 * reports paths like `/posts/<slug>`.
 *
 * Resilience is deliberate: any failure (missing key, network, non-200, rate
 * limit, unexpected shape) resolves to `null` so the build stays green and the
 * Writing page renders exactly as it did before analytics existed. Cabin being
 * down must never break a deploy.
 *
 * The API key comes from `process.env.CABIN_API_KEY`, supplied by the host's
 * build environment (Netlify). This project uses no `.env` files, and the key is
 * deliberately not `PUBLIC_`-prefixed, so it never reaches the client.
 *
 * @module analytics
 */

/** Cabin API endpoint (PRO accounts only). */
const CABIN_API_URL = 'https://api.withcabin.com/v1/analytics';

/** Domain to report on (the blog the Writing page links out to). */
const CABIN_DOMAIN = 'blog.damato.design';

/**
 * Earliest date to include. The blog predates any single year we'd hardcode
 * loosely, so this is an intentionally early floor to capture "all-time".
 */
const ALL_TIME_FROM = '2018-01-01';

/**
 * Minimum reads before a per-article stat is shown. New / low-traffic posts
 * render with no stat (just their date) rather than an embarrassing tiny number.
 * Tune this floor here; `> MIN_READS` is the gate used at the call site.
 */
export const MIN_READS = 0;

/** Per-post analytics, keyed by post path (`/posts/<slug>`). */
export interface PageStat {
  /** Total page views for the post. */
  reads: number;
}

/** Normalized blog analytics consumed by the Writing page. */
export interface BlogAnalytics {
  /** Per-post stats keyed by path (`/posts/<slug>`). */
  pages: Map<string, PageStat>;
  /** Distinct countries the blog has been read from (`scope=core`). */
  countries: number;
  /** Total page views across the whole blog (`scope=core`). */
  reads: number;
}

/**
 * A build-time blog figure a page's metric can name (`{ stat: 'countries' }` in
 * a page's `index.mdx`; see `metricSchema` in `content.config.ts`).
 */
export type BlogStat = 'countries' | 'reads';

/** Shape of a `scope=pages` row (only the fields we use). */
interface CabinPageRow {
  path: string;
  page_views: number;
}

/** Shape of the `scope=core` response (only the fields we use). */
interface CabinCore {
  summary?: { page_views?: number };
  countries?: unknown[];
}

/** Today's date as `YYYY-MM-DD` (build date). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normalizes a path for joining: lowercased, no trailing slash (root stays "/"). */
function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return (trimmed === '' ? '/' : trimmed).toLowerCase();
}

/**
 * Pulls the page rows out of the `scope=pages` response. Cabin wraps list data
 * in a keyed object, so the rows may be the top-level value or nested under a
 * key (e.g. `pages`/`data`). Returns the first array of row-like objects found.
 */
function extractRows(raw: unknown): CabinPageRow[] {
  if (Array.isArray(raw)) return raw as CabinPageRow[];
  if (raw && typeof raw === 'object') {
    for (const value of Object.values(raw)) {
      if (Array.isArray(value) && (value.length === 0 || (value[0] && typeof value[0] === 'object'))) {
        return value as CabinPageRow[];
      }
    }
  }
  return [];
}

/** Calls the Cabin API for one scope, returning parsed JSON. */
async function fetchCabin(scope: 'core' | 'pages', apiKey: string): Promise<unknown> {
  const url = new URL(CABIN_API_URL);
  url.searchParams.set('domain', CABIN_DOMAIN);
  url.searchParams.set('date_from', ALL_TIME_FROM);
  url.searchParams.set('date_to', today());
  url.searchParams.set('scope', scope);
  url.searchParams.set('limit_lists', '250');

  const response = await fetch(url, { headers: { 'x-api-key': apiKey } });
  if (!response.ok) {
    throw new Error(`Cabin ${scope} request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** Module-level memo so multiple callers in one build share a single fetch. */
let cached: Promise<BlogAnalytics | null> | undefined;

/**
 * Fetches and normalizes blog analytics from Cabin. Returns `null` (never throws)
 * when the key is absent or anything goes wrong, so callers can treat analytics
 * as purely additive.
 */
export function getBlogAnalytics(): Promise<BlogAnalytics | null> {
  if (cached) return cached;

  cached = (async () => {
    const apiKey = process.env.CABIN_API_KEY;
    if (!apiKey) {
      // Expected in local dev / forks without the secret: render without analytics.
      console.warn('[analytics] CABIN_API_KEY is not set; rendering without analytics.');
      return null;
    }

    try {
      const [pagesRaw, coreRaw] = await Promise.all([
        fetchCabin('pages', apiKey),
        // The country count is additive to a page that already ranks by reads,
        // so its failure degrades to zero rather than rejecting the pair and
        // costing the rankings too.
        fetchCabin('core', apiKey).catch((error) => {
          console.warn(
            `[analytics] Cabin core fetch failed; the site-wide figures will be omitted. ${
              error instanceof Error ? error.message : error
            }`
          );
          return null;
        }),
      ]);

      const pages = new Map<string, PageStat>();
      for (const row of extractRows(pagesRaw)) {
        if (!row?.path) continue;
        pages.set(normalizePath(row.path), { reads: row.page_views ?? 0 });
      }

      const core = (coreRaw ?? {}) as CabinCore;

      return {
        pages,
        countries: core.countries?.length ?? 0,
        reads: core.summary?.page_views ?? 0,
      } satisfies BlogAnalytics;
    } catch (error) {
      console.warn(
        `[analytics] Cabin fetch failed; Writing page will render without analytics. ${
          error instanceof Error ? error.message : error
        }`
      );
      return null;
    }
  })();

  return cached;
}

/**
 * One named build-time figure for a page header's metric, or `undefined` when
 * analytics is unavailable (no key, Cabin down) or the figure is zero.
 *
 * `undefined` is the signal to drop the metric region entirely: the panel has no
 * honest placeholder for "we could not reach Cabin", and a "0 countries" line is
 * worse than no line. `grid.config.ts` omits the region on that value.
 */
export async function getBlogStat(name: BlogStat): Promise<string | number | undefined> {
  const analytics = await getBlogAnalytics();
  if (!analytics) return undefined;

  const stats: Record<BlogStat, number> = {
    countries: analytics.countries,
    reads: analytics.reads,
  };
  const value = stats[name];
  if (!value) return undefined;

  // Reads run to five figures and the metric is read at a glance, so they are
  // compacted ("18k"); a country count is two digits and stays exact.
  return name === 'reads' ? formatReads(value) : value;
}

/**
 * Looks up a post's stats by its canonical URL, tolerant of trailing-slash and
 * case differences between our URLs and Cabin's reported paths.
 */
export function getPageStat(analytics: BlogAnalytics | null, url: string): PageStat | undefined {
  if (!analytics) return undefined;
  return analytics.pages.get(normalizePath(new URL(url).pathname));
}

/**
 * Formats a read count compactly for display (e.g. 18420 -> "18k"), lowercased
 * to sit naturally in the meta line.
 */
export function formatReads(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n).toLowerCase();
}
