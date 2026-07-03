/**
 * Generated Open Graph images, one per top-level navigation page.
 *
 * `getStaticPaths` enumerates the top-level pages so `astro build` emits a
 * static PNG for each (e.g. `dist/og/projects.png`). Deeper pages don't get
 * their own image; `SEO.astro` maps them onto the matching top-level image.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgPng, ogResponseHeaders } from '../../lib/og';
import { pagesConfig } from '../../pages.config';
import { siteConfig } from '../../config';

/** Heading + description used on each generated card. */
const ogPages: Record<string, { title: string; description: string }> = {
  // Home leads with the identity rather than the "Home" nav label.
  home: { title: siteConfig.author.name, description: siteConfig.description },
  projects: { title: pagesConfig.projects.heading, description: pagesConfig.projects.description },
  decisions: { title: pagesConfig.decisions.heading, description: pagesConfig.decisions.description },
  journey: { title: pagesConfig.journey.heading, description: pagesConfig.journey.description },
  writing: { title: pagesConfig.writing.heading, description: pagesConfig.writing.description },
  speaking: { title: pagesConfig.speaking.heading, description: pagesConfig.speaking.description },
  contact: { title: pagesConfig.contact.heading, description: pagesConfig.contact.description },
};

export const getStaticPaths = (() =>
  Object.keys(ogPages).map((page) => ({ params: { page } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const meta = ogPages[params.page as string];
  if (!meta) return new Response('Not found', { status: 404 });

  const png = await renderOgPng(meta);
  // Wrap the Buffer in a Uint8Array view so it satisfies BodyInit's types.
  return new Response(new Uint8Array(png), { headers: ogResponseHeaders });
};
