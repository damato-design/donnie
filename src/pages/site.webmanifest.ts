/**
 * Web App Manifest API Route
 *
 * Serves `/site.webmanifest`, the manifest `Layout`'s head links to. It is
 * generated rather than kept as a static file in `public/` for the same reason
 * `robots.txt` and `llms.txt` are: a hand-maintained copy in `public/` cannot
 * read `siteConfig`, so its name, description, and colours drift from the site's
 * (they did, and an icon-generator export overwrote the file with a white
 * `theme_color` that contradicted the dark shell).
 *
 * `start_url`, `scope`, and `id` are deliberately **relative**. They resolve
 * against the manifest's own URL, so the origin never has to be stated and there
 * is nothing here for a preview deploy to get wrong. `id` is pinned so a future
 * change to `start_url` is understood as the same installed app rather than a
 * new one.
 *
 * Icons are declared largest-last so a consumer can take the first that fits;
 * all three are `purpose: 'any'`. There is deliberately **no `maskable` entry**:
 * the mark is drawn edge to edge, so Android's adaptive mask would clip it, and
 * claiming `maskable` without artwork that respects the 80% safe zone is worse
 * than omitting it (the platform then letterboxes the `any` icon instead of
 * cropping the glyph).
 *
 * Route: /site.webmanifest
 */

import type { APIRoute } from 'astro';
import { siteConfig } from '@/config';

export const GET: APIRoute = () => {
  const manifest = {
    id: '/',
    name: siteConfig.title,
    // Home screen labels truncate around 12 characters, which the full name
    // exceeds; the first name is what a launcher can actually show.
    short_name: siteConfig.author.name.split(' ')[0],
    description: siteConfig.description,
    lang: siteConfig.language,
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: siteConfig.themeColor,
    background_color: siteConfig.themeColor,
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };

  // Not `textResponse`: a manifest is served as application/manifest+json, not
  // text/plain, so this is the one machine route that builds its own Response.
  return new Response(`${JSON.stringify(manifest, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
