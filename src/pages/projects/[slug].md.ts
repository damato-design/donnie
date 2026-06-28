/**
 * Project case study, markdown mirror
 *
 * Serves `/projects/<slug>.md`: the plain-markdown counterpart of the HTML detail
 * page at `/projects/<slug>`, for LLMs and the MCP server. One file is emitted per
 * project entry; the body is rendered by `renderProject`.
 *
 * Route: /projects/[slug].md
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { renderProject } from '@utils/llms';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getCollection('projects');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
};

export const GET: APIRoute<{ entry: CollectionEntry<'projects'> }> = ({ props }) =>
  new Response(`${renderProject(props.entry)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
