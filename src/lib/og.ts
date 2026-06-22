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
    props: { title, description, portrait, wordmark: 'donnie.damato.design' },
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

  const markup = toReactNode(decoded);
  const svg = await satori(markup, { width: 1200, height: 630, fonts });

  return new Resvg(svg).render().asPng();
}

export const ogResponseHeaders = {
  'Content-Type': 'image/png',
  'Cache-Control': 'public, max-age=31536000, immutable',
} as const;
