/**
 * Astro Configuration
 *
 * Static site generation with MDX content and a generated sitemap.
 *
 * The site's identity (name, bio, social links, nav) is not configured here: it
 * lives as plain literals in `src/config.ts`. This project uses no `.env` files;
 * the one build-time secret (`CABIN_API_KEY`, for the Writing page's analytics)
 * is provided by the host's environment.
 *
 * @see https://astro.build/config
 */

import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  /** Static Site Generation: every page is pre-rendered at build time. */
  output: 'static',

  /**
   * - MDX: content collections are authored as MDX
   * - Sitemap: generates sitemap.xml / sitemap-index.xml
   */
  integrations: [
    mdx(),
    sitemap({
      // `/og` is the development preview of the Open Graph card template, not a
      // page of the site (it is `noindex` too).
      filter: (page) => !page.endsWith('/og/'),
    }),
  ],

  /**
   * Site URL
   *
   * The single source for the site's origin, exposed as `Astro.site` (and
   * `context.site` in endpoints). Build any variant with
   * `new URL('/path', Astro.site)`. Required by the sitemap, canonical URLs,
   * and Open Graph tags.
   */
  site: 'https://donnie.damato.design',

  /** The in-browser Astro dev toolbar is off during `npm run dev`. */
  devToolbar: {
    enabled: false,
  },

  /**
   * Image optimization
   *
   * Astro's default Sharp service handles format conversion and `srcset`
   * generation; only the overrides are declared here.
   *
   * - `layout: 'constrained'` makes `<Image>` responsive by default: it emits
   *   `srcset`/`sizes` so the image scales down with its container but never
   *   renders above its intrinsic size.
   * - `responsiveStyles` adds the small global stylesheet those layouts need.
   * - `limitInputPixels` caps source images at ~16K x 16K to avoid memory
   *   blowups during the build.
   */
  image: {
    layout: 'constrained',
    responsiveStyles: true,
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689,
      },
    },
  },

  /**
   * Fonts
   *
   * Three families, and no others anywhere on the site: **Kentish**, the display
   * face for headings and titles; **Raleway**, the body face; and **RemixIcon**,
   * the icon face every glyph on the site is drawn from (see `Icon.astro`).
   * `global.css` applies the first two; `Icon.astro` applies the third.
   *
   * Astro serves the files itself, so they live in `src/`, not `public/`: files
   * in `public/` are copied into the build output and would ship twice. `<Font>`
   * in the layout head emits the `@font-face` and the preload link.
   */
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Kentish',
      cssVariable: '--font-kentish',
      // The system faces the browser falls back to while Kentish loads, and if
      // it fails. Astro folds these into the `--font-kentish` variable.
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            // woff2 first, so that is what browsers download. The ttf is here
            // for the OG card renderer: satori reads ttf/otf/woff but not
            // woff2, and sourcing it from this same declaration keeps the card
            // and the site on one font (see src/lib/og.ts).
            src: [
              './src/assets/fonts/Kentish-Regular.woff2',
              './src/assets/fonts/Kentish-Regular.ttf',
            ],
            weight: 400,
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Raleway',
      cssVariable: '--font-raleway',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            // Two sources for one face. Browsers take the variable font (listed
            // first) and vary its wght axis; satori cannot parse a variable
            // font at all, so `loadSiteFamily` skips past it to the static
            // Regular. Keeping both in one declaration is what stops the pages
            // and the OG card drifting onto different faces (see src/lib/og.ts).
            src: [
              './src/assets/fonts/Raleway-Variable.ttf',
              './src/assets/fonts/Raleway-Regular.ttf',
            ],
            // The axis range, not a single weight. This font's default instance
            // is Thin 100, so declaring a bare `400` left browsers free to paint
            // the default master; the range makes `font-weight: 400` land on
            // wght 400, and gives `<strong>` a real 700 instead of a synthesized
            // one.
            weight: '100 900',
            style: 'normal',
          },
        ],
      },
    },
    {
      // Remix Icon (https://remixicon.com), the source of every glyph on the
      // site: the nav/contact brand marks, the button arrows, the disclosure
      // and scroll-to-top chevrons, and the speaking page's slides/video marks.
      // `Icon.astro` owns the name -> codepoint mapping.
      //
      // The shipped file is a *subset*: the full remixicon.woff2 is 185KB for
      // ~3000 glyphs, of which this site draws ten. Regenerate it after adding
      // a name to `Icon.astro` by taking the new codepoints from
      // `node_modules/remixicon/fonts/remixicon.glyph.json` (the `remixicon`
      // devDependency exists only for that file) and running:
      //
      //   pyftsubset node_modules/remixicon/fonts/remixicon.woff2 \
      //     --unicodes=EA4E,EA60,EA6C,EA78,EDCB,EEB6,EF24,F00B,F158,F499 \
      //     --flavor=woff2 --layout-features= --no-hinting --desubroutinize \
      //     --output-file=src/assets/fonts/RemixIcon-Subset.woff2
      //
      // No non-woff2 source is needed: the OG cards carry no icons, so satori
      // never has to read this face (see src/lib/og.ts).
      provider: fontProviders.local(),
      name: 'RemixIcon',
      cssVariable: '--font-remixicon',
      // Nothing sensible can stand in for a glyph face, and the icons are
      // decorative, so a failed load should draw nothing rather than tofu.
      fallbacks: [],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/RemixIcon-Subset.woff2'],
            weight: 400,
            style: 'normal',
          },
        ],
      },
    },
  ],

  /** Shiki syntax highlighting for code blocks in MDX bodies. */
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
});
