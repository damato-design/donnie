/**
 * Page header panels
 *
 * Turns a content entry into the `Grid` panel's props. Nothing here is authored
 * copy any more: the top-level pages carry theirs in their own `index.mdx`
 * frontmatter, and the detail pages derive theirs from the entry they render.
 * This module is the one place that shape is assembled, so the page, the Open
 * Graph card (`src/lib/og.ts`), and `SEO` all read the same panel.
 *
 * Three entry points:
 *
 * - `pageGrid(entry)`    a top-level page, from its own frontmatter
 * - `projectGrid(entry)` a case study, derived and then overridden
 * - `decisionGrid(entry)` a decision record, likewise
 *
 * The `metric` is resolved here rather than authored: a page's frontmatter
 * names the collection to count (`{ count: 'projects' }`) and the number comes
 * from the collection at build time, so it can never go stale.
 *
 * @module grid.config
 */

import { type CollectionEntry } from 'astro:content';
import type { GridProps } from '@components/Grid.astro';
import { siteConfig } from '@/config';
import { count, sorted } from '@utils/collections';
import { calculateReadingTime, formatReadingTime } from '@utils/readingTime';

/** A top-level page entry. Its id is its route (`home` is the site root). */
export type PageEntry = CollectionEntry<'pages'>;

/**
 * Every top-level page, keyed by route id, in nav order.
 *
 * This is the list that used to be `gridContent`'s keys: the pages that have a
 * header panel, and therefore an Open Graph card. `SEO` and both `/og` routes
 * read it, so a new page file gets a card and a card mapping with no further
 * edit anywhere.
 */
export async function getPages(): Promise<Map<string, PageEntry>> {
  return new Map((await sorted('pages')).map((entry) => [entry.id, entry]));
}

/**
 * The header panel for a top-level page.
 *
 * Straight from frontmatter, except the metric: `{ count: 'projects' }` is
 * resolved against the collection, while `{ value: 25 }` is passed through.
 */
export async function pageGrid(entry: PageEntry): Promise<GridProps> {
  const { title, headline, description, cta, metric, intro } = entry.data;

  return {
    title,
    headline,
    description,
    cta,
    metric: metric
      ? 'count' in metric
        ? { value: await count(metric.count), label: metric.label }
        : metric
      : undefined,
    anecdote: intro,
  };
}

/**
 * The panel regions an entry's frontmatter may override (`panelFields` in
 * `content.config.ts`).
 *
 * `title` is absent on purpose: the panel's <h1> is the entry's `title`, which
 * the listing card and SEO also read, so the two can't be allowed to diverge.
 */
type PanelOverrides = Partial<Omit<GridProps, 'title'>>;

/**
 * Merges an entry's frontmatter over a computed panel, region by region.
 *
 * An absent field keeps the derived value, so frontmatter only ever has to name
 * what it wants to change. A present one replaces that region **wholesale**
 * (a `cta` array is the whole row, not an addition to it).
 */
function withOverrides(defaults: GridProps, overrides: PanelOverrides): GridProps {
  return {
    title: defaults.title,
    headline: overrides.headline ?? defaults.headline,
    description: overrides.description ?? defaults.description,
    cta: overrides.cta ?? defaults.cta,
    metric: overrides.metric ?? defaults.metric,
    anecdote: overrides.anecdote ?? defaults.anecdote,
  };
}

/**
 * The header panel for one case study.
 *
 * Derived from the entry: the role/year byline (with the body's reading time),
 * a link back to the listing plus the booking link, the tech-stack count as the
 * metric, and the outcome summary as the anecdote. Any of those regions can be
 * replaced from the MDX frontmatter, and `headline` exists only there.
 */
export function projectGrid(entry: CollectionEntry<'projects'>): GridProps {
  const { title, role, year, outcomeSummary, techStack } = entry.data;
  const readingTime = formatReadingTime(calculateReadingTime(entry.body ?? ''));

  return withOverrides(
    {
      title,
      description: `${role} · ${year} · ${readingTime}`,
      cta: [
        { label: 'All projects', href: '/projects' },
        { label: 'Work with me', href: siteConfig.scheduling, external: true },
      ],
      metric: { value: techStack.length, label: 'technologies' },
      anecdote: outcomeSummary,
    },
    entry.data
  );
}

/**
 * The header panel for one decision record.
 *
 * Derived from the entry: a link back to the listing, the tag count as the
 * metric (dropped when the record has no tags), and the context as the
 * anecdote. Any of those regions can be replaced from the MDX frontmatter, and
 * `headline`/`description` exist only there.
 */
export function decisionGrid(entry: CollectionEntry<'decisions'>): GridProps {
  const { title, context, tags } = entry.data;

  return withOverrides(
    {
      title,
      cta: [{ label: 'All decisions', href: '/decisions' }],
      metric: tags?.length ? { value: tags.length, label: 'tags' } : undefined,
      anecdote: context,
    },
    entry.data
  );
}
