# CLAUDE.md

Guidance for working in this repository.

## What this is

The personal site for **Donnie D'Amato** — Design Systems Architect, author of *Mise en
Mode*, international speaker — served at **https://donnie.damato.design**.

It began as the third-party Astro theme **"case"** by erlandv (a case-study-first portfolio
theme; see `package.json` `author`/`repository`), whose placeholder "software engineer"
content was replaced with Donnie's real content. The theme's *presentation* has since been
replaced too: the site is now a **dashboard shell** (see "The dashboard shell" below) rather
than the theme's centered-column layout. What survives from the theme is the content model
and the tooling.

> The git history also contains the *previous* version of donnie.damato.design (a simpler
> "desk/paper" site with an Expertise/Projects/Media/Connect IA). Those files are deleted in
> the working tree but recoverable via `git show HEAD:...` if ever needed.

## Tech stack & commands

- **Astro v7** (static output), **MDX**, **@astrojs/sitemap**, **sharp** for images.
- `npm run dev` — local dev server.
- `npm run build` — runs **`astro check` (type check) && `astro build`**. A green build is
  the bar; it validates every content collection against its Zod schema.
- `npm run preview` — preview the built `dist/`.

### Environment gotchas (Windows)
- **Use the PowerShell tool for git and npm.** The Bash tool fails on git invocations here
  with an `fnm` "can't find the necessary environment variables" error. Bash is fine for
  read-only POSIX text processing (grep/loops over `dist/`), but run git/npm via PowerShell.
- When scripting file rewrites in PowerShell, write UTF-8 **without BOM**
  (`New-Object System.Text.UTF8Encoding($false)` + `[System.IO.File]::WriteAllText`).

## Architecture

### Identity is config-driven (single source, no env)
Author name, title, bio, email, location, social links, and site metadata are **plain
literals** in `src/config.ts` (`siteConfig`). Identity uses no env vars; edit `siteConfig`
directly to change it. (The project uses **no `.env` files at all**. Its only env var is
`CABIN_API_KEY`, a build-time secret for blog analytics that the host supplies, unrelated to
identity; see "Build-time data" below.) `siteConfig` flows into SEO,
`StructuredData.astro`, `Nav.astro`, `Contact.astro`, etc. Nav lives in `siteConfig.nav`, and
the Cal.com booking URL in `siteConfig.scheduling`.

There is **no `/contact` page**. It was replaced by `Contact.astro`, a bar the layout renders
on every page (social links + "Schedule a chat"), so `siteConfig.nav` has no Connect entry and
`pagesConfig` has no `contact` key.

The **site URL is not in `siteConfig`** — it comes from Astro's built-in `Astro.site`, set by
`site:` in `astro.config.mjs` (the single source). Build any URL variant with
`new URL('/path', Astro.site)` (in API routes, the same value arrives as `context.site`).
`Astro.url` is the current page URL (used for canonical/OG tags). Don't reintroduce a
`siteConfig.url` or manual trailing-slash juggling.

Static page titles/headings/intros live in `src/pages.config.ts` (`pagesConfig`).

The **page header panel's copy** lives in `src/grid.config.ts` (`gridContent`): one
`GridProps`-shaped entry per top-level page (headline, description, CTA row, metric,
anecdote), reading `pagesConfig`/`siteConfig` rather than restating them. Every page passes
its entry straight through (`grid={gridContent.projects}`), and the **Open Graph card renders
the same entry**, so a card can't advertise something the page no longer says. Every metric
is a plain collection count, so `gridContent` resolves those itself with `getCollection` and
the pages keep only the sorting their listings need. Don't move panel copy back into a page.

**Detail pages get their panel from the same module**, one step later: `projectGrid(entry)`
and `decisionGrid(entry)` derive a `GridProps` from a collection entry (the role/year byline
with reading time, the tech-stack or tag count as the metric, the summary or context as the
anecdote) and then merge the entry's own optional `panelFields` frontmatter over it, region by
region, via `withOverrides`. So `[slug].astro` is just `grid={projectGrid(project)}`: no panel
copy, no reading-time math, and an MDX file can change any region of its own header without
touching a page. Keep new panel derivations here rather than inlining them in a route.

Both are imported through the **`@/*` path alias** (`@/config`, `@/pages.config`), alongside
the existing `@components/*`, `@layouts/*`, `@utils/*`, `@assets/*`, `@styles/*` aliases in
`tsconfig.json`. Don't reach for `../../config` or a bare `src/config` specifier.

### Content collections (`src/content.config.ts`)
All content is MDX in `src/content/<collection>/`, validated by Zod — **except `writing`**,
which has no local files and is fetched at build time from the blog feed (see "Build-time data"
below). Collections:

**projects and decisions keep their substance in the MDX body as markdown**, not in
frontmatter (see "Markdown-first bodies" below). Their frontmatter is deliberately thin: only
what something *other than the prose* has to read.

- **projects** — case studies. Required frontmatter is only `title, role, year,
  outcomeSummary, techStack[]`. `title`/`role`/`year`/`outcomeSummary` feed the page header
  panel and the listing card, `outcomeSummary` doubles as the SEO description, `techStack` is
  the card's `TagList` and the panel's metric, and `year` sorts the listing (newest first).
- **decisions** — ADR-style. Required frontmatter is only `title, context, tags?`; `context`
  doubles as the card copy and the SEO description.
- **Both also take `panelFields`**, the shared block of **optional page-header overrides**
  defined once in `content.config.ts` and spread into each schema, so the same key means the
  same thing in both: `image?, imageAlt?, headline?, description?, cta?, metric?, anecdote?`.
  A detail page **derives** its whole header from the entry, and these only *override* a
  region of that derivation, so an entry never restates what the page already computes.
  Normally every one of them is absent.
  - `image?`/`imageAlt?` are `Square`'s media, and the reason both schemas take the
    `(context) => …` form: `image()` resolves a path **relative to the MDX file**
    (`../../assets/thing.jpg`) into `ImageMetadata`, so a per-entry image goes through
    `astro:assets` like every other local image. Without `image`, the detail page **falls
    back to whatever its listing page puts in `Square`** (`EditableStyle` for projects,
    `uxdx.jpg` for decisions), so a section reads as one place. `imageAlt` defaults to the
    entry title.
  - The rest mirror `GridProps` region for region, and `grid.config.ts` merges them over the
    computed panel in `projectGrid`/`decisionGrid` (see "The dashboard shell"). A present
    field replaces its region **wholesale**: a `cta` array is the whole row, not an addition
    to the default one. `title` is deliberately **not** overridable, since the listing card
    and SEO read the same field.
- **journey** — timeline entries: `date, title, type(milestone|learning|transition),
  description, skills?`. Rendered chronologically on `/journey`.
- **writing** — **not authored locally**: `blogFeedLoader` in `content.config.ts` pulls posts at
  build time from the blog feed (`blog.damato.design/standard-site.json`). Schema: `title,
  description, publishDate, tags?, url`. Each entry is a preview that links out to the full post
  via `url`; there are no MDX bodies. It is an **object loader**, not an inline function, so it
  can use the loader context: `meta` persists the feed's ETag between builds (an unchanged feed
  costs a 304), `parseData` validates each document as it is stored, and `logger` reports through
  Astro's build output. Keep it that way if you extend it.
- **speaking** — `title, description, event, eventUrl?, date, location, type(conference|
  meetup|podcast|workshop|webinar), slides?, video?, duration?, topics?`.

There is no **testimonials** collection. Its `Testimonials.astro` renderer, schema, and three
placeholder entries were all deleted; don't reintroduce it without real, attributable quotes.

`journey` and `speaking` are still frontmatter-driven (they have listing cards but no detail
pages); only `projects` and `decisions` moved to markdown bodies.

### Build-time data: blog feed & analytics
Two build-time fetches power the Writing page. Both run **only at build** (numbers are "as of
last build") and both **fail soft** so a green build never depends on a third party being up:

- **Blog feed** — the `writing` collection loader fetches `blog.damato.design/standard-site.json`
  and maps each post to a preview entry (`url = <siteUrl>/posts/<slug>`).
- **Cabin analytics** — `src/utils/analytics.ts` (`getBlogAnalytics()`) fetches per-post read
  counts (`scope=pages`) from the Cabin API for `blog.damato.design`, authorized by the **build
  secret** `CABIN_API_KEY` (read from `process.env`; set in Netlify, never committed, not
  `PUBLIC_`-prefixed, and there is no `.env` file). A missing key or any error returns `null` and
  the page renders without analytics. `getPageStat()` joins Cabin's `/posts/<slug>` rows to
  entries by path. The `scope=core` call (site-wide reads, country count) and per-post dwell time
  were removed along with the UI that showed them; don't reintroduce either.

`writing/index.astro` shows the **top 10 posts by Cabin reads** (ties break by date; falls back
to most-recent-by-date when analytics is `null`). Each card's `meta` is `<date> · <N> reads`,
so analytics still drives both the ranking and the per-card counts. The panel's metric is a
plain article count; the former reach line (`<reads> · read in <N> countries`) was dropped when
`PageStats` gave way to `Grid`'s single value+label metric. A closing CTA links to the full
chronological archive on the blog. **Do not** reintroduce pagination or per-post dwell time (both
removed — dwell time measured time-on-page, not reading length, and read as misleading).

To refresh this without a code change, a **Netlify Scheduled Function**
(`netlify/functions/weekly-rebuild.mjs`, weekly cron) POSTs to a Netlify build hook
(URL in the `BUILD_HOOK_URL` env var) to trigger a rebuild. There is no GitHub Action.

### The dashboard shell (`src/layouts/Layout.astro`)
`Layout` is the **only** layout, and every page of the site uses it (the lone exception is
`og/index.astro`, the OG card development preview; see "Pages & components").
`global.css` lays `<body>` out as a
named CSS grid, and each panel is a component the layout places into one area:

```
'nav     contact'   Nav.astro      Contact.astro
'square  grid'      Square.astro   Grid.astro
'main    toc'       <main>         Toc.astro
```

**Placement lives in `global.css`, not in the components.** Each panel carries a plain class
(`.nav`, `.contact`, `.square`, `.grid`, `.main`, `.toc`) and `global.css` assigns its
`grid-area` next to the `grid-template-areas` that names it. There is no `area` prop and no
inline `style="grid-area: …"`; a new panel gets a class and a rule.

`Layout` renders every panel itself and takes the page-specific ones as **props**: `grid`
(required, the page header's content) and `headings`/`tocMaxDepth` (the table of contents). Only
`head`, `media`, and `main` are slots, because only they carry markup. A page therefore imports
`Layout` and its own content components, never a shell panel.

- **`Grid`** is the page-header panel and the *only* page-header primitive (it replaced the
  former `Hero`, `PageHeader`, and `PageStats`, all deleted). It is **entirely props, no slots**,
  so a page passes frontmatter or a `pagesConfig` entry straight through `Layout`'s `grid` prop:
  `title` (the page's single `<h1>`), `headline` (an `<h2>`), `description`, `cta`, `metric`
  (`{ value, label }`), and `anecdote`. Content inside `<main>` therefore starts at `<h2>`. Every
  region except `title` is optional and omitted when absent; the anecdote spans the full row when
  there is no metric. `Layout` types that prop with `GridProps`, exported from `Grid.astro`.
  - **The text props take no markup.** They render as text, so an `<em>` or a `<br>` in a
    headline is not an option. A deliberate line break is a **`\n` in the string**, which the
    panel honors via `white-space: pre-line`.
  - **`cta` is data, not elements**: `CtaLink[]` (`{ label, href, external? }`), and `Grid` adds
    `target`/`rel` for the external ones. Don't pass `<a>` or `<Button>` here.
- **`Square`** is the media panel: a decorative blob with the page's media stacked over it
  (they share one grid cell). This is where the old `Hero`'s `aside` content went, the `Media`
  portrait/photos and the `<mode-book>` embed. Detail pages pass nothing, leaving just the blob.
- **`Toc`** is the in-page table of contents, built from a **document-ordered** `headings:
  MarkdownHeading[]` prop that `Layout` takes and forwards. `buildTocTree` (`src/utils/toc.ts`)
  nests the flat list by attaching each heading to the nearest preceding shallower one, and
  `TocList` renders it recursively via `Astro.self`. `Toc` renders **nothing** when the list is
  empty, so a page opts out by passing no headings.
  - `maxDepth` (via `Layout`'s `tocMaxDepth`) caps the listed levels; it defaults to **3**, one
    section heading plus the cards under it.
  - **MDX-backed pages get it free:** `const { Content, headings } = await render(entry)`, then
    `<Layout headings={headings}>`. Astro slugs each heading and emits the matching `id`. Both
    detail pages pass `tocMaxDepth={2}`, because their `###`s are one-sentence key-decision /
    alternative titles that would swamp the panel.
  - **Pages authored in `.astro`** have no `render()` to slug anything, so they declare the
    array by hand, and it is the *single source* for the TOC link and for the `id` on the
    target, so the two can't drift. Anchors land on an `<h2 id={…}>` or, for a card, on
    `<Card id={…}>` (`TimelineEntry` forwards its `id` through to the card).
  - **`depth` describes the TOC's structure, not the rendered element.** Card titles are always
    `<h3>`s, but a card is `depth: 3` when it sits under a section heading (speaking's talks
    under their year, writing's articles under "Top N Articles") and `depth: 2` when the page
    has no headings at all and the cards *are* the sections (projects, decisions, journey).
  - Building a mixed page's array in document order is what makes the nesting work: speaking
    does `years.flatMap((year) => [yearHeading, ...talksInThatYear])`.

`global.css` holds the grid areas, the `--grid-*`/`--dash-*` palette, and a short list of
element defaults the `<main>` content needs (`blockquote`, markdown `table` borders, the
`<details>` animation `Disclosure` relies on). **`--bgcolor` is a placeholder**: `Card`,
`Button`, and friends still paint against it, and it currently just tracks `--dash-bg` until
those components are restyled for the shell.

> **Slot gotcha.** `Astro.slots.has(name)` reflects what the *immediate caller* wrote, so it is
> only trustworthy when the component is composed directly by the page. A layout that forwards a
> sub-component's slots (`<Fragment slot="x"><slot name="x" /></Fragment>`) makes `has()` true on
> every page, which is why `Grid` once rendered each region to a string and tested that instead.
> Props don't have this problem: they forward through a layout cleanly, which is why `Grid` is
> props and `Layout` can own it. **Prefer a prop for anything a layout has to pass through**, and
> reserve slots for regions that genuinely hold markup (`head`, `media`, `main`).

### Pages & components
- `src/pages/` — `index.astro` (home), then one folder per collection, each with an
  `index.astro` listing: `projects/` and `decisions/` (which also have a `[slug].astro` detail
  page), `journey/`, `speaking/`, and `writing/` (a single curated page, no pagination). Plus
  `404.astro` and the machine-readable routes (`llms.txt.ts`, `robots.txt.ts`,
  `og/[page].png.ts`, and a `[slug].md.ts` per collection).
- **`og/index.astro` is a development surface, not a page of the site.** It renders
  `OgImage.astro` as live HTML at 1200x630 for every card, so the template can be iterated
  on with hot reload instead of a satori render per change. It is therefore the **one page
  that doesn't use `Layout`** (the shell would style the card out from under itself); it is
  `noindex`, and `astro.config.mjs` passes `sitemap()` a `filter` that drops `/og/`.
  Because the browser is not satori, the page re-creates the two things the renderer does
  after Astro is finished, and its file comment says so: it injects `OgImage.css` with
  `is:inline` (it is a `juice` stylesheet, not a scoped one), and points the card's literal
  `'Kentish'`/`'Raleway'` families at the `--font-*` variables, since Astro's Fonts API emits
  **hashed** `@font-face` family names that those literals never match in a browser. The
  duotone media needs no such treatment: both paths call the same `cardMedia()`, so the
  preview carries the PNG's own pixels (which is also why it is a megabyte and a half of
  inline base64, fine for a page only ever opened locally).
- **Every card shows the same portrait**, the one the home page's `Square` carries: what
  distinguishes a card is the content on the right, and half the pages put something
  unrasterizable in `Square` anyway (`EditableStyle`, the `<mode-book>` embed, a streaming
  sizzle reel). That makes the media a constant, so it lives in `duotone.ts` beside the blend
  rather than in a map, `renderOgPng` takes a bare `GridProps`, and both routes derive their
  card list straight from `Object.entries(gridContent)`. There is no `og/_pages.ts`.
- Components: `SEO`, `StructuredData` (JSON-LD, config-driven), the shell panels above, the
  **`Card` pattern** below (plus `CardList`), `Button`/`ButtonGroup`/`ArrowIcon`, `TagList`/
  `Label`, `Media`, `TimelineEntry`/`Disclosure`, `ScrollToTop`, `EditableStyle`, and
  `OgImage` (used **only** by the OG-image pipeline in `src/lib/og.ts` and its `/og` preview,
  not by any page stylesheet).
- **`OgImage` is the dashboard shell redrawn in satori's CSS subset**, not a card design of
  its own: `Square` on the left at 55%, `Grid` on the right (eyebrow `title`, Kentish
  `headline`, description, page URL, then the metric + anecdote row), with `Props extends
  Omit<GridProps, 'cta'>` so it is handed what the panel is handed.
  - **Where the panel puts its CTA links, the card puts the page's address.** Nothing in a
    PNG is clickable, so a "Explore my work" label is a dead end; the destination is the half
    worth showing. `ogUrl(page, site)` (exported from `OgImage.astro`, so both routes share
    it) formats it as host plus path, no scheme, and `home` resolves to the bare host. The
    origin comes from `Astro.site` / `context.site`, never a literal.
  - Three things can't survive the translation, each commented in the files: the panel
    gradient is painted **once** on the right column with the 2px seams drawn as borders
    (satori has no `background-attachment: fixed`, and per-region gradients step at every
    seam); a `\n` becomes a `<div>` per line rather than `white-space: pre-line`; and the
    duotone media arrives **pre-blended** from `src/lib/duotone.ts`, which reproduces
    `Media`'s `grayscale(1)` + `mix-blend-mode: overlay` with sharp, because satori supports
    neither filters nor blend modes.
  - Values in `OgImage.css` are `global.css`'s `em`s resolved against the site's 16px base,
    which works because the card's 1200px is also `body`'s `max-width`: the card is the page
    at 1:1, not a scaled-up variant.
  - There is **no long-shadow treatment and no wordmark** on the card; `LongShadow.astro` and
    the magenta-sentinel post-processing in `og.ts` were deleted with them.
- **Components own their styling; no consumer `class` prop.** A component does not accept a
  `class`/`className` escape hatch — it carries its own base class (`.card`, `.btn`, `.label`,
  ...) and pages hook onto that from their own scoped styles via `:global`, scoped under a
  page-specific ancestor to avoid bleed. `Card`'s (and `TimelineEntry`'s) optional **`id`** is
  not an exception to this: it identifies the card as an anchor target for the TOC, it does not
  style it.
- **Props are typed, never `[key: string]: unknown`.** A component that forwards extra
  attributes extends Astro's own element types instead of an index signature, which silently
  disables prop checking: `interface Props extends Omit<HTMLAttributes<'a'>, 'href' | 'type'>`
  (`Button`), `HTMLAttributes<'video'>` (`Media`). Every component declares a `Props` interface,
  including slot-only ones, so a stale prop at a call site is a build error.
- **Local images go through `astro:assets`.** Import the asset and pass the `ImageMetadata`
  itself (`import portrait from '@assets/donnie.png'` → `<Media src={portrait} …/>`), never
  `portrait.src`, which skips Sharp entirely. `Media` renders `<Image>` for an imported asset
  (optimized formats, `srcset`, intrinsic dimensions) and a plain element for a string path or a
  remote URL, which is the only route for video and audio. `image.layout: 'constrained'` in
  `astro.config.mjs` makes those images responsive by default.
- **Fonts go through Astro's Fonts API, never hand-rolled `@font-face`.** There are exactly two
  families, both declared in `astro.config.mjs` under `fonts:` (local provider, files in
  `src/assets/fonts/`) and emitted by `<Font>` in `Layout`'s head: **Kentish**, the display face
  (`--font-kentish`), which `global.css` applies to `:is(h1,h2,h3,h4,h5,h6)` only, and
  **Raleway**, the body face (`--font-raleway`), set on `body`. **No other font is used
  anywhere**, on the pages or on the OG cards. Font files live in `src/`, not `public/`: Astro
  copies them into the build itself, so `public/` would ship them twice.
  - Kentish has only weight 400, so the heading rule pins `font-weight: 400` and
    `font-synthesis-weight: none` to stop browsers faking a bold. Adding a real bold means a
    second `variant` in the config, then relaxing that pin. Raleway is variable across
    `100 900`, so body copy needs no such pin and `<strong>` gets a real 700.
  - **The OG cards read the same declarations**, they don't keep their own copies: `og.ts`'s
    `loadSiteFamily()` pulls a family out of `fontData` (from `astro:assets`, keyed by the
    `cssVariable`) and fetches the file via `experimental_getFontFileURL()`, which Astro serves
    from a temporary local server during prerendering. The card is Kentish for the title and
    Raleway for the body, matching the pages; nothing is read off disk.
  - **satori cannot read woff2**, only ttf/otf/woff, so the Kentish variant lists *both* a woff2
    and a ttf source: browsers take the woff2 (listed first), `loadSiteFamily` filters for the
    truetype one. A family used on an OG card must always carry a non-woff2 source, or the build
    fails with that message rather than silently swapping faces.
  - **satori also cannot read a *variable* font**: its opentype.js fork throws on the `fvar`
    tables. Raleway's variant therefore lists **two truetype sources**,
    `Raleway-Variable.ttf` then `Raleway-Regular.ttf`: browsers take the variable one (listed
    first) and vary its axis, while `loadSiteFamily` skips past it to the static Regular.
    Because both are `format('truetype')`, nothing in the *declaration* tells them apart, so
    `og.ts` detects the variable one **by content** (`isVariableFont` looks for an `fvar`
    table) rather than by filename or format.
  - **Declare a variable font's weight as its axis range (`'100 900'`), not a single value.**
    Raleway's default instance is **Thin 100**, so a bare `weight: 400` left browsers painting
    the default master: the body copy rendered Thin while claiming to be Regular. The range
    makes `font-weight: 400` actually land on wght 400. `Raleway-Regular.ttf` is the genuine
    static Regular from Google Fonts (v4.026, `usWeightClass 400`), *not* an instance cut
    locally: dropping a variable font's variation tables yields its **default** master, which
    for Raleway is Thin, not Regular.
- **Plain HTML elements, no text primitive.** The former `Typography` component (and its
  `.inline` editorial highlight) was **deleted**; author `<h2>`, `<p>`, `<li>` directly. None
  of its styles were carried into `global.css` — that was deliberate, so headings and body copy
  currently inherit whatever the shell gives them. MDX bodies likewise render with plain HTML
  (no `components` map passed to `<Content />`); there is no `mdxComponents` override layer.

### Card pattern (`src/components/Card.astro`)
There is **one** card component. It is slot-driven and has no per-type variants: a call
site composes a card by filling slots — `badge` (top label row, rendered raw), `meta`
(eyebrow, wrapped in a span so it must be inline text), `title`, `description`, `tags`
(a `TagList`), the default slot (bespoke content), and an optional `cta`. The card itself is
**not** a link; the only interactive element is whatever goes in the `cta` slot (typically a
`<ButtonGroup>` holding a forward `<Button … arrow>`, see the Button group pattern below).
Date formatting lives in `src/utils/formatDate.ts` and is applied at the call site.

- `CardList.astro` is the listing shell: it owns the `<ul class="card-list">` wrapper and its
  layout. Callers map their items into `<li><Card/></li>` in the default slot. Its one prop is
  **`compact`**, which tightens the cards by setting the custom properties `Card` reads
  (`--card-padding`, `--card-title-size`), so the list never reaches into the card's own styles;
  `Card` falls back to its defaults when they're unset. There is **no empty state**: every
  listing is populated, and an outer guard covers the cases that aren't (e.g. speaking's per-year
  lists, which only exist when they have talks).
- Used directly on: projects, decisions, writing (listings) and speaking (one `CardList` per
  year group), all via `CardList`; `TimelineEntry` renders a `Card` for its content area
  inside the dot/line rail on `/journey`.
- Block content (a flex row with `<time>`/labels) must go in the `badge` or default slot,
  **not** `meta` (which is wrapped in an inline span).

### Button group pattern (`src/components/ButtonGroup.astro`, `Button.astro`)
`Button` is the action primitive (filled `primary`/outline `secondary`, `sm` size, optional
`arrow` prop that appends the shared `ArrowIcon`). **Whenever you place one or two buttons,
wrap them in `<ButtonGroup>`** — the slot-driven flex wrapper that owns their layout (gap +
wrapping); it carries its own scoped `.button-group` style and accepts no `class`. Used for
section CTAs, and each card's `cta` slot (a single secondary `sm` `Button` with `arrow`).
`ScrollToTop` is its own specialized control and does **not** use `ButtonGroup`.
(`ButtonGroup` replaced the former single-purpose `CardCta`.)

**`Grid`'s own `cta` slot is the exception**: it lays its children out itself and takes plain
`<a>` elements, so don't wrap those in a `ButtonGroup` or a `Button`.

## Content & editorial conventions

- **No em dashes (—) anywhere.** They were deliberately removed site-wide; use commas (or
  colons). Don't reintroduce them in copy. En dashes in ranges ("2019–present") are fine.
- **Dates must match Donnie's LinkedIn résumé** (the source of truth for employment dates).
- **No "DS Events" mentions** — that project was intentionally removed from the site.
- **Design Systems House (DSH) is not a project entry** — it houses projects rather than being
  one, so it was removed from `projects` and lives only as a `journey` milestone (plus
  references in `decisions`/`speaking`).
- **Project entries were reviewed with Donnie for accuracy** (2026); their copy and the
  Result & Impact figures are real, confirmed facts (e.g. GoDaddy's ~500 Intent tokens,
  Roxor's ~70% of charts, Gridless cited by Brad Frost, Christine Vallaure & Figma). **Donnie
  is the source of truth; don't invent metrics or claims — ask him.**
- Still **inferred/fabricated to fill the theme's IA** and *not* published fact: the
  `decisions` collection and writing `publishDate`s. Treat these as placeholders; prefer real
  data when available. (The fabricated `testimonials` collection was deleted outright rather
  than left in place. Never attribute invented quotes to real, named people.)
- Real grounding sources: `blog.damato.design` (writing), `mode.place` (the book),
  `wireframe.ds.house` (the show), `ds.house` ecosystem, the LinkedIn résumé.

## Messaging & voice
- **Throughline: "creativity within constraints."** Donnie's core positioning: the best work
  comes from limits, not from adding more (fewer tokens in Mise en Mode, no grid in Gridless,
  no custom CSS in the DAMATO design system, near-zero taps in willarrive). It bridges his
  artist origin and his systems work, and is anchored in `siteConfig.description`,
  `siteConfig.author.bio`, the home anecdote, and the `/projects` panel. Lead new value statements
  with this angle; **avoid the cliché "taming chaos / order from a mess"** framing.
- **Avoid "scale" / "scalable" / "scales" in voice copy** (Donnie dislikes the buzzword); use
  "grow," "goes further," "across an organization," etc. Legitimate technical terms are fine
  (`initial-scale`, `grayscale`, a type/z-index scale), and **factual records stay verbatim**
  (e.g. the real talk "Scaling Your Design Systems").
- Role focus is **design systems + shaping how AI behaves**, layered on the constraints
  throughline.

## Markdown-first bodies (projects & decisions)

**This convention was inverted.** The case study and the decision record used to live in
structured frontmatter, with the body reserved for the first-person story. They now live in
the **MDX body as markdown**; frontmatter keeps only what the panel, the listing card, and SEO
read. Don't add narrative fields back to the schemas.

**Project bodies** follow this order, all `##` (the panel owns the `<h1>`):

```
## Overview      prose
## Problem       a > blockquote
## Constraints   a bullet list
## Approach      prose
## Key Decisions one ### per decision, each followed by a Reasoning|Alternatives table
## Result & Impact   a bullet list of **Label:** value, then the qualitative prose
## Learnings     a bullet list
## The story behind it   the first-person story (see below)
```

**Decision bodies**: `## Decision` (a `>` blockquote) → `## Alternatives Considered` (one
`###` per option, each followed by a 👍 Pros | 👎 Cons table) → `## Reasoning` →
`## Why it mattered`.

Table conventions, because GFM cells can't hold block content:
- A cell holding several items joins them with **`<br/>`** — self-closing, since MDX requires
  valid JSX. A bare `<br>` is a build error.
- The old `SplitTable`'s title spanning both columns becomes an **`###` heading above the
  table**; no markdown table can express a spanning cell.
- Escape any literal `|` inside a cell.

`## The story behind it` closes each project with the first-person material the structured
sections can't hold: origin/motivation (the natural home for name origins, e.g.
willarrive/deltazeus/nextup), optionally **one vivid unique detail/anecdote**, and a **closing
live link only when a public artifact exists** (omit for archived/employment entries).
**No "How might we…" pull-quotes** — removed site-wide.

Because the prose is markdown now, inline backticks, links, and emphasis render properly. They
were displayed literally back when the same text was a YAML string.

`src/utils/llms.ts` reflects this split: `renderProject`/`renderDecision` emit a small
frontmatter header plus `entry.body` verbatim, while `renderJourney`/`renderSpeaking` still
serialize structured fields. Keep that in step when a schema changes.

## Adding content (typical task)
1. Add an MDX file under the right `src/content/<collection>/`; match an existing file's
   frontmatter exactly (schemas are strict — required arrays may be empty but must be valid).
2. For **projects and decisions**, write the substance as markdown in the **body**, following
   the section order in "Markdown-first bodies" above. Required frontmatter is only the five
   /three fields the panel, card, and SEO read; the `panelFields` block (`image`, `imageAlt`,
   `headline`, `description`, `cta`, `metric`, `anecdote`) is optional and normally left out,
   so the header derives from the entry. Add one only to change that region for this entry.
   For `journey` and `speaking`, it's still all frontmatter.
3. Projects are sorted by `year` (newest first); set `year` accordingly.
4. `npm run build` and confirm a green build (no schema errors), then spot-check `dist/`.
