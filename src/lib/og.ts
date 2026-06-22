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
 * OgImage's styles live in `OgImage.css`, which `juice` inlines onto the markup
 * (satori needs styles on the elements, not in a stylesheet). The portrait is
 * read from `src/assets/` (alongside the fonts) and embedded as a base64 data
 * URI so satori can resolve it without a network fetch.
 *
 * satori can't reference the site's `#longshadow` SVG filter via CSS, so after
 * satori produces the SVG we splice the real filter in (`applyLongShadow`):
 * resvg supports the underlying filter primitives, and the title is found by a
 * sentinel fill color it carries from OgImage.css.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { html as toReactNode } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';
import juice from 'juice';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import OgImage from '../components/OgImage.astro';
import ogImageCss from '../components/OgImage.css?raw';

const assetsDir = join(process.cwd(), 'src/assets');

/** The sentinel fill `.og-title` carries so we can find it in satori's output. */
const TITLE_SENTINEL = '#ff00ff';
/** The real (hollow, near-background) title face the filter extrudes from. */
const TITLE_FILL = '#ffffff';

/**
 * The site's `#longshadow` filter (mirrors src/components/LongShadow.astro),
 * serialized inline so resvg can resolve it. A widened filter region keeps the
 * diagonal extrusion from being clipped.
 */
const LONGSHADOW_FILTER =
  '<filter id="longshadow" x="-20%" y="-20%" width="140%" height="140%">' +
  '<feMorphology in="SourceGraphic" operator="dilate" radius="2" result="expand"/>' +
  '<feOffset in="expand" dx="1" dy="1" result="shadow_1"/>' +
  '<feOffset in="expand" dx="2" dy="2" result="shadow_2"/>' +
  '<feOffset in="expand" dx="3" dy="3" result="shadow_3"/>' +
  '<feOffset in="expand" dx="4" dy="4" result="shadow_4"/>' +
  '<feOffset in="expand" dx="5" dy="5" result="shadow_5"/>' +
  '<feOffset in="expand" dx="6" dy="6" result="shadow_6"/>' +
  '<feOffset in="expand" dx="7" dy="7" result="shadow_7"/>' +
  '<feMerge result="shadow">' +
  '<feMergeNode in="expand"/><feMergeNode in="shadow_1"/><feMergeNode in="shadow_2"/>' +
  '<feMergeNode in="shadow_3"/><feMergeNode in="shadow_4"/><feMergeNode in="shadow_5"/>' +
  '<feMergeNode in="shadow_6"/><feMergeNode in="shadow_7"/>' +
  '</feMerge>' +
  '<feFlood flood-color="#000"/>' +
  '<feComposite in2="shadow" operator="in" result="shadow"/>' +
  '<feMorphology operator="dilate" radius="1" result="border"/>' +
  '<feFlood flood-color="#000"/>' +
  '<feComposite in2="border" operator="in" result="border"/>' +
  '<feMerge>' +
  '<feMergeNode in="border"/><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/>' +
  '</feMerge>' +
  '</filter>';

/**
 * Splice the long-shadow filter into a satori-produced SVG and apply it to the
 * title. satori vectorizes each text block into a flat `<g>` of `<path>` glyphs;
 * the title's glyphs carry `TITLE_SENTINEL`, so we attach the filter to that
 * group and swap the sentinel for the real glyph fill. Other groups are left
 * untouched. (Groups aren't nested, so the per-group regex is unambiguous.)
 */
function applyLongShadow(svg: string): string {
  const withDefs = svg.replace(/(<svg\b[^>]*>)/, `$1<defs>${LONGSHADOW_FILTER}</defs>`);
  return withDefs.replace(/<g\b[^>]*>((?:(?!<\/g>)[\s\S])*)<\/g>/g, (match, inner) => {
    if (!inner.includes(TITLE_SENTINEL)) return match;
    return `<g filter="url(#longshadow)">${inner.split(TITLE_SENTINEL).join(TITLE_FILL)}</g>`;
  });
}

/** Short stand-in src rendered into the markup; the real data URI is injected
 *  onto the parsed <img> node afterward (see renderOgPng). */
const PORTRAIT_PLACEHOLDER = 'portrait';

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

let fontCache: SatoriFont[] | undefined;
async function loadFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;
  const [hegarty, regular, bold] = await Promise.all([
    readFile(join(assetsDir, 'BBHHegarty-Regular.ttf')),
    readFile(join(assetsDir, 'LINESeedJP-Regular.ttf')),
    readFile(join(assetsDir, 'LINESeedJP-Bold.ttf')),
  ]);
  fontCache = [
    { name: 'BBH Hegarty', data: hegarty, weight: 400, style: 'normal' },
    { name: 'LINE Seed JP', data: regular, weight: 400, style: 'normal' },
    { name: 'LINE Seed JP', data: bold, weight: 700, style: 'normal' },
  ];
  return fontCache;
}

let portraitPromise: Promise<string> | undefined;
function loadPortrait(): Promise<string> {
  if (!portraitPromise) {
    portraitPromise = readFile(join(assetsDir, 'donnie.png')).then(
      (buf) => `data:image/png;base64,${buf.toString('base64')}`,
    );
  }
  return portraitPromise;
}

export async function renderOgPng({
  title,
  description,
}: {
  title: string;
  description: string;
}): Promise<Buffer> {
  const [container, portrait, fonts] = await Promise.all([
    getContainer(),
    loadPortrait(),
    loadFonts(),
  ]);

  const html = await container.renderToString(OgImage, {
    props: { title, description, portrait: PORTRAIT_PLACEHOLDER, wordmark: 'donnie.damato.design' },
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
  // portrait data URI (~20s), so OgImage renders a tiny placeholder src and we
  // inject the real data URI onto the parsed <img> node here instead. satori
  // itself decodes the image in ~70ms.
  const markup = toReactNode(decoded);
  setImgSrc(markup, portrait);

  const svg = await satori(markup, { width: 1200, height: 630, fonts });
  return new Resvg(applyLongShadow(svg)).render().asPng();
}

export const ogResponseHeaders = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=31536000, immutable',
} as const;
