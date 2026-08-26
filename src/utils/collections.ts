/**
 * Collection ordering, counting, and the two things a panel still needs at
 * render time.
 *
 * Every collection has exactly one canonical order, defined here and used by
 * both the HTML pages and the machine-readable routes. Before this module the
 * same comparator was written twice per collection (once in the listing page,
 * once in `llms.txt.ts`), which let the two drift; now a page asks for
 * `sorted('projects')` and gets the same sequence `/llms.txt` lists.
 *
 * Frontmatter is otherwise the panel: every collection with a page of its own
 * uses `Grid`'s own keys (see `panelFields` in `content.config.ts`), so there is
 * no adapter between an entry and the component. What is left here is only what
 * a Zod schema cannot see from inside a single entry:
 *
 * - `resolveMetric` counts *another* collection, which a schema can't do
 *   without parsing itself.
 * - `sectionOf` finds the page a detail entry inherits its artwork from, which
 *   is a lookup in another collection for the same reason.
 *
 * `getCollection` returns a fresh array per call, but it is copied before
 * sorting anyway so nothing here depends on that staying true.
 *
 * @module utils/collections
 */

import { getCollection, getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { GridProps } from '@components/Grid.astro';
import { siteConfig } from '@/config';

/**
 * The order the top-level pages are listed in: home, then the nav's own order.
 * Derived from `siteConfig.nav` rather than restated, so adding a section to the
 * nav also places its Open Graph card and its `/og` preview.
 */
const pageOrder = ['home', ...siteConfig.nav.map((item) => item.href.replace(/^\//, ''))];

/**
 * The canonical comparator for each collection.
 *
 * - **pages**: home, then `siteConfig.nav` order.
 * - **projects**: newest first, the order the listing has always used.
 * - **decisions**: alphabetical by title. The records have no date, and
 *   filename order (what `getCollection` hands back) is not a decision anyone
 *   made.
 * - **journey** / **speaking**: newest first.
 * - **writing**: newest first. The Writing page re-ranks by read count on top
 *   of this, and falls back to exactly this order when analytics is missing.
 * - **countries**: alphabetical. Nothing lists them; they exist to be counted.
 */
const comparators = {
  pages: (a, b) => pageOrder.indexOf(a.id) - pageOrder.indexOf(b.id),
  projects: (a, b) => b.data.year - a.data.year,
  decisions: (a, b) => a.data.title.localeCompare(b.data.title),
  journey: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  speaking: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  writing: (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  countries: (a, b) => a.data.name.localeCompare(b.data.name),
} satisfies {
  [C in CollectionKey]: (a: CollectionEntry<C>, b: CollectionEntry<C>) => number;
};

/** Every entry in a collection, in its canonical order. */
export async function sorted<C extends CollectionKey>(
  collection: C
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection);
  return [...entries].sort(comparators[collection] as (a: unknown, b: unknown) => number);
}

/** How many entries a collection holds. Every counted metric is one of these. */
export async function count(collection: CollectionKey): Promise<number> {
  return (await getCollection(collection)).length;
}

/** A top-level page entry. Its id is its route (`home` is the site root). */
export type PageEntry = CollectionEntry<'pages'>;

/** The collections whose entries carry a page header panel. */
export type PanelEntry = CollectionEntry<'pages' | 'projects' | 'decisions'>;

/** One of those entries' frontmatter, which is the panel itself. */
export type PanelData = PanelEntry['data'];

/**
 * Every top-level page, keyed by route id, in nav order.
 *
 * The pages that have a header panel, and therefore an Open Graph card. `SEO`
 * and both `/og` routes read it, so a new page file gets a card and a card
 * mapping with no further edit anywhere.
 */
export async function getPages(): Promise<Map<string, PageEntry>> {
  return new Map((await sorted('pages')).map((entry) => [entry.id, entry]));
}

/**
 * Resolves an authored metric into the figure the panel renders.
 *
 * `{ count: 'projects' }` is counted from the collection at build time and
 * `{ value: 2021 }` is passed through. A count of zero drops the region: the
 * `countries` collection is empty when Cabin is unreachable, and the panel has
 * no honest placeholder for a figure the build could not measure.
 */
export async function resolveMetric(metric: PanelData['metric']): Promise<GridProps['metric']> {
  if (!metric) return undefined;
  if (!('count' in metric)) return metric;

  const value = await count(metric.count);
  return value ? { value, label: metric.label } : undefined;
}

/**
 * An entry's frontmatter as the panel's props.
 *
 * There is no mapping step: the frontmatter already uses `Grid`'s own key for
 * every region, so this resolves the metric and hands the rest straight over.
 * The return type is what pins the two together, so a region renamed in `Grid`
 * without being renamed in `content.config.ts` fails the build.
 */
export async function panel(data: PanelData): Promise<GridProps> {
  return { ...data, metric: await resolveMetric(data.metric) };
}

/**
 * The section page a detail entry belongs to.
 *
 * A case study has no artwork of its own, so it borrows `/projects`'s backdrop
 * and `Square` media: a detail page should read as part of its section rather
 * than as its own place. The entry's own `backdrop`/`media` still win.
 */
export function sectionOf(collection: 'projects' | 'decisions') {
  return getEntry('pages', collection);
}
