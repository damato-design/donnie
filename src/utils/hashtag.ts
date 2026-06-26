/**
 * Hashtag formatting for tag-style metadata.
 *
 * Tags, topics, skills and tech-stack entries are authored as plain, readable
 * text (e.g. "CSS Custom Properties") and reused verbatim in non-tag contexts
 * such as the project "Tech Stack" list. `toHashtag` is the single place that
 * turns one of those values into a hashtag for display: the source words never
 * carry the leading "#", it is added here when rendered.
 *
 * Each run of non-alphanumeric characters (spaces, hyphens, slashes, parens,
 * "&", ...) is treated as a word boundary and collapsed, and every word is
 * upper-cased on its first letter while the rest of the word is preserved so
 * existing acronyms survive ("CSS Custom Properties" -> "#CSSCustomProperties",
 * "Front-end" -> "#FrontEnd"). Already-PascalCased input passes through
 * unchanged.
 *
 * @module hashtag
 */

/** Convert a free-text tag into a `#PascalCase` hashtag. */
export function toHashtag(tag: string): string {
  const pascal = tag
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return pascal ? `#${pascal}` : '';
}
