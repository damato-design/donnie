/**
 * Markdown mirrors.
 *
 * Serves `/<collection>/<slug>.md`, the plain-markdown counterpart of each
 * detail page, for LLMs and the MCP server. One file is emitted per entry of
 * every collection in `MIRRORED`.
 *
 * One rest route covers all four collections, because the collection is only
 * the first segment of the path: `mdMirror` enumerates them and the route is
 * the same either way. This is why `src/pages/` carries no per-collection
 * folders.
 *
 * Route: /[...slug].md
 */

import { mdMirror } from '@utils/llms';

export const { getStaticPaths, GET } = mdMirror();
