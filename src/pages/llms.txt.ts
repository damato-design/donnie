/**
 * llms.txt API Route
 *
 * Serves `/llms.txt`, a machine-readable index of the site's content for LLMs and
 * the MCP server (https://github.com/damato-design/mcp). It mirrors the structure
 * of the original theme's `llms.txt`, adapted to this site's collections and its
 * config-driven identity (`siteConfig` + Astro's built-in `site`).
 *
 * Shape:
 * - H1 site title, blockquote description, and the author bio as an intro.
 * - One section per collection, each a bulleted list of links. Local collections
 *   link to their per-entry markdown mirror (`/<collection>/<slug>.md`); the
 *   Writing section links straight out to the full posts on the blog (those live
 *   off-site and have no local body).
 *
 * As with the rest of the site, the output avoids em dashes (a colon separates a
 * title from its date/description).
 *
 * Route: /llms.txt
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config';
import { isoDate } from '@utils/llms';

/** Joins non-empty blocks with a blank line between them. */
function blocks(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join('\n\n');
}

/** Builds one `## Heading` + bulleted list section, or `''` when there are no items. */
function section(title: string, items: string[]): string {
  return items.length ? `## ${title}\n${items.join('\n')}` : '';
}

/** Builds a list item: `- [label](url)` with an optional `: suffix`. */
function item(label: string, url: string, suffix?: string): string {
  return `- [${label}](${url})${suffix ? `: ${suffix}` : ''}`;
}

export const GET: APIRoute = async ({ site }) => {
  /** Absolute URL of an entry's local markdown mirror. */
  const mdUrl = (collection: string, id: string) =>
    new URL(`/${collection}/${id}.md`, site).href;

  const projects = (await getCollection('projects')).sort(
    (a, b) => b.data.year - a.data.year
  );
  const decisions = (await getCollection('decisions')).sort((a, b) =>
    a.data.title.localeCompare(b.data.title)
  );
  const journey = (await getCollection('journey')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
  const speaking = (await getCollection('speaking')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );
  const writing = (await getCollection('writing')).sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime()
  );

  const doc = blocks(
    `# ${siteConfig.title}`,
    `> ${siteConfig.description}`,
    siteConfig.author.bio,
    section(
      'Projects',
      projects.map((e) =>
        item(e.data.title, mdUrl('projects', e.id), `${e.data.year}, ${e.data.outcomeSummary}`)
      )
    ),
    section(
      'Decisions',
      decisions.map((e) => item(e.data.title, mdUrl('decisions', e.id), e.data.context))
    ),
    section(
      'Journey',
      journey.map((e) =>
        item(e.data.title, mdUrl('journey', e.id), `${isoDate(e.data.date)}, ${e.data.description}`)
      )
    ),
    section(
      'Speaking',
      speaking.map((e) =>
        item(e.data.title, mdUrl('speaking', e.id), `${isoDate(e.data.date)}, ${e.data.description}`)
      )
    ),
    section(
      'Writing',
      writing.map((e) =>
        item(e.data.title, e.data.url, `${isoDate(e.data.publishDate)}, ${e.data.description}`)
      )
    )
  );

  return new Response(`${doc}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
