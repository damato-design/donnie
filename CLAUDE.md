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

- **Astro v5** (static output), **MDX**, **@astrojs/sitemap**, **sharp** for images.
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

### Identity is config-driven (4 mirrored sources)
Author name, title, bio, email, location, social links, and site metadata come from
**environment variables**, read in `src/config.ts` (`siteConfig`) via `import.meta.env`.

The **same values are defined in four places** and must be kept in sync when changed:
1. `.env` — the actual build-time source (git-ignored). **This is what renders.**
2. `.env.example` — documented template.
3. `src/config.ts` — `getEnv(KEY, fallback)` fallbacks.
4. `astro.config.mjs` — `env.schema` `default:` values (Astro typed env).

Changing identity (e.g. email) means editing `.env` for it to take effect, plus the other
three for a clean fresh-clone fallback. `siteConfig` flows into SEO, `StructuredData.astro`,
`Navigation.astro`, the contact page, etc. Nav lives in `siteConfig.nav`.

Static page titles/headings/intros live in `src/pages.config.ts` (`pagesConfig`).

### Content collections (`src/content.config.ts`)
All content is MDX in `src/content/<collection>/`, validated by Zod. Collections:

- **projects** — case studies. Rich schema: `title, role, year, outcomeSummary, overview,
  problem, constraints[], approach, keyDecisions[], techStack[], impact{metrics?,
  qualitative}, learnings[], featured, status, order?, relatedProjects?, relatedDecisions?`.
  `featured` + `order` drive the homepage hero cards.
- **decisions** — ADR-style: `title, date, context, decision, alternatives[], reasoning,
  tags?, relatedProjects?, relatedDecisions?`.
- **journey** — timeline entries: `date, title, type(milestone|learning|transition),
  description, skills?`. Rendered chronologically on `/journey`.
- **writing** — `title, description, publishDate, updatedDate?, tags?, draft`. Bodies are
  short summaries linking to the full posts on `blog.damato.design`.
- **speaking** — `title, description, event, eventUrl?, date, location, type(conference|
  meetup|podcast|workshop|webinar), slides?, video?, duration?, topics?, featured`.
- **uses** — `category(tools|stack|environment), items[{name, description, url?}], order`.
- **testimonials** — `name, role, company, relationship, quote, linkedin?, featured, date`.

Cross-references (`relatedProjects`/`relatedDecisions`) use the file slug (filename without
extension). A dangling reference to a deleted slug will break related-content rendering —
update both sides when renaming/deleting.

### Pages, layouts, components
- `src/pages/` — `index.astro` (home), `projects/`, `decisions/`, `journey.astro`,
  `writing/[...page].astro` (paginated, 5/page) + `writing/[slug].astro`, `speaking.astro`,
  `uses.astro`, `contact.astro`, `404.astro`, `robots.txt.ts`.
- `src/layouts/` — `BaseLayout`, `PageLayout`, `ArticleLayout`, `CaseStudyLayout`.
- `src/styles/` — `global.css`, `typography.css`, `utilities.css` (CSS custom-property
  design tokens like `--color-text`, `--color-bg-secondary`, `--space-*`). Most component
  styles are scoped `<style>` blocks inside `.astro` files.
- Key components: `SEO.astro`, `StructuredData.astro` (JSON-LD, fully config-driven),
  `Navigation.astro`, `Testimonials.astro`, `TalkCard`, `ArticleCard`, `ProjectCard`,
  `DecisionCard`, `Pagination`, `PageStats`, `ForwardLink`, and the **Hero pattern** below.

### Hero / HeroCard pattern (`src/components/Hero.astro`, `HeroCard.astro`)
Reusable two-column promo banner: left = value statement (`title`, `emphasis`, `subtitle`,
`meta`, `primary`/`secondary` CTAs); right = **the `aside` slot** (arbitrary content). When
the slot is empty the hero is single-column. Props also include `headingLevel` (1 or 2),
`compact`, `divider`.

- The right column has **no `cards` prop** — pass `<HeroCard slot="aside" … />` (or any
  markup). `.hero-right` is a flex column, so multiple slotted items stack with gap.
- `HeroCard` is its own component because **slotted content does not inherit Hero's scoped
  CSS** — the card must carry its own styles.
- Used on: home (featured-project cards), writing (Mise en Mode book), speaking (Wireframe),
  contact (single-column, Cal.com CTA, no card).
- On secondary pages the hero is placed **first** and uses `headingLevel={2}` so the page's
  real `<h1>` (its header) stays the single document h1.

## Content & editorial conventions

- **No em dashes (—) anywhere.** They were deliberately removed site-wide; use commas (or
  colons). Don't reintroduce them in copy. En dashes in ranges ("2019–present") are fine.
- **Dates must match Donnie's LinkedIn résumé** (the source of truth for employment dates).
- **No "DS Events" mentions** — that project was intentionally removed from the site.
- Some content is **inferred/fabricated to fill the theme's IA** and is *not* published fact:
  project `impact.metrics`, the `decisions`, `uses`, and `testimonials` collections, and
  writing `publishDate`s. Testimonials use **non-identifying composite names** on purpose
  (don't attribute invented quotes to real, named people). Treat these as placeholders;
  prefer real data when available, and don't add fabricated quantitative claims beyond the
  existing on-brand ones.
- Real grounding sources: `blog.damato.design` (writing), `mode.place` (the book),
  `wireframe.ds.house` (the show), `ds.house` ecosystem, the LinkedIn résumé.

## Adding content (typical task)
1. Add an MDX file under the right `src/content/<collection>/`; match an existing file's
   frontmatter exactly (schemas are strict — required arrays may be empty but must be valid).
2. For projects, set `featured`/`order` if it should appear in the homepage hero.
3. Wire any `relatedProjects`/`relatedDecisions` by slug on both sides.
4. `npm run build` and confirm a green build (no schema errors), then spot-check `dist/`.
