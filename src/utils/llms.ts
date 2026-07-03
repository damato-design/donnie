/**
 * Machine-readable markdown for LLMs and the MCP server.
 *
 * The site's HTML pages are for people; these helpers render the same content as
 * plain markdown for machine consumers (the `llms.txt` index and the per-entry
 * `.md` mirrors under each collection, e.g. `/projects/<slug>.md`). They power
 * the MCP project at https://github.com/damato-design/mcp.
 *
 * Unlike the original theme's `media` collection, this site keeps the substance
 * of each entry in its frontmatter (overview, problem, decisions, ...), so these
 * renderers serialize the structured fields, not just `entry.body`. The body, when
 * present, is appended last as the first-person "story behind it".
 *
 * Output deliberately avoids em dashes to match the site's editorial rule.
 *
 * @module utils/llms
 */

import type { CollectionEntry } from 'astro:content';

/**
 * Joins non-empty blocks with a blank line between them.
 *
 * Falsy parts are dropped, so a renderer can pass an optional block as `''`
 * (or `cond && block`) without worrying about stray blank lines.
 */
function blocks(...parts: Array<string | false | null | undefined>): string {
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
 * Renders a project case study as a full markdown document, mirroring the
 * narrative order of the HTML detail page.
 */
export function renderProject(entry: CollectionEntry<'projects'>): string {
  const d = entry.data;

  const metrics = d.impact.metrics?.length
    ? bullets(d.impact.metrics.map((m) => `**${m.label}:** ${m.value}`))
    : '';

  const decisions = d.keyDecisions
    .map((dec) =>
      blocks(
        `### ${dec.decision}`,
        dec.reasoning,
        dec.alternatives?.length
          ? blocks('Alternatives considered:', bullets(dec.alternatives))
          : ''
      )
    )
    .join('\n\n');

  return blocks(
    `# ${d.title}`,
    `> ${d.outcomeSummary}`,
    bullets([`**Role:** ${d.role}`, `**Year:** ${d.year}`, `**Status:** ${d.status}`]),
    blocks('## Overview', d.overview),
    blocks('## Problem', d.problem),
    blocks('## Constraints', bullets(d.constraints)),
    blocks('## Approach', d.approach),
    blocks('## Key Decisions', decisions),
    blocks('## Tech Stack', bullets(d.techStack)),
    blocks('## Result & Impact', metrics, d.impact.qualitative),
    blocks('## Learnings', bullets(d.learnings)),
    body(entry)
  );
}

/**
 * Renders a decision record (ADR) as a full markdown document: context,
 * decision, the alternatives with their pros/cons, reasoning, and reflection.
 */
export function renderDecision(entry: CollectionEntry<'decisions'>): string {
  const d = entry.data;

  const alternatives = d.alternatives
    .map((alt) =>
      blocks(
        `### ${alt.option}`,
        alt.pros?.length ? blocks('Pros:', bullets(alt.pros)) : '',
        alt.cons?.length ? blocks('Cons:', bullets(alt.cons)) : ''
      )
    )
    .join('\n\n');

  return blocks(
    `# ${d.title}`,
    blocks('## Context', d.context),
    blocks('## Decision', d.decision),
    blocks('## Alternatives', alternatives),
    blocks('## Reasoning', d.reasoning),
    blocks('## Why it mattered', d.whyItMattered),
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
