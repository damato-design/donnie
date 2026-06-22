/**
 * Robots.txt API Route
 * 
 * Dynamically generates the robots.txt file for search engine crawlers.
 * Allows all user agents to crawl the entire site and provides the sitemap location.
 * 
 * Features:
 * - Allows all crawlers (User-agent: *)
 * - Permits crawling of all paths (Allow: /)
 * - References the sitemap for better indexing
 * - Normalizes site URL (removes trailing slash)
 * - Returns proper text/plain content type
 * 
 * Route: /robots.txt
 * 
 * @example
 * Generated output:
 * ```
 * User-agent: *
 * Allow: /
 * 
 * Sitemap: https://example.com/sitemap-index.xml
 * ```
 */

import type { APIRoute } from 'astro';

/**
 * GET handler for robots.txt
 *
 * Generates the robots.txt content dynamically using the site URL from Astro's
 * built-in `site` (set by `site:` in astro.config.mjs).
 *
 * @returns Response with robots.txt content and text/plain content type
 */
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('/sitemap-index.xml', site).href;

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
