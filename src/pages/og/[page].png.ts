/**
 * Generated Open Graph images, one per top-level navigation page.
 *
 * `getStaticPaths` enumerates the pages that have a header panel, so
 * `astro build` emits a static PNG for each (e.g. `dist/og/projects.png`).
 * Deeper pages don't get their own image; `SEO.astro` maps them onto the
 * matching top-level image.
 *
 * A card *is* the page's header content, passed through as props, so a card
 * always advertises what the page actually says: both this route and the page
 * itself call `pageGrid` on the same `pages` entry. `/og` previews the same
 * cards as live HTML.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgPng, ogResponseHeaders } from '../../lib/og';
import { ogUrl } from '@components/OgImage.astro';
import { getPages, pageGrid } from '@/grid.config';

export const getStaticPaths = (async () => {
  const pages = await getPages();
  return Promise.all(
    [...pages].map(async ([page, entry]) => ({
      params: { page },
      props: { ...(await pageGrid(entry)) },
    }))
  );
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params, props, site }) => {
  const png = await renderOgPng(
    props as Parameters<typeof renderOgPng>[0],
    ogUrl(params.page as string, site),
  );
  // Wrap the Buffer in a Uint8Array view so it satisfies BodyInit's types.
  return new Response(new Uint8Array(png), { headers: ogResponseHeaders });
};
