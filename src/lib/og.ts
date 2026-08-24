/**
 * Open Graph image renderer
 *
 * Ported from designsyshouse/behavior.engineering's `src/lib/og.js`. Renders the
 * `OgImage.astro` template to a 1200x630 PNG via the satori -> resvg pipeline:
 *
 *   AstroContainer.renderToString(OgImage)  -> HTML string (inline styles)
 *   satori-html                             -> a vnode tree
 *   satori                                  -> SVG (with brand fonts)
 *   @resvg/resvg-js                         -> PNG buffer
 *
 * The card is the dashboard shell (`Square` + `Grid`) drawn in the CSS subset
 * satori understands, and it is handed the same `grid.config.ts` entry the real
 * page header gets, so the two can't drift.
 *
 * OgImage's styles live in `OgImage.css`, which `juice` inlines onto the markup
 * (satori needs styles on the elements, not in a stylesheet). The media is
 * pre-blended by `src/lib/duotone.ts` and embedded as a base64 data URI, since
 * satori supports neither the grayscale filter nor the blend mode the panel
 * uses, and cannot fetch over the network anyway. The two fonts are not read
 * from disk at all: both come from the site's `fonts:` declaration (see
 * `loadSiteFamily`).
 */
import satori from 'satori';
import { html as toReactNode } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import juice from 'juice';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { fontData, experimental_getFontFileURL } from 'astro:assets';
import type { CssVariable } from 'astro:assets';
import OgImage, { ogCard } from '../components/OgImage.astro';
import type { GridProps } from '../components/Grid.astro';
import ogImageCss from '../components/OgImage.css?raw';
import { cardMedia } from './duotone';

/** Short stand-in src rendered into the markup; the real data URI is injected
 *  onto the parsed <img> node afterward (see renderOgPng). */
const MEDIA_PLACEHOLDER = 'media';

type VNode = { type?: string; props?: { src?: string; children?: unknown } };

/** Set `src` on every <img> in a satori-html vnode tree. */
function setImgSrc(node: unknown, src: string): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child) => setImgSrc(child, src));
    return;
  }
  const v = node as VNode;
  if (v.type === 'img' && v.props) v.props.src = src;
  if (v.props?.children) setImgSrc(v.props.children, src);
}

let containerPromise: ReturnType<typeof AstroContainer.create> | undefined;
function getContainer() {
  if (!containerPromise) containerPromise = AstroContainer.create();
  return containerPromise;
}

type SatoriFont = Parameters<typeof satori>[1]['fonts'][number];

/**
 * Formats satori can parse. Notably **not** woff2, which is what the site serves
 * to browsers, so a family used here must also declare a ttf/otf/woff source.
 */
const SATORI_FORMATS = new Set(['truetype', 'opentype', 'woff']);

/** sfnt signatures: TrueType (0x00010000 and 'true') and CFF ('OTTO'). */
const SFNT_SIGNATURES = new Set([0x00010000, 0x74727565, 0x4f54544f]);

/**
 * Whether the file is a **variable** font, i.e. carries an `fvar` table.
 *
 * satori's opentype.js fork throws parsing the variation tables, so a variable
 * source has to be passed over in favour of a static one. This is a content
 * check rather than a filename or format check because a variable and a static
 * ttf are both `format('truetype')`: nothing in the declaration distinguishes
 * them. A woff/woff2 wrapper is not inspected (the format filter has already
 * excluded woff2, and the sfnt tables sit behind compression in a woff).
 */
function isVariableFont(data: Buffer): boolean {
  if (data.length < 12 || !SFNT_SIGNATURES.has(data.readUInt32BE(0))) return false;
  const numTables = data.readUInt16BE(4);
  if (data.length < 12 + numTables * 16) return false;
  for (let i = 0; i < numTables; i++) {
    if (data.toString('ascii', 12 + i * 16, 16 + i * 16) === 'fvar') return true;
  }
  return false;
}

/**
 * Loads a family the *site* declares in `astro.config.mjs` (`fonts:`), so the
 * card and the pages can't drift onto different faces.
 *
 * `fontData` is keyed by the family's `cssVariable` and lists every variant's
 * sources; `experimental_getFontFileURL` turns one of those into a URL that is
 * fetchable right now (during prerendering Astro serves font files from a
 * temporary local server).
 *
 * A variant's sources are listed browser-best-first, so this walks them in order
 * and keeps the first file satori can actually read, skipping the woff2s (by
 * format) and the variable fonts (by content). Variants with no readable source
 * are skipped, and a family with none at all is a build error rather than a
 * silent fallback to some other face.
 *
 * A variant's declared `weight` may be an axis range ('100 900') rather than a
 * single value; that is meaningless to satori, which is being handed a static
 * file, so an unparseable weight falls back to 400.
 */
async function loadSiteFamily(cssVariable: CssVariable, name: string): Promise<SatoriFont[]> {
  const variants = fontData[cssVariable] ?? [];
  const fonts: SatoriFont[] = [];

  for (const variant of variants) {
    let data: Buffer | undefined;

    for (const source of variant.src) {
      if (!source.format || !SATORI_FORMATS.has(source.format)) continue;

      const url = experimental_getFontFileURL(source.url, undefined);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not fetch ${name} from ${url}: ${response.status} ${response.statusText}`);
      }

      const candidate = Buffer.from(await response.arrayBuffer());
      if (isVariableFont(candidate)) continue;

      data = candidate;
      break;
    }

    if (!data) continue;

    fonts.push({
      name,
      data,
      weight: (Number(variant.weight) || 400) as SatoriFont['weight'],
      style: (variant.style === 'italic' ? 'italic' : 'normal') as SatoriFont['style'],
    });
  }

  if (fonts.length === 0) {
    throw new Error(
      `No satori-readable font file for "${name}" (${cssVariable}). satori reads neither woff2 nor ` +
        `variable fonts, so add a *static* ttf, otf, or woff source alongside whatever the browsers ` +
        `get, in the \`fonts:\` config in astro.config.mjs.`
    );
  }

  return fonts;
}

/**
 * The card's two fonts, both sourced from the site's own `fonts:` declaration so
 * the card and the pages can't drift onto different faces: Kentish for the
 * headline and the metric, Raleway for everything else. These are the only fonts
 * the card uses.
 *
 * Note that the Raleway the config points at is a *static* instance. satori's
 * opentype.js fork throws on a variable font's `fvar`/`gvar` tables, so the
 * declaration must never be pointed back at a variable file.
 */
let fontCache: SatoriFont[] | undefined;
async function loadFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;
  const [kentish, raleway] = await Promise.all([
    loadSiteFamily('--font-kentish', 'Kentish'),
    loadSiteFamily('--font-raleway', 'Raleway'),
  ]);
  fontCache = [...kentish, ...raleway];
  return fontCache;
}

/**
 * A card is a page header plus the address it points at: the `Square` media is
 * the same on every one of them and comes from `cardMedia()`, so it is not a
 * parameter. `url` comes from `ogUrl()` at the call site, which is where the
 * page key and `context.site` are both in hand.
 */
export async function renderOgPng(grid: GridProps, url: string): Promise<Buffer> {
  const [container, blended, fonts] = await Promise.all([
    getContainer(),
    cardMedia(),
    loadFonts(),
  ]);

  const html = await container.renderToString(OgImage, {
    props: { ...grid, url, media: MEDIA_PLACEHOLDER },
  });

  // Astro escapes text nodes (e.g. an apostrophe becomes `&#39;`), and
  // satori-html doesn't decode entities, so it would otherwise rasterize the
  // literal entity. Decode the entities Astro emits in text. We intentionally
  // leave `&lt;`/`&gt;` alone so the HTML structure stays intact for parsing.
  const decoded = juice
    .inlineContent(html.trim(), ogImageCss)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

  // satori-html's HTML parser is pathologically slow on the ~600KB base64
  // data URI (~20s), so OgImage renders a tiny placeholder src and we inject
  // the real data URI onto the parsed <img> node here instead. satori itself
  // decodes the image in ~70ms.
  const markup = toReactNode(decoded);
  setImgSrc(markup, blended);

  const svg = await satori(markup, { width: ogCard.width, height: ogCard.height, fonts });
  return new Resvg(svg).render().asPng();
}

export const ogResponseHeaders = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=31536000, immutable',
} as const;
