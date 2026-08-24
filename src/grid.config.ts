/**
 * Page header content
 *
 * The `Grid` panel's content for every top-level page, in one place. Each page
 * passes its entry straight through `Layout`'s `grid` prop, and the Open Graph
 * card renders the same entry into the same shell (see `src/lib/og.ts`), so the
 * card can't drift from the page it advertises.
 *
 * This is the *panel's* copy: the headline, the promotional description, the
 * CTA row, the metric, and the intro anecdote. Titles and SEO descriptions stay
 * in `pages.config.ts`, and identity stays in `config.ts`; this module reads
 * both rather than restating them.
 *
 * Every metric is a plain count of a collection, so they are resolved here
 * instead of in the pages, and the pages keep only the sorting and grouping
 * their listings actually need.
 *
 * Detail pages (`/projects/<slug>`, `/decisions/<slug>`) work the same way, one
 * step later: `projectGrid`/`decisionGrid` below derive a panel from the entry
 * and let the entry's own frontmatter override any region of it.
 *
 * @module grid.config
 */

import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { GridProps } from '@components/Grid.astro';
import { siteConfig } from '@/config';
import { pagesConfig } from '@/pages.config';
import { calculateReadingTime, formatReadingTime } from '@utils/readingTime';

/** Entries in a collection. Every page's metric is one of these. */
const size = async <C extends CollectionKey>(name: C) => (await getCollection(name)).length;

const [projects, decisions, journey, writing, speaking] = await Promise.all([
  size('projects'),
  size('decisions'),
  size('journey'),
  size('writing'),
  size('speaking'),
]);

export const gridContent = {
  home: {
    title: siteConfig.author.name,
    headline: 'Experience Architect',
    description: siteConfig.description,
    cta: [
      { label: 'Explore my work', href: '/projects' },
      { label: 'Follow my thinking', href: '/decisions' },
    ],
    metric: { value: 25, label: 'years' },
    anecdote: 'UX Architect improving design systems and AI model behavior.',
  },

  projects: {
    title: pagesConfig.projects.heading,
    headline: 'Finding creativity within constraints',
    description: "Real innovation isn't abundant options,\nit's the discipline to do more with less.",
    cta: [{ label: 'Work with me', href: siteConfig.scheduling, external: true }],
    metric: { value: projects, label: 'projects' },
    anecdote: pagesConfig.projects.intro,
  },

  decisions: {
    title: pagesConfig.decisions.heading,
    headline: 'Stageworthy thinking',
    description:
      'My unglamorous research leads to provocative positions that push people to reconsider their own practice.',
    cta: [{ label: 'Put me on your stage', href: siteConfig.scheduling, external: true }],
    metric: { value: decisions, label: 'decisions' },
    anecdote: pagesConfig.decisions.intro,
  },

  journey: {
    title: pagesConfig.journey.heading,
    headline: 'Always a builder',
    description:
      'Long before tokens and components, I was building things by hand with whatever was on the bench, learning that working within limits is what makes the work interesting. Same instinct, new materials.',
    cta: [{ label: 'Recent projects', href: '/projects' }],
    metric: { value: journey, label: 'entries' },
    anecdote: pagesConfig.journey.intro,
  },

  writing: {
    title: pagesConfig.writing.heading,
    headline: 'Now in print:\nMise en Mode',
    description:
      'My book on rebuilding design token architecture from first principles. Stop adding tokens, start expressing modes.',
    cta: [{ label: 'Read the book', href: 'https://mode.place', external: true }],
    metric: { value: writing, label: 'articles' },
    anecdote: pagesConfig.writing.intro,
  },

  speaking: {
    title: pagesConfig.speaking.heading,
    headline: 'Catch me live on Wireframe',
    description:
      'A weekday live show: candid design talk, new approaches, and the occasional spicy hot take with guests from the community.',
    cta: [
      { label: 'Be on the show', href: 'https://wireframe.ds.house#guest', external: true },
      { label: 'Watch now', href: 'https://wireframe.ds.house', external: true },
    ],
    metric: { value: speaking, label: 'talks' },
    anecdote: pagesConfig.speaking.intro,
  },
} satisfies Record<string, GridProps>;

/** The pages that have a header panel, and therefore an Open Graph card. */
export type GridPage = keyof typeof gridContent;

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
