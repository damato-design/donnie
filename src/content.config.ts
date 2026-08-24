/**
 * Content Collections Configuration
 *
 * Defines every content collection and its Zod schema.
 *
 * Collections:
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

/**
 * Projects (Case Studies) Collection
 *
 * The case study itself lives in the MDX **body** as markdown, following the
 * narrative order Overview -> Problem -> Constraints -> Approach -> Key Decisions ->
 * Result & Impact -> Learnings, closing with the first-person "story behind it".
 *
 * Frontmatter holds only what something other than the prose needs to read:
 * the page header panel (title, role, year, outcomeSummary), the listing card
 * (role, year, outcomeSummary, techStack), the year sort, and SEO/JSON-LD.
 */
const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
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
 * tags), and SEO/JSON-LD.
 */
const decisionsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/decisions' }),
  schema: z.object({
    /** Decision title. Renders as the detail page's <h1>. */
    title: z.string(),

    /** Context and background. Doubles as the card copy and SEO description. */
    context: z.string(),

    /** Optional tags for categorization. Renders as the card/detail TagList. */
    tags: z.array(z.string()).optional(),
  }),
});

/**
 * Journey Timeline Collection
 *
 * Career growth and learning progression timeline with milestones,
 * learning experiences, and career transitions.
 */
const journeyCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/journey' }),
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
  loader: glob({ pattern: '**/*.mdx', base: './src/content/speaking' }),
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
  projects: projectsCollection,
  decisions: decisionsCollection,
  journey: journeyCollection,
  writing: writingCollection,
  speaking: speakingCollection,
};
