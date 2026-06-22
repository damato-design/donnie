/**
 * Inline markdown rendering for frontmatter prose.
 *
 * Some content collection fields are plain strings in frontmatter but want the
 * same inline markdown (links, `code`, emphasis) the MDX bodies get. This runs
 * such a string through Astro's own markdown processor, the same remark/GFM/
 * smartypants pipeline that renders MDX, then strips the single wrapping `<p>`
 * so the result is inline HTML that can be slotted into a <Typography> element
 * via `set:html`.
 *
 * @module utils/markdown
 */

import { createMarkdownProcessor } from '@astrojs/markdown-remark';

/** One shared processor for the whole build (creation is async + non-trivial). */
const processor = await createMarkdownProcessor({});

/**
 * Render a single paragraph of markdown to inline HTML.
 *
 * @param md - A one-paragraph markdown string (e.g. a frontmatter field).
 * @returns The rendered HTML with the wrapping `<p>` removed.
 */
export async function renderInlineMarkdown(md: string): Promise<string> {
  const { code } = await processor.render(md);
  return code.trim().replace(/^<p>/, '').replace(/<\/p>$/, '');
}
