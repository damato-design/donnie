/**
 * Decision record, markdown mirror
 *
 * Serves `/decisions/<slug>.md`: the plain-markdown counterpart of the HTML page
 * at `/decisions/<slug>`, for LLMs and the MCP server. One file is emitted per
 * decision entry; the body is rendered by `renderDecision`.
 *
 * Route: /decisions/[slug].md
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { renderDecision } from '@utils/llms';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('decisions');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute<{ entry: CollectionEntry<'decisions'> }> = ({ props }) =>
  new Response(`${renderDecision(props.entry)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
