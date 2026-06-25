# CLAUDE.md

Guidance for working in this repository.

## What this is

The personal site for **Donnie D'Amato** — Design Systems Architect, author of *Mise en
Mode*, international speaker — served at **https://donnie.damato.design**.

It is built on the third-party Astro theme **"case"** by erlandv (a case-study-first
portfolio theme; see `package.json` `author`/`repository`). The original theme shipped with
placeholder "software engineer" content; this repo replaces all of that with Donnie's real
content while keeping the theme's structure, design, and tooling.

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
literals** in `src/config.ts` (`siteConfig`). There are no `.env` files and no `import.meta.env`
lookups; edit `siteConfig` directly to change identity. `siteConfig` flows into SEO,
`StructuredData.astro`, `Navigation.astro`, the contact page, etc. Nav lives in `siteConfig.nav`.

The **site URL is not in `siteConfig`** — it comes from Astro's built-in `Astro.site`, set by
`site:` in `astro.config.mjs` (the single source). Build any URL variant with
`new URL('/path', Astro.site)` (in API routes, the same value arrives as `context.site`).
`Astro.url` is the current page URL (used for canonical/OG tags). Don't reintroduce a
`siteConfig.url` or manual trailing-slash juggling.

Static page titles/headings/intros live in `src/pages.config.ts` (`pagesConfig`).

### Content collections (`src/content.config.ts`)
All content is MDX in `src/content/<collection>/`, validated by Zod. Collections:

- **projects** — case studies. Rich schema: `title, role, year, outcomeSummary, overview,
  problem, constraints[], approach, keyDecisions[], techStack[], impact{metrics?,
  qualitative}, learnings[], status, order?`.
  `order` drives the manual sort order on the projects listing.
- **decisions** — ADR-style: `title, context, decision, alternatives[], reasoning,
  tags?`.
- **journey** — timeline entries: `date, title, type(milestone|learning|transition),
  description, skills?`. Rendered chronologically on `/journey`.
- **writing** — `title, description, publishDate, updatedDate?, tags?, draft`. Bodies are
  short summaries linking to the full posts on `blog.damato.design`.
- **speaking** — `title, description, event, eventUrl?, date, location, type(conference|
  meetup|podcast|workshop|webinar), slides?, video?, duration?, topics?`.
- **testimonials** — `name, role, company, relationship, quote, linkedin?, date`.

### Pages, layouts, components
- `src/pages/` — `index.astro` (home), `projects/`, `decisions/`, `journey.astro`,
  `writing/[...page].astro` (paginated, 5/page) + `writing/[slug].astro`, `speaking.astro`,
  `contact.astro`, `404.astro`, `robots.txt.ts`.
- `src/layouts/` — `BaseLayout` (the only layout; the theme's unused `ArticleLayout`/
  `CaseStudyLayout` were removed).
- `src/styles/` — `global.css` (CSS custom-property design tokens like `--color-bg`,
  `--color-bg-elevated`, `--color-accent`, `--space-*`; foreground text is derived via
  `contrast-color()`/`currentColor`, not a token. Component styles are scoped `<style>`
  blocks inside `.astro` files.
- The page shell is componentized: `PageContainer.astro` (the centered max-width `<main>`)
  and `PageHeader.astro` (the `<header>` intro block) own their layout as scoped styles —
  there is no global `.page-container`/`.page-header` utility.
- Key components: `SEO.astro`, `StructuredData.astro` (JSON-LD, fully config-driven),
  `Navigation.astro`, `Testimonials.astro`, the unified **`Card` pattern** below (plus
  `CardList` for listings), `Pagination`, `PageStats`, `ForwardLink`, `PageContainer`,
  `PageHeader`, and the **Hero pattern** below.
- **Components own their styling; no consumer `class` prop.** A component does not accept a
  `class`/`className` escape hatch — it carries its own base class (`.card`, `.btn`, `.label`,
  `.section`, ...) and pages hook onto that from their own scoped styles via `:global`,
  scoped under a page-specific ancestor to avoid bleed (e.g. `.case-study :global(.section)`).
- **`Typography` takes only `tagName`** — no `class`, no attribute pass-through. It renders the
  element and applies the editorial `.inline` highlight to block text. If an element needs a
  class or any attribute (href, id, aria-*, ...), author it as a **plain HTML element**, not a
  `<Typography>`. MDX bodies render with **plain HTML** elements (no `components` map passed to
  `<Content />`); there is no `mdxComponents` override layer. The inert `size`/`variant`/`prose`
  props were removed site-wide.

### Card pattern (`src/components/Card.astro`)
There is **one** card component. It is slot-driven and has no per-type variants: a call
site composes a card by filling slots — `badge` (top label row, rendered raw), `meta`
(eyebrow, wrapped in a span so it must be inline text), `title`, `description`, `tags`
(a `TagList`), the default slot (bespoke content), and an optional `cta`. The card itself is
**not** a link; the only interactive element is whatever goes in the `cta` slot (typically a
`<ButtonGroup>` holding a forward `<Button … arrow>`, see the Button group pattern below).
Per-type formatting/maps (date format,
context truncation, talk/timeline type→label/colour, project status) live in
`src/utils/cards.ts` + `src/utils/formatDate.ts` and are applied at the call site.

- `CardList.astro` is the listing shell: it owns the `<ul class="card-list">` wrapper
  (`compact` prop → `--compact`) and the empty-state fallback, auto-detecting emptiness from
  its slot. Callers map their items into `<li><Card/></li>` in the default slot and pass an
  `empty` message. `empty` is optional: omit it when an outer guard already handles the empty
  case (e.g. speaking's per-year lists, which only exist when they have talks), and the list
  renders nothing when empty.
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
hero/section CTAs, the 404 home link, and each card's `cta` slot (a single secondary `sm`
`Button` with `arrow`). `Pagination` and `ScrollToTop` are their own specialized controls and
do **not** use `ButtonGroup`. (`ButtonGroup` replaced the former single-purpose `CardCta`.)

### Hero pattern (`src/components/Hero.astro`)
Reusable two-column promo banner: left = value statement (default slot); right = **the
`aside` slot** (arbitrary content). When the slot is empty the hero is single-column. Props
are `compact` and `divider`.

- `.hero-right` is a flex column, so multiple slotted items stack with gap.
- The former `HeroCard` and the temporary `HeroPlaceholder` have both been **removed**; the
  aside now holds real content (the `Media` component on home/speaking, the `<mode-book>` web
  component on writing).
- Used on **every top-level nav page** (always placed first, before the page header): home
  (`Media` portrait), writing (Mise en Mode book promo + `<mode-book>` embed), speaking
  (Wireframe promo + `Media` sizzle video), and single-column value-statement heroes on
  projects (Cal.com/contact CTA), decisions (Mise en Mode CTA), journey (contact CTA), and
  contact (Cal.com CTA).
- On secondary pages the hero is placed **first** and its heading is an `h2` so the page's
  real `<h1>` (its header) stays the single document h1.

## Content & editorial conventions

- **No em dashes (—) anywhere.** They were deliberately removed site-wide; use commas (or
  colons). Don't reintroduce them in copy. En dashes in ranges ("2019–present") are fine.
- **Dates must match Donnie's LinkedIn résumé** (the source of truth for employment dates).
- **No "DS Events" mentions** — that project was intentionally removed from the site.
- Some content is **inferred/fabricated to fill the theme's IA** and is *not* published fact:
  project `impact.metrics`, the `decisions` and `testimonials` collections, and
  writing `publishDate`s. Testimonials use **non-identifying composite names** on purpose
  (don't attribute invented quotes to real, named people). Treat these as placeholders;
  prefer real data when available, and don't add fabricated quantitative claims beyond the
  existing on-brand ones.
- Real grounding sources: `blog.damato.design` (writing), `mode.place` (the book),
  `wireframe.ds.house` (the show), `ds.house` ecosystem, the LinkedIn résumé.

## Adding content (typical task)
1. Add an MDX file under the right `src/content/<collection>/`; match an existing file's
   frontmatter exactly (schemas are strict — required arrays may be empty but must be valid).
2. For projects, set `order` to control its position in the projects listing.
3. `npm run build` and confirm a green build (no schema errors), then spot-check `dist/`.
