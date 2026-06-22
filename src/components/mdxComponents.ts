/**
 * MDX component map.
 *
 * Pass to `<Content components={mdxComponents} />`. Each entry renders the raw
 * HTML element while forwarding its attributes (e.g. an `<a>`'s `href`, a
 * heading's `id`). The rest (`p`, `ul`, `li`, `blockquote`, `strong`, `img`,
 * `pre`, ...) fall through to the global base typography in
 * `src/styles/typography.css`.
 */
import ProseLink from '@components/prose/ProseLink.astro';
import ProseH2 from '@components/prose/ProseH2.astro';
import ProseH3 from '@components/prose/ProseH3.astro';
import ProseH4 from '@components/prose/ProseH4.astro';
import ProseH5 from '@components/prose/ProseH5.astro';
import ProseH6 from '@components/prose/ProseH6.astro';
import ProseCode from '@components/prose/ProseCode.astro';

export const mdxComponents = {
  a: ProseLink,
  h2: ProseH2,
  h3: ProseH3,
  h4: ProseH4,
  h5: ProseH5,
  h6: ProseH6,
  code: ProseCode,
};
