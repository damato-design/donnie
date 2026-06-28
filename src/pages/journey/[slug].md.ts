/**
 * Journey entry, markdown mirror
 *
 * Serves `/journey/<slug>.md` for LLMs and the MCP server. The journey timeline is
 * a single HTML page (`/journey`) with no per-entry route, so these `.md` files are
 * the only per-entry representation; one is emitted per journey entry and rendered
 * by `renderJourney`.
 *
 * Route: /journey/[slug].md
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { renderJourney } from '@utils/llms';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('journey');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute<{ entry: CollectionEntry<'journey'> }> = ({ props }) =>
  new Response(`${renderJourney(props.entry)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
