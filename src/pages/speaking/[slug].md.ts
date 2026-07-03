/**
 * Speaking engagement, markdown mirror
 *
 * Serves `/speaking/<slug>.md` for LLMs and the MCP server. Speaking is a single
 * HTML page (`/speaking`) with no per-entry route, so these `.md` files are the
 * only per-entry representation; one is emitted per talk and rendered by
 * `renderSpeaking`.
 *
 * Route: /speaking/[slug].md
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { renderSpeaking } from '@utils/llms';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('speaking');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute<{ entry: CollectionEntry<'speaking'> }> = ({ props }) =>
  new Response(`${renderSpeaking(props.entry)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
