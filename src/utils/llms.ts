/**
 * Machine-readable markdown for LLMs and the MCP server.
 *
 * The site's HTML pages are for people; these helpers render the same content as
 * plain markdown for machine consumers (the `llms.txt` index and the per-entry
 * `.md` mirrors under each collection, e.g. `/projects/<slug>.md`). They power
 * the MCP project at https://github.com/damato-design/mcp.
 *
 * Projects and decisions keep their substance in the MDX body as markdown, so
 * those renderers emit a small frontmatter header and then the body verbatim.
 * Journey and speaking entries are still mostly structured fields, so those
 * renderers serialize them and append the body last.
 *
 * Output deliberately avoids em dashes to match the site's editorial rule.
 *
 * @module utils/llms
 */

import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { sorted } from '@utils/collections';

/**
 * The collections with a per-entry markdown mirror, and the one list of them.
 * `writing` is absent: those entries are previews of posts that live on the
 * blog, with no body to mirror.
 */
export const MIRRORED = ['projects', 'decisions', 'journey', 'speaking'] as const;

/** One of those collections. */
export type MirroredCollection = (typeof MIRRORED)[number];

/** One entry from any of those collections. */
export type MirroredEntry = CollectionEntry<MirroredCollection>;

/**
 * Joins non-empty blocks with a blank line between them.
 *
 * Falsy parts are dropped, so a renderer can pass an optional block as `''`
 * (or `cond && block`) without worrying about stray blank lines.
 *
 * Exported because `llms.txt.ts` assembles its document the same way.
 */
export function blocks(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join('\n\n');
}

/** Renders an array of strings as a markdown bullet list. */
function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

/** Returns the entry's trimmed markdown body, or `''` when there is none. */
function body(entry: { body?: string }): string {
  return entry.body?.trim() ?? '';
}

/** Formats a date as an ISO calendar date (`YYYY-MM-DD`, UTC). */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Renders a project case study as a full markdown document: the frontmatter
 * header, then the body, which already carries the whole narrative as markdown
 * (Overview through Learnings, closing with the story behind it).
 */
export function renderProject(entry: CollectionEntry<'projects'>): string {
  const d = entry.data;

  return blocks(
    `# ${d.title}`,
    `> ${d.outcomeSummary}`,
    bullets([`**Role:** ${d.role}`, `**Year:** ${d.year}`]),
    d.techStack.length ? `Tech stack: ${d.techStack.join(', ')}` : '',
    body(entry)
  );
}

/**
 * Renders a decision record (ADR) as a full markdown document: the context from
 * frontmatter, then the body, which already carries the decision, alternatives,
 * reasoning, and reflection as markdown.
 */
export function renderDecision(entry: CollectionEntry<'decisions'>): string {
  const d = entry.data;

  return blocks(
    `# ${d.title}`,
    blocks('## Context', d.context),
    d.tags?.length ? `Tags: ${d.tags.join(', ')}` : '',
    body(entry)
  );
}

/** Renders a journey timeline entry as a markdown document. */
export function renderJourney(entry: CollectionEntry<'journey'>): string {
  const d = entry.data;

  return blocks(
    `# ${d.title}`,
    bullets([`**Date:** ${isoDate(d.date)}`, `**Type:** ${d.type}`]),
    d.description,
    d.skills?.length ? `Skills: ${d.skills.join(', ')}` : '',
    body(entry)
  );
}

/** Renders a speaking engagement as a markdown document, with any external links. */
export function renderSpeaking(entry: CollectionEntry<'speaking'>): string {
  const d = entry.data;

  const meta = [
    `**Type:** ${d.type}`,
    `**Date:** ${isoDate(d.date)}`,
    `**Location:** ${d.location}`,
    d.duration ? `**Duration:** ${d.duration}` : '',
  ].filter(Boolean) as string[];

  const links = [
    d.eventUrl ? `- [Event](${d.eventUrl})` : '',
    d.slides ? `- [Slides](${d.slides})` : '',
    d.video ? `- [Video](${d.video})` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return blocks(
    `# ${d.title}`,
    bullets(meta),
    d.description,
    d.topics?.length ? `Topics: ${d.topics.join(', ')}` : '',
    links ? blocks('Links:', links) : '',
    body(entry)
  );
}

/**
 * Renders any entry from a collection that has a markdown mirror.
 *
 * The four renderers above differ in what they serialize, but nothing outside
 * this module needs to pick between them: the entry already knows which
 * collection it came from. `writing` is absent because those entries are
 * previews of posts that live on the blog, with no body to mirror.
 */
export function renderEntry(entry: MirroredEntry): string {
  switch (entry.collection) {
    case 'projects':
      return renderProject(entry);
    case 'decisions':
      return renderDecision(entry);
    case 'journey':
      return renderJourney(entry);
    case 'speaking':
      return renderSpeaking(entry);
  }
}

/** A plain-text (markdown) response, the one form every machine route returns. */
export function textResponse(body: string): Response {
  return new Response(`${body.trimEnd()}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/**
 * The whole of the markdown-mirror route: one file per entry of every mirrored
 * collection, at `/<collection>/<slug>.md`.
 *
 * The rest parameter is what lets a single route cover all four, since the
 * collection is just the first segment of the path it emits. `src/pages/` needs
 * no per-collection folder as a result, and adding a collection to `MIRRORED`
 * is the whole of publishing its mirrors.
 *
 * ```ts
 * export const { getStaticPaths, GET } = mdMirror();
 * ```
 */
export function mdMirror(): {
  getStaticPaths: GetStaticPaths;
  GET: APIRoute<{ entry: MirroredEntry }>;
} {
  return {
    getStaticPaths: async () => {
      const collections = await Promise.all(
        MIRRORED.map(async (collection) =>
          (await sorted(collection)).map((entry) => ({
            params: { slug: `${collection}/${entry.id}` },
            props: { entry },
          }))
        )
      );
      return collections.flat();
    },
    GET: ({ props }) => textResponse(renderEntry(props.entry)),
  };
}
