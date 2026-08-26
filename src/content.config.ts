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
 * - countries: The countries the blog has been read from, from Cabin analytics
 *
 * `writing` and `countries` have no local files and use custom loaders (see
 * `blogFeedLoader` and `countriesLoader` below); everything else uses the
 * `glob()` loader over MDX files.
 *
 * **One vocabulary.** Every collection that renders a page header uses the same
 * key for the same region (`panelFields` below), so nothing has to be remapped
 * between frontmatter and `Grid`: a page, a case study, and a decision record
 * all spell the headline `headline`, the summary `description`, and the panel's
 * closing paragraph `intro`. What a detail page does not author is filled in
 * **here**, by a `.default()` or the schema's own `.transform()`, rather than by
 * an adapter module downstream. The only things still resolved at render time
 * are the ones a schema genuinely cannot see: a metric that counts another
 * collection, and the section page a detail page inherits its artwork from
 * (both in `utils/collections.ts`).
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
import { siteConfig } from '@/config';
import { getBlogAnalytics } from '@utils/analytics';

/**
 * Every collection, and so every figure a `metric` can count.
 *
 * `count` takes any name in this list, which is why there is no second metric
 * form for build-time figures: a number worth putting in a panel is a number of
 * *things*, and the things live in a collection (see `countriesLoader` below,
 * which is what turned "countries the blog was read from" into one of these).
 *
 * Kept in step with the `collections` export at the bottom of this file; the
 * `satisfies` there is what fails the build if the two drift apart.
 */
const COLLECTIONS = [
  'pages',
  'projects',
  'decisions',
  'journey',
  'writing',
  'speaking',
  'countries',
] as const;

/** A collection name a `metric` may count. */
export type CountableCollection = (typeof COLLECTIONS)[number];

/** The collection listings a page's `<main>` can render. */
const LISTINGS = ['projects', 'decisions', 'journey', 'writing', 'speaking'] as const;

/**
 * Embeds: the media a frontmatter field cannot express as a file.
 *
 * The value names a custom element and the module that defines it; `Media`
 * renders the pair. Adding one is a line here plus a line there.
 */
export const EMBEDS = {
  'mode-book': 'https://mode.place/mode-book.js',
} as const;

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
  href: z
    .string()
    // Annotated, because the lookup's own type is the one named link's literal
    // and every other href would be typed out of existence by it.
    .transform((href): string => namedLinks[href as keyof typeof namedLinks] ?? href),
  /** Open in a new tab (adds the matching `rel`). */
  external: z.boolean().optional(),
});

/**
 * The panel's headline metric: a figure to count, or one to state.
 *
 * `{ count: 'projects', label: 'projects' }` is resolved against the collection
 * at build time, so the number can never go stale, and `{ value: 2021 }` is for
 * a figure nothing can count (a project's year, the years in the practice).
 *
 * A count of zero drops the region rather than printing "0": an empty
 * collection is either a build that could not reach its source (see
 * `countriesLoader`) or nothing worth a headline.
 */
const metricSchema = z.union([
  z.object({
    /** A figure nothing can count. A string keeps approximations like "~500". */
    value: z.union([z.string(), z.number()]),
    /** What the figure counts. Omit for a bare figure. */
    label: z.string().optional(),
  }),
  z.object({
    /** Collection to count at build time. */
    count: z.enum(COLLECTIONS),
    /** What the figure counts. Omit for a bare figure. */
    label: z.string().optional(),
  }),
]);

/** The embed names, as the non-empty tuple `z.enum` wants. */
const EMBED_NAMES = Object.keys(EMBEDS) as [keyof typeof EMBEDS, ...(keyof typeof EMBEDS)[]];

/**
 * The `Square` panel's media, in whatever form the page has: a named embed, a
 * remote file, or a local asset resolved relative to the MDX file.
 *
 * There is deliberately **one** key rather than an `image`/`video`/`embed`
 * triple: which element a value needs is something the value itself says, so
 * `Media` reads it off the value rather than off the key it arrived under. The
 * branches are ordered narrowest first, so a mistyped local path fails as a
 * missing image instead of being accepted as a plain string.
 */
const mediaSchema = ({ image }: SchemaContext) =>
  z.union([z.enum(EMBED_NAMES), z.url(), image()]);

/** Meta tags. Both fields default from the entry when it doesn't name them. */
const seoSchema = z.object({
  /** `<title>` and the Open Graph title. */
  title: z.string().optional(),
  /** Meta description. Defaults to the entry's own `description`. */
  description: z.string().optional(),
  /** Skip the " | <author>" suffix (home represents the site itself). */
  noSuffix: z.boolean().default(false),
});

/** An entry after parsing, with the fields `fillSeo` reads and writes. */
interface SeoBearing {
  title: string;
  description?: string;
  seo?: z.infer<typeof seoSchema>;
}

/**
 * Fills the SEO block from the entry, so only a page that wants something
 * *different* from its own copy has to write one.
 *
 * This is the schema's job rather than a route's: the block is derived from
 * fields the same object already carries, which is exactly what a `.transform()`
 * can see.
 */
function fillSeo<T extends SeoBearing>(data: T, title: string): T & { seo: Required<z.infer<typeof seoSchema>> } {
  return {
    ...data,
    seo: {
      title: data.seo?.title ?? title,
      description: data.seo?.description ?? data.description ?? siteConfig.description,
      noSuffix: data.seo?.noSuffix ?? false,
    },
  };
}

/**
 * The page header panel, as frontmatter.
 *
 * Every collection with a page of its own spreads this, so one key means one
 * thing everywhere: the `pages` entries, the case studies, and the decision
 * records are all authored in the same words and all reach `Grid` without a
 * translation step. A collection then adds what only it has (a project's `role`
 * and `year`, a page's `listing`) and narrows what it needs to (`description`
 * is required on an entry, defaulted on a page).
 *
 * @param context - Astro's schema context, whose `image()` resolves a path
 *   relative to the MDX file into `ImageMetadata` so it goes through
 *   `astro:assets`.
 */
const panelFields = (context: SchemaContext) => ({
  /** The panel's <h1>, and the entry's name everywhere else. */
  title: z.string(),

  /** The promotional headline, rendered as the panel's <h2>. */
  headline: z.string().optional(),

  /**
   * The summary: supporting copy under the headline, and the copy the listing
   * card, the SEO description, and the machine-readable mirrors all read.
   * A `\n` is a deliberate line break.
   */
  description: z.string().optional(),

  /** The panel's link row. */
  cta: z.array(ctaSchema).optional(),

  /** The panel's headline metric. */
  metric: metricSchema.optional(),

  /** The panel's closing paragraph, beside the metric. */
  intro: z.string().optional(),

  /**
   * Decorative artwork blended into the panel's identity region, resolved
   * relative to this MDX file. Each top-level page carries its own, which is
   * what makes the header read differently from section to section; a detail
   * page inherits its section's.
   */
  backdrop: context.image().optional(),

  /** The `Square` panel's media. A detail page inherits its section's. */
  media: mediaSchema(context).optional(),

  /** Text alternative for `media`. Defaults to the entry title. */
  mediaAlt: z.string().optional(),

  /** Meta tags. Derived from the entry when absent. */
  seo: seoSchema.optional(),
});

/**
 * Pages Collection
 *
 * The site's top-level pages as content: the home page and the five collection
 * listings. Each entry's **id is its route**: `projects/index.mdx` -> `/projects`, and the
 * root `index.mdx` -> `/` (keyed `home`). Its frontmatter is the page header panel plus the SEO
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
  schema: (context) =>
    z
      .object({
        ...panelFields(context),

        /** Defaults to the site's own, which is what home wants. */
        title: z.string().default(siteConfig.title),

        /** Defaults to the site's own, which is what home wants. */
        description: z.string().default(siteConfig.description),

        /** The collection listing to render into `<main>`, if any. */
        listing: z.enum(LISTINGS).optional(),
      })
      .transform((data) =>
        fillSeo(data, `${siteConfig.author.name} - ${siteConfig.author.title}`)
      ),
});

/**
 * Projects (Case Studies) Collection
 *
 * The case study itself lives in the MDX **body** as markdown, following the
 * narrative order Overview -> Problem -> Constraints -> Approach -> Key Decisions ->
 * Result & Impact -> Learnings, closing with the first-person "story behind it".
 *
 * Frontmatter is the page header panel (see `panelFields`) plus the two fields
 * only a case study has: `role` and `year`. `description` is the outcome
 * summary, which is also the listing card's copy and the SEO description, and
 * `year` is the listing's sort key (a project states it as its `metric` too,
 * since a metric is display copy and a sort key is data).
 */
const projectsCollection = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!index.mdx'], base: './src/content/projects' }),
  schema: (context) =>
    z
      .object({
        ...panelFields(context),

        /** The outcome summary. Required: the card and SEO read it too. */
        description: z.string(),

        /**
         * The panel's link row. A detail page has a back link at the foot of
         * `<main>` already, so the default row is the one thing a case study
         * should offer that the page doesn't.
         */
        // The default names the resolved URL rather than `@scheduling`: a
        // Zod default is the parsed value, so it never passes back through the
        // `namedLinks` transform above.
        cta: z
          .array(ctaSchema)
          .default([{ label: 'Work with me', href: siteConfig.scheduling, external: true }]),

        /** Your role in the project. Also the listing card's eyebrow. */
        role: z.string(),

        /** Year the project was completed. The projects listing's sort key. */
        year: z.number(),

        /** Technologies and approaches. Renders as the card/detail TagList. */
        tags: z.array(z.string()).default([]),
      })
      .transform((data) => fillSeo(data, `${data.title} - Case Study`)),
});

/**
 * Decisions Collection
 *
 * The record itself lives in the MDX **body** as markdown: Decision (a
 * blockquote) -> Alternatives Considered (one pros/cons table per option) ->
 * Reasoning -> Why it mattered.
 *
 * Frontmatter is the page header panel (see `panelFields`) and nothing else.
 * `description` is the record's context, which is also the listing card's copy
 * and the SEO description. There is deliberately no default metric: a decision
 * record has no figure worth a headline.
 */
const decisionsCollection = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!index.mdx'], base: './src/content/decisions' }),
  schema: (context) =>
    z
      .object({
        ...panelFields(context),

        /** The record's context. Required: the card and SEO read it too. */
        description: z.string(),

        /** Tags for categorization. Renders as the card/detail TagList. */
        tags: z.array(z.string()).default([]),
      })
      .transform((data) => fillSeo(data, `${data.title} - Decision Record`)),
});

/**
 * Journey Timeline Collection
 *
 * Career growth and learning progression timeline with milestones,
 * learning experiences, and career transitions. These entries have a listing
 * card but no page of their own, so they carry no panel fields.
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

    /** Skills and technologies. Renders as the card's TagList. */
    tags: z.array(z.string()).default([]),
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
    tags: z.array(z.string()).default([]),

    /** Canonical URL of the full post on the blog */
    url: z.url(),
  }),
});

/**
 * Countries loader
 *
 * The countries the blog has been read from, one entry each, from Cabin's
 * site-wide analytics (`utils/analytics.ts`).
 *
 * This is a collection rather than a special kind of metric because that is
 * what it is: a set of things the build can count. `{ count: 'countries' }` in
 * the Writing page's frontmatter then reads exactly like `{ count: 'projects' }`
 * and needs no second code path.
 *
 * Failure is soft, like the feed's: no API key or an unreachable Cabin leaves
 * the collection empty, the count is zero, and the panel drops the metric region
 * rather than printing a figure the build could not measure.
 */
const countriesLoader = (): Loader => ({
  name: 'blog-countries',
  load: async ({ store, parseData, generateDigest, logger }) => {
    const analytics = await getBlogAnalytics();

    if (!analytics) {
      logger.warn('No blog analytics; the country count will be omitted.');
      return;
    }

    store.clear();

    for (const name of analytics.countries) {
      const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const data = await parseData({ id, data: { name } });
      store.set({ id, data, digest: generateDigest(data) });
    }

    logger.info(`Loaded ${analytics.countries.length} countries from blog analytics.`);
  },
});

/**
 * Countries Collection
 *
 * One entry per country the blog has been read from. Nothing renders these
 * entries; they exist to be counted (see `countriesLoader`).
 */
const countriesCollection = defineCollection({
  loader: countriesLoader(),
  schema: z.object({
    /** The country, as Cabin reports it. */
    name: z.string(),
  }),
});

/**
 * Speaking/Talks Collection
 *
 * Conference talks, meetup presentations, podcast appearances, and workshops.
 * Like `journey`, these have a listing card but no page of their own, so they
 * carry no panel fields.
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

    /** Link to a video recording (optional) */
    video: z.url().optional(),

    /** Talk duration (e.g., "45 min", "1 hour") */
    duration: z.string().optional(),

    /** Topics covered. Renders as the card's TagList. */
    tags: z.array(z.string()).default([]),
  }),
});

/**
 * Export all collections
 *
 * This object is what Astro reads to register the collections and generate the
 * types behind `getCollection`/`getEntry`. The `satisfies` pins its keys to
 * `COLLECTIONS`, the list a `metric` counts against, so adding a collection
 * without listing it there (or the reverse) is a build error.
 */
export const collections = {
  pages: pagesCollection,
  projects: projectsCollection,
  decisions: decisionsCollection,
  journey: journeyCollection,
  writing: writingCollection,
  speaking: speakingCollection,
  countries: countriesCollection,
} satisfies Record<CountableCollection, unknown>;
