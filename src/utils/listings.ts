/**
 * Collection listings for the page routes.
 *
 * A page entry names a `listing` in its frontmatter and this module resolves it
 * into two things the route needs: the data `Listing.astro` renders, and the
 * `headings` `Layout` needs *before* `<main>` renders in order to build the
 * table of contents. Both come from one call, so a TOC link and the card `id`
 * it jumps to are built from the same array and cannot drift.
 *
 * Four shapes, because four of the five listings genuinely differ:
 *
 * - `cards`     one flat `EntryList` (projects, decisions)
 * - `groups`    one `EntryList` per year heading (speaking)
 * - `timeline`  the dot/rail treatment, with each entry's rendered body (journey)
 * - `articles`  the top-N cards plus the closing "read everything" CTA (writing)
 *
 * Ordering is never decided here: every listing takes its sequence from
 * `sorted()` in `utils/collections.ts`, the same call `/llms.txt` makes.
 *
 * @module utils/listings
 */

import type { MarkdownHeading } from 'astro';
import { render } from 'astro:content';
import type { EntryItem } from '@components/EntryList.astro';
import { sorted } from '@utils/collections';
import { formatLongDate, formatMonthYear } from '@utils/formatDate';
import { getBlogAnalytics, getPageStat, formatReads, MIN_READS } from '@utils/analytics';

/** The listings a page's frontmatter can name. */
export type ListingName = 'projects' | 'decisions' | 'journey' | 'writing' | 'speaking';

/** One entry on the journey timeline, with its body already rendered. */
export interface TimelineItem {
  slug: string;
  date: Date;
  title: string;
  description: string;
  skills?: string[];
  Content: Awaited<ReturnType<typeof render>>['Content'];
}

/** What `Listing.astro` is handed, tagged by how it should be laid out. */
export type Listing =
  | { kind: 'cards'; items: EntryItem[]; compact: boolean }
  | { kind: 'groups'; groups: [number, EntryItem[]][] }
  | { kind: 'timeline'; items: TimelineItem[] }
  | { kind: 'articles'; items: EntryItem[]; total: number; shown: number; blogUrl: string };

/** How many top posts the Writing page features. The rest live on the blog. */
const TOP_N = 10;

/**
 * Card headings, in document order.
 *
 * `depth` describes the TOC's own structure rather than the rendered element:
 * card titles are always `<h3>`s, but a card is `depth: 2` on a page whose cards
 * *are* its sections and `depth: 3` when it sits under a section heading.
 */
const cardHeadings = (
  items: { slug: string; title: string }[],
  depth = 2
): MarkdownHeading[] => items.map(({ slug, title }) => ({ depth, slug, text: title }));

async function projectsListing() {
  const items: EntryItem[] = (await sorted('projects')).map(({ id, data }) => ({
    slug: `project-${id}`,
    meta: `${data.role} · ${data.year}`,
    title: data.title,
    description: data.outcomeSummary,
    tags: data.techStack,
    href: `/projects/${id}`,
  }));

  return { listing: { kind: 'cards', items, compact: false } as const, headings: cardHeadings(items) };
}

async function decisionsListing() {
  const items: EntryItem[] = (await sorted('decisions')).map(({ id, data }) => ({
    slug: `decision-${id}`,
    title: data.title,
    description: data.context,
    tags: data.tags,
    href: `/decisions/${id}`,
  }));

  return { listing: { kind: 'cards', items, compact: true } as const, headings: cardHeadings(items) };
}

async function journeyListing() {
  const items: TimelineItem[] = await Promise.all(
    (await sorted('journey')).map(async (entry) => ({
      slug: `entry-${entry.id}`,
      date: entry.data.date,
      title: entry.data.title,
      description: entry.data.description,
      skills: entry.data.skills,
      Content: (await render(entry)).Content,
    }))
  );

  return { listing: { kind: 'timeline', items } as const, headings: cardHeadings(items) };
}

async function speakingListing() {
  const groups = new Map<number, EntryItem[]>();

  for (const { id, data } of await sorted('speaking')) {
    const { title, description, location, date, topics, slides, video } = data;

    const item: EntryItem = {
      slug: `talk-${id}`,
      meta: `${formatMonthYear(date)} · ${location}`,
      title,
      description,
      tags: topics,
      // A talk has no page of its own, so the card links nowhere; its slides
      // and video are rendered in the card's body instead.
      links: [
        ...(slides ? [{ label: 'Slides', href: slides, external: true, icon: 'slides' as const }] : []),
        ...(video ? [{ label: 'Video', href: video, external: true, icon: 'video' as const }] : []),
      ],
    };

    const year = date.getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }

  // Insertion order gives the years newest first, because the source list is.
  const entries = [...groups];

  return {
    listing: { kind: 'groups', groups: entries } as const,
    headings: entries.flatMap(([year, items]): MarkdownHeading[] => [
      { depth: 2, slug: `year-${year}`, text: String(year) },
      ...cardHeadings(items, 3),
    ]),
  };
}

async function writingListing() {
  /** Canonical order: most recent first. Also the fallback ranking. */
  const byDateDesc = await sorted('writing');

  // Build-time blog analytics from Cabin (null when unavailable; purely additive).
  const analytics = await getBlogAnalytics();
  const reads = (url: string) => getPageStat(analytics, url)?.reads ?? 0;

  // Rank by reads when analytics is available, otherwise keep the canonical
  // order. `sort` is stable, so ties still break by date.
  const top = (
    analytics ? [...byDateDesc].sort((a, b) => reads(b.data.url) - reads(a.data.url)) : byDateDesc
  ).slice(0, TOP_N);

  /** Publish date, plus the read count when the post has meaningful traffic. */
  const meta = (date: Date, url: string) => {
    const formatted = formatLongDate(date);
    const stat = getPageStat(analytics, url);
    return !stat || stat.reads <= MIN_READS
      ? formatted
      : `${formatted} · ${formatReads(stat.reads)} reads`;
  };

  const items: EntryItem[] = top.map(({ id, data }) => ({
    slug: `article-${id}`,
    meta: meta(data.publishDate, data.url),
    title: data.title,
    description: data.description,
    tags: data.tags,
    href: data.url,
    external: true,
  }));

  const heading: MarkdownHeading = {
    depth: 2,
    slug: 'top-articles',
    text: `Top ${TOP_N} Articles`,
  };

  return {
    listing: {
      kind: 'articles',
      items,
      total: byDateDesc.length,
      shown: items.length,
      // The blog's origin, derived from the feed URLs rather than restated.
      blogUrl: byDateDesc.length
        ? new URL(byDateDesc[0].data.url).origin
        : 'https://blog.damato.design',
    } as const,
    headings: [heading, ...cardHeadings(items, 3)],
  };
}

const builders = {
  projects: projectsListing,
  decisions: decisionsListing,
  journey: journeyListing,
  writing: writingListing,
  speaking: speakingListing,
};

/** Resolves a named listing into its data and its table-of-contents headings. */
export function buildListing(
  name: ListingName
): Promise<{ listing: Listing; headings: MarkdownHeading[] }> {
  return builders[name]();
}
