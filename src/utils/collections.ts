/**
 * Collection ordering and route helpers.
 *
 * Every collection has exactly one canonical order, defined here and used by
 * both the HTML pages and the machine-readable routes. Before this module the
 * same comparator was written twice per collection (once in the listing page,
 * once in `llms.txt.ts`), which let the two drift; now a page asks for
 * `sorted('projects')` and gets the same sequence `/llms.txt` lists.
 *
 * `getCollection` returns a fresh array per call, but it is copied before
 * sorting anyway so nothing here depends on that staying true.
 *
 * @module utils/collections
 */

import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';
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
 */
const comparators = {
  pages: (a, b) => pageOrder.indexOf(a.id) - pageOrder.indexOf(b.id),
  projects: (a, b) => b.data.year - a.data.year,
  decisions: (a, b) => a.data.title.localeCompare(b.data.title),
  journey: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  speaking: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  writing: (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
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

/** How many entries a collection holds. Every page header's metric is one of these. */
export async function count(collection: CollectionKey): Promise<number> {
  return (await getCollection(collection)).length;
}

