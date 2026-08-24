/**
 * Table-of-contents tree building.
 *
 * The table of contents is driven by a flat, document-ordered
 * `MarkdownHeading[]`, which is what Astro's `render()` hands back for MDX
 * content and what the `.astro`-authored pages declare by hand. A page whose
 * `<main>` mixes section headings with cards (speaking's years and their talks,
 * writing's heading and its articles) wants those cards shown *underneath*
 * their heading, so the flat list is turned into a tree before rendering.
 *
 * @module utils/toc
 */

import type { MarkdownHeading } from 'astro';

/** A heading plus the headings nested underneath it. */
export interface TocNode extends MarkdownHeading {
  children: TocNode[];
}

/**
 * Turns a flat, document-ordered heading list into a nested tree.
 *
 * Each heading is attached to the nearest preceding heading with a smaller
 * `depth`, or to the root when there is none. A list that never descends (the
 * card listings, where every entry is `depth: 2`) therefore comes back flat,
 * and a list that does (speaking's years + talks) comes back nested, with no
 * per-page branching.
 *
 * `depth` here describes the table of contents' own structure rather than the
 * rendered element: card titles are `<h3>`s, but a card sitting under a section
 * heading is `depth: 3` while a card on a page with no headings is `depth: 2`.
 *
 * @param headings - Headings in document order.
 * @param maxDepth - Deepest level to include; anything deeper is dropped along
 *   with its children.
 */
export function buildTocTree(
  headings: MarkdownHeading[],
  maxDepth: number
): TocNode[] {
  const root: TocNode[] = [];
  /** The chain of ancestors for the heading being placed, shallowest first. */
  const ancestors: TocNode[] = [];

  for (const heading of headings) {
    if (heading.depth > maxDepth) continue;

    const node: TocNode = { ...heading, children: [] };

    while (
      ancestors.length > 0 &&
      ancestors[ancestors.length - 1].depth >= node.depth
    ) {
      ancestors.pop();
    }

    if (ancestors.length > 0) {
      ancestors[ancestors.length - 1].children.push(node);
    } else {
      root.push(node);
    }

    ancestors.push(node);
  }

  return root;
}
