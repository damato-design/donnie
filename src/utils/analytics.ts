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
 * The API key is read from `process.env.CABIN_API_KEY`, a build-time secret. It
 * is intentionally NOT `PUBLIC_`-prefixed, so it never reaches the client, and
 * it is distinct from the identity literals in `siteConfig`.
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
  /** Average time on page, in seconds. */
  avgSeconds: number;
}

/** Normalized blog analytics consumed by the Writing page. */
export interface BlogAnalytics {
  /** Per-post stats keyed by path (`/posts/<slug>`). */
  pages: Map<string, PageStat>;
  /** Total page views across the blog (from the core summary). */
  totalReads: number;
  /** Number of distinct countries readers came from. */
  countryCount: number;
}

/** Shape of a `scope=pages` row (only the fields we use). */
interface CabinPageRow {
  path: string;
  page_views: number;
  average_duration_seconds: number;
}

/** Shape of the `scope=core` response (only the fields we use). */
interface CabinCore {
  summary?: { page_views?: number };
  countries?: Array<{ code: string; value: number }>;
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
 * in a keyed object (like `core`), so the rows may be the top-level value or
 * nested under a key (e.g. `pages`/`data`). Returns the first array of row-like
 * objects found.
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

/** Calls the Cabin API for a given scope, returning parsed JSON. */
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
    // Astro loads .env into import.meta.env (server-side, non-PUBLIC vars
    // included); netlify dev / CI inject into process.env. Support both.
    const apiKey = import.meta.env.CABIN_API_KEY ?? process.env.CABIN_API_KEY;
    if (!apiKey) {
      // Expected in local dev / forks without the secret: render without analytics.
      console.warn('[analytics] CABIN_API_KEY not found in import.meta.env or process.env; rendering without analytics.');
      return null;
    }

    try {
      const [pagesRaw, coreRaw] = await Promise.all([
        fetchCabin('pages', apiKey),
        fetchCabin('core', apiKey),
      ]);

      const pageRows = extractRows(pagesRaw);
      const pages = new Map<string, PageStat>();
      for (const row of pageRows) {
        if (!row?.path) continue;
        pages.set(normalizePath(row.path), {
          reads: row.page_views ?? 0,
          avgSeconds: row.average_duration_seconds ?? 0,
        });
      }

      const core = (coreRaw ?? {}) as CabinCore;
      return {
        pages,
        totalReads: core.summary?.page_views ?? 0,
        countryCount: core.countries?.length ?? 0,
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
 * Looks up a post's stats by its canonical URL, tolerant of trailing-slash and
 * case differences between our URLs and Cabin's reported paths.
 */
export function getPageStat(analytics: BlogAnalytics | null, url: string): PageStat | undefined {
  if (!analytics) return undefined;
  return analytics.pages.get(normalizePath(new URL(url).pathname));
}

/**
 * Formats a read count compactly for display (e.g. 18420 -> "18K"), lowercased
 * to sit naturally in the meta line.
 */
export function formatReads(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n).toLowerCase();
}

/**
 * Formats average time-on-page for display: "~N min", or "<1 min" under a minute.
 */
export function formatAvgRead(seconds: number): string {
  if (seconds < 60) return '<1 min';
  return `~${Math.round(seconds / 60)} min`;
}
