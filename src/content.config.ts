/**
 * Content Collections Configuration
 *
 * Defines every content collection and its Zod schema.
 *
 * Collections:
 * - pages: The top-level pages themselves (home + the five listings)
 * - projects: Case studies with the narrative in the MDX body
 * - decisions: Architectural and technical decision records
 * - journey: Career timeline entries
 * - writing: Blog post previews, fetched from the blog feed at build time
 * - speaking: Conference talks and presentations
 *
 * Everything except `writing` uses the `glob()` loader over MDX files; `writing`
 * has no local files and uses a custom loader (see `blogFeedLoader` below).
 *
 * @module content.config
 */

// `z` comes from `astro/zod`, not from `astro:content`: that re-export is
// deprecated in Astro 7 and warns on every use.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import type { SchemaContext } from 'astro/content/config';
import type { CtaLink, GridProps } from '@components/Grid.astro';
import { siteConfig } from '@/config';

/**
 * Page-header frontmatter, shared by the two collections with detail pages
 * (`projects` and `decisions`) so the same key means the same thing in both.
 *
 * A detail page derives its whole header from the entry: `Square`'s media, and
 * `Grid`'s headline, description, CTA row, metric, and anecdote. These fields
 * are **overrides** on that derivation, and every one of them is optional. Left
 * out (the normal case), a region keeps the value the page computes, so nothing
 * has to be restated in frontmatter just to render. Set one, and it wins for
 * that region only; the rest still come from the entry.
 *
 * `title` is deliberately not overridable here: it is the entry's `title`, which
 * the listing card and SEO also read, so the panel can't drift from them.
 *
 * The regions mirror `GridProps` in `Grid.astro`, and the two structured ones
 * are pinned to it with `satisfies` rather than described twice; `grid.config.ts`
 * merges these over the computed defaults (see `projectGrid`/`decisionGrid`).
 *
 * @param image - Astro's schema-context helper, which resolves a path relative
 *   to the MDX file into `ImageMetadata` so the image goes through
 *   `astro:assets`.
 */
const panelFields = ({ image }: SchemaContext) => ({
  /**
   * Media for this entry's `Square` panel, as a path relative to the MDX file
   * (e.g. `../../assets/thing.jpg`). Left out, the detail page falls back to
   * whatever its listing page shows.
   */
  image: image().optional(),

  /** Text alternative for `image`. Defaults to the entry title. */
  imageAlt: z.string().optional(),

  /** Promotional headline, rendered as the panel's <h2>. No default. */
  headline: z.string().optional(),

  /** Supporting copy under the headline. Overrides the computed byline. */
  description: z.string().optional(),

  /**
   * The panel's link row. Replaces the default row wholesale.
   *
   * `satisfies` ties the schema to `CtaLink` rather than restating it: adding a
   * field to the panel's own type without adding it here is a build error, so
   * frontmatter and the component can't drift.
   */
  cta: z
    .array(
      z.object({
        /** Link text. */
        label: z.string(),
        /** Destination, a site path or an absolute URL. */
        href: z.string(),
        /** Open in a new tab (adds the matching `rel`). */
        external: z.boolean().optional(),
      }) satisfies z.ZodType<CtaLink>
    )
    .optional(),

  /** The headline metric. Overrides the computed count. */
  metric: z
    .object({
      /** The figure itself. A string keeps approximations like "~500". */
      value: z.union([z.string(), z.number()]),
      /** What the figure counts. */
      label: z.string(),
    })
    .optional() satisfies z.ZodType<GridProps['metric']>,

  /** The panel's intro paragraph. Overrides the entry's summary/context. */
  anecdote: z.string().optional(),
});

/**
 * Named destinations, so a page's frontmatter can point at a configured value
 * instead of copying it. `href: '@scheduling'` resolves to
 * `siteConfig.scheduling`; anything else is passed through as written.
 *
 * This exists because YAML cannot reference `config.ts`. Without it, moving the
 * page panels into content would have meant pasting the booking URL into two
 * MDX files and letting them drift from the one in `siteConfig`.
 */
const namedLinks = {
  '@scheduling': siteConfig.scheduling,
} as const;

/** One link in a panel's CTA row, with `@name` destinations resolved. */
const ctaSchema = z.object({
  /** Link text. */
  label: z.string(),
  /** A site path, an absolute URL, or a `@name` from `namedLinks`. */
  href: z.string().transform((href) => namedLinks[href as keyof typeof namedLinks] ?? href),
  /** Open in a new tab (adds the matching `rel`). */
  external: z.boolean().optional(),
});

/**
 * The panel's headline metric.
 *
 * Two forms, because most of them are live counts rather than authored figures:
 * `{ count: 'projects', label: 'projects' }` is resolved against the collection
 * at build time, so the number can never go stale, while
 * `{ value: 25, label: 'years' }` is for a figure nothing can count.
 */
const metricSchema = z.union([
  z.object({
    /** A figure nothing can count. A string keeps approximations like "~500". */
    value: z.union([z.string(), z.number()]),
    label: z.string(),
  }),
  z.object({
    /** Collection to count at build time. */
    count: z.enum(['projects', 'decisions', 'journey', 'writing', 'speaking']),
    label: z.string(),
  }),
]);

/**
 * Pages Collection
 *
 * The site's top-level pages as content: the home page and the five collection
 * listings. Each entry's **id is its route** (`projects.mdx` -> `/projects`,
 * `home.mdx` -> `/`), its frontmatter is the page header panel plus the SEO
 * block, and its body is whatever prose `<main>` carries beyond the generated
 * listing (which is all of it on the home page, and none of it on the others).
 *
 * `src/pages/[...slug].astro` renders every one of them, which is why there are
 * no per-section `index.astro` files and no `pages.config.ts`.
 *
 * Identity still lives in `config.ts`: a field left out here falls back to the
 * configured value (see the `.default()`s below), and a CTA can point at one
 * through `namedLinks` rather than copying it.
 */
const pagesCollection = defineCollection({
  loader: glob({
    // The site root, then one per section. `*/index.mdx` matches exactly one
    // directory deep, so a collection's own entries are never caught by it.
    pattern: ['index.mdx', '*/index.mdx'],
    base: './src/content',
    /**
     * The entry's id is its route: `index.mdx` is the site root and every
     * `<section>/index.mdx` is `/<section>`. The root would otherwise be the
     * empty string, which is no use as a key, so it is named `home`.
     */
    generateId: ({ entry }) => entry.replace(/\/?index\.mdx$/, '') || 'home',
  }),
  schema: ({ image }) => z.object({
    /** The panel's <h1>. Defaults to the site title, which is what home wants. */
    title: z.string().default(siteConfig.title),

    /** The promotional headline, rendered as the panel's <h2>. */
    headline: z.string().optional(),

    /**
     * Supporting copy under the headline. A `
` is a deliberate line break.
     * Defaults to the site description, which is what home wants.
     */
    description: z.string().default(siteConfig.description),

    /** The panel's link row. */
    cta: z.array(ctaSchema).optional(),

    /** The panel's headline metric. */
    metric: metricSchema.optional(),

    /** The panel's intro paragraph. */
    intro: z.string().optional(),

    /** Meta tags. Both fields fall back to the site's own. */
    seo: z
      .object({
        title: z.string().default(`${siteConfig.author.name} - ${siteConfig.author.title}`),
        description: z.string().default(siteConfig.description),
        /** Skip the " | <author>" suffix (home represents the site itself). */
        noSuffix: z.boolean().default(false),
      })
      .default({
        title: `${siteConfig.author.name} - ${siteConfig.author.title}`,
        description: siteConfig.description,
        noSuffix: false,
      }),

    /**
     * The `Square` panel's media. Exactly one of these, or none for a bare
     * panel. `image` is resolved relative to this MDX file and goes through
     * `astro:assets`; `video` is a remote URL; `embed` names one of the two
     * pieces of markup a frontmatter field cannot express.
     */
    image: image().optional(),
    imageAlt: z.string().optional(),
    video: z.string().optional(),
    videoAlt: z.string().optional(),
    embed: z.enum(['editable-style', 'mode-book']).optional(),

    /** The collection listing to render into `<main>`, if any. */
    listing: z.enum(['projects', 'decisions', 'journey', 'writing', 'speaking']).optional(),
  }),
});

/**
 * Projects (Case Studies) Collection
 *
 * The case study itself lives in the MDX **body** as markdown, following the
 * narrative order Overview -> Problem -> Constraints -> Approach -> Key Decisions ->
 * Result & Impact -> Learnings, closing with the first-person "story behind it".
 *
 * Frontmatter holds only what something other than the prose needs to read:
 * the page header panel (title, role, year, outcomeSummary), the listing card
 * (role, year, outcomeSummary, techStack), the year sort, and SEO/JSON-LD,
 * plus the optional `panelFields` overrides above.
 */
const projectsCollection = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!index.mdx'], base: './src/content/projects' }),
  schema: (context) => z.object({
    /** Project title. Renders as the detail page's <h1>. */
    title: z.string(),

    /** Your role in the project */
    role: z.string(),

    /** Year the project was completed. Also the projects listing's sort key. */
    year: z.number(),

    /** Brief summary of outcomes and impact. Doubles as the SEO description. */
    outcomeSummary: z.string(),

    /** Technologies and frameworks used. Renders as the card/detail TagList. */
    techStack: z.array(z.string()),

    // Optional page-header overrides, identical in shape to `decisions`.
    ...panelFields(context),
  }),
});

/**
 * Decisions Collection
 *
 * The record itself lives in the MDX **body** as markdown: Decision (a
 * blockquote) -> Alternatives Considered (one pros/cons table per option) ->
 * Reasoning -> Why it mattered.
 *
 * Frontmatter holds only what something other than the prose needs to read:
 * the page header panel (title, context), the listing card (title, context,
 * tags), and SEO/JSON-LD, plus the optional `panelFields` overrides above.
 */
const decisionsCollection = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!index.mdx'], base: './src/content/decisions' }),
  schema: (context) => z.object({
    /** Decision title. Renders as the detail page's <h1>. */
    title: z.string(),

    /** Context and background. Doubles as the card copy and SEO description. */
    context: z.string(),

    /** Optional tags for categorization. Renders as the card/detail TagList. */
    tags: z.array(z.string()).optional(),

    // Optional page-header overrides, identical in shape to `projects`.
    ...panelFields(context),
  }),
});

/**
 * Journey Timeline Collection
 *
 * Career growth and learning progression timeline with milestones,
 * learning experiences, and career transitions.
 */
const journeyCollection = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!index.mdx'], base: './src/content/journey' }),
  schema: z.object({
    /** Date of the timeline entry */
    date: z.coerce.date(),

    /** Entry title */
    title: z.string(),

    /** Type of timeline entry */
    type: z.enum(['milestone', 'learning', 'transition']),

    /** Brief description */
    description: z.string(),

    /** Skills or technologies associated with this entry */
    skills: z.array(z.string()).optional(),
  }),
});

/** The blog's "standard site" feed, the source for the `writing` collection. */
const BLOG_FEED_URL = 'https://blog.damato.design/standard-site.json';

/** The shape of one document in that feed (only the fields we map). */
interface FeedDocument {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags?: string[];
}

/**
 * Blog feed loader
 *
 * Articles are not authored locally: they are pulled from the blog at build
 * time and surfaced as previews that link out to the full posts.
 *
 * Written as an object loader (rather than an inline function) so it can use the
 * loader context: `meta` persists the feed's ETag between builds so an unchanged
 * feed costs a 304 instead of a re-parse, `parseData` validates each document
 * against the collection schema as it is stored, and `logger` reports through
 * Astro's own build output.
 *
 * Failure is soft by design: a missing or unreachable feed (building offline,
 * the blog down) logs a warning and leaves whatever is already in the store, so
 * a third party can never break a deploy.
 */
const blogFeedLoader = (): Loader => ({
  name: 'blog-feed',
  load: async ({ store, meta, parseData, generateDigest, logger }) => {
    try {
      const etag = meta.get('etag');
      const response = await fetch(BLOG_FEED_URL, {
        headers: etag ? { 'If-None-Match': etag } : {},
      });

      if (response.status === 304) {
        logger.info(`Blog feed unchanged; reusing ${store.keys().length} stored articles.`);
        return;
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const { siteUrl, documents } = (await response.json()) as {
        siteUrl: string;
        documents: FeedDocument[];
      };

      store.clear();

      for (const doc of documents) {
        const data = await parseData({
          id: doc.slug,
          data: {
            title: doc.title,
            description: doc.description,
            publishDate: doc.publishedAt,
            tags: doc.tags ?? [],
            url: `${siteUrl}/posts/${doc.slug}`,
          },
        });
        store.set({ id: doc.slug, data, digest: generateDigest(data) });
      }

      const newEtag = response.headers.get('etag');
      if (newEtag) meta.set('etag', newEtag);

      logger.info(`Loaded ${documents.length} articles from the blog feed.`);
    } catch (error) {
      logger.warn(
        `Could not fetch the blog feed (${BLOG_FEED_URL}); the Writing page will render with whatever is cached. ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  },
});

/**
 * Writing (Blog) Collection
 *
 * Previews of posts that live on blog.damato.design. Each entry links out to
 * the full post via `url`; there are no MDX bodies to render.
 */
const writingCollection = defineCollection({
  loader: blogFeedLoader(),
  schema: z.object({
    /** Article title */
    title: z.string(),

    /** Article description for SEO and previews */
    description: z.string(),

    /** Original publication date */
    publishDate: z.coerce.date(),

    /** Tags for categorization */
    tags: z.array(z.string()).optional(),

    /** Canonical URL of the full post on the blog */
    url: z.url(),
  }),
});

/**
 * Speaking/Talks Collection
 *
 * Conference talks, meetup presentations, podcast appearances, and workshops.
 */
const speakingCollection = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!index.mdx'], base: './src/content/speaking' }),
  schema: z.object({
    /** Talk title */
    title: z.string(),

    /** Talk description */
    description: z.string(),

    /** Event website URL (optional) */
    eventUrl: z.url().optional(),

    /** Date of the talk */
    date: z.coerce.date(),

    /** Location (city, country, or "Online") */
    location: z.string(),

    /** Type of speaking engagement */
    type: z.enum(['conference', 'meetup', 'podcast', 'workshop', 'webinar']),

    /** Link to slides (optional) */
    slides: z.url().optional(),

    /** Link to video recording (optional) */
    video: z.url().optional(),

    /** Talk duration (e.g., "45 min", "1 hour") */
    duration: z.string().optional(),

    /** Topics covered in the talk */
    topics: z.array(z.string()).optional(),
  }),
});

/**
 * Export all collections
 *
 * This object is what Astro reads to register the collections and generate the
 * types behind `getCollection`/`getEntry`.
 */
export const collections = {
  pages: pagesCollection,
  projects: projectsCollection,
  decisions: decisionsCollection,
  journey: journeyCollection,
  writing: writingCollection,
  speaking: speakingCollection,
};
