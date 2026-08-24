# donnie.damato.design

[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)

The personal site of **Donnie D'Amato**, Design Systems Architect, author of *Mise en Mode*,
and international speaker. Live at **[donnie.damato.design](https://donnie.damato.design)**.

## Commands

```bash
npm run dev      # local dev server at http://localhost:4321
npm run build    # astro check (type check) && astro build
npm run preview  # preview the built dist/
```

A green `npm run build` is the bar: it validates every content collection against its Zod
schema. The project uses no `.env` files; the one build-time secret (`CABIN_API_KEY`, for the
Writing page's read counts) is supplied by Netlify and the build degrades gracefully without it.

## What's here

Astro v7, static output, MDX content collections, and a dashboard-shell layout.

- **`src/config.ts`** — identity, social links, nav, scheduling URL. Plain literals, no env vars.
- **`src/pages.config.ts`** — titles, headings, and intros for the static pages.
- **`src/content/`** — the content collections: `projects` (case studies), `decisions`
  (ADR-style records), `journey` (timeline), `speaking` (talks). `writing` has no local files;
  it is pulled from [blog.damato.design](https://blog.damato.design) at build time.
- **`src/layouts/Layout.astro`** — the only layout, a named CSS grid of panels.
- **`src/lib/og.ts`** — generates the Open Graph cards (satori → resvg).

Machine-readable routes are generated alongside the HTML: `/llms.txt`, a `.md` mirror for every
entry, and a per-section OG image.

For architecture, conventions, and the editorial voice, see [CLAUDE.md](./CLAUDE.md).

## Credits

Built on the [Case](https://github.com/erlandv/case) theme by
[Erland](https://erland.me) ([MIT](./LICENSE)). The content model and tooling survive from it;
the presentation has since been rebuilt as a dashboard shell.
