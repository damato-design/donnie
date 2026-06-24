/**
 * Content Collections Configuration
 * 
 * Defines all content collections for the site with their schemas and validation rules.
 * Uses Astro's Content Collections API with Zod for type-safe content management.
 * 
 * Collections:
 * - projects: Case studies with structured narrative format
 * - decisions: Architectural and technical decision records
 * - journey: Career timeline entries
 * - writing: Blog posts and articles
 * - speaking: Conference talks and presentations
 * - testimonials: Endorsements and recommendations
 * 
 * All collections use the glob loader to read MDX files from their respective directories.
 * Schemas enforce data structure and provide TypeScript types throughout the application.
 * 
 * @module content.config
 */

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Projects (Case Studies) Collection
 * 
 * Structured case studies following a narrative format: Overview → Problem → 
 * Constraints → Approach → Key Decisions → Tech Stack → Impact → Learnings.
 * 
 * Features:
 * - Required narrative sections for consistent storytelling
 * - Key decisions with reasoning and alternatives
 * - Impact metrics (quantitative and qualitative)
 * - Optional custom order for manual curation
 * - Related project and decision slugs for cross-referencing
 */
const projectsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    /** Project title */
    title: z.string(),
    
    /** Your role in the project */
    role: z.string(),
    
    /** Year the project was completed */
    year: z.number(),
    
    /** Project duration (e.g., "3 months", "1.5 years") */
    duration: z.string().optional(),
    
    /** Team size for scope context */
    teamSize: z.number().optional(),
    
    /** Brief summary of outcomes and impact */
    outcomeSummary: z.string(),
    
    /** High-level project overview */
    overview: z.string(),
    
    /** Problem being addressed */
    problem: z.string(),
    
    /** Project constraints and limitations */
    constraints: z.array(z.string()),
    
    /** Solution approach and strategy */
    approach: z.string(),
    
    /** Key technical decisions with reasoning */
    keyDecisions: z.array(z.object({
      decision: z.string(),
      reasoning: z.string(),
      alternatives: z.array(z.string()).optional(),
    })),
    
    /** Technologies and frameworks used */
    techStack: z.array(z.string()),
    
    /** Project impact and results */
    impact: z.object({
      /** Quantitative metrics (optional) */
      metrics: z.array(z.object({
        label: z.string(),
        value: z.string(),
      })).optional(),
      /** Qualitative impact description */
      qualitative: z.string(),
    }),
    
    /** Key learnings and takeaways */
    learnings: z.array(z.string()),

    /** Project status */
    status: z.enum(['completed', 'ongoing', 'archived']).default('completed'),
    
    /** Custom sort order (lower numbers first) */
    order: z.number().optional(),
    
    /** Related project slugs for cross-referencing */
    relatedProjects: z.array(z.string()).optional(),
    
    /** Related decision slugs for cross-referencing */
    relatedDecisions: z.array(z.string()).optional(),
  }),
});

/**
 * Decisions Collection
 * 
 * Architectural and technical decision records documenting the context,
 * decision made, alternatives considered, and reasoning.
 * 
 * Features:
 * - Context and decision documentation
 * - Alternatives with pros/cons analysis
 * - Reasoning explanation
 * - Optional tags for categorization
 * - Related project and decision slugs for cross-referencing
 */
const decisionsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/decisions' }),
  schema: z.object({
    /** Decision title */
    title: z.string(),
    
    /** Date the decision was made */
    date: z.coerce.date(),
    
    /** Context and background for the decision */
    context: z.string(),
    
    /** The decision that was made */
    decision: z.string(),
    
    /** Alternative options considered */
    alternatives: z.array(z.object({
      option: z.string(),
      pros: z.array(z.string()).optional(),
      cons: z.array(z.string()).optional(),
    })),
    
    /** Reasoning behind the decision */
    reasoning: z.string(),

    /** Why the decision mattered (closing reflection) */
    whyItMattered: z.string(),

    /** Optional tags for categorization */
    tags: z.array(z.string()).optional(),
    
    /** Related project slugs for cross-referencing */
    relatedProjects: z.array(z.string()).optional(),
    
    /** Related decision slugs for cross-referencing */
    relatedDecisions: z.array(z.string()).optional(),
  }),
});

/**
 * Journey Timeline Collection
 * 
 * Career growth and learning progression timeline with milestones,
 * learning experiences, and career transitions.
 * 
 * Features:
 * - Three entry types (milestone, learning, transition)
 * - Skills/technologies per entry
 * - Optional expandable content
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

/**
 * Writing (Blog) Collection
 *
 * Articles are not authored locally. They are pulled at build time from the
 * blog's "standard site" feed (https://blog.damato.design/standard-site.json)
 * and surfaced here as previews that link out to the full posts on the blog.
 *
 * The feed shape is `{ siteUrl, documents: [{ slug, title, description,
 * publishedAt, tags, ... }] }`. We map each document to a collection entry
 * (keyed by slug) and pre-compute the canonical post `url`.
 */
const BLOG_FEED_URL = 'https://blog.damato.design/standard-site.json';

const writingCollection = defineCollection({
  loader: async () => {
    const response = await fetch(BLOG_FEED_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch blog feed (${BLOG_FEED_URL}): ${response.status} ${response.statusText}`
      );
    }

    const { siteUrl, documents } = (await response.json()) as {
      siteUrl: string;
      documents: Array<{
        slug: string;
        title: string;
        description: string;
        publishedAt: string;
        tags?: string[];
      }>;
    };

    return documents.map((doc) => ({
      id: doc.slug,
      title: doc.title,
      description: doc.description,
      publishDate: doc.publishedAt,
      tags: doc.tags ?? [],
      url: `${siteUrl}/posts/${doc.slug}`,
    }));
  },
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
 * 
 * Features:
 * - Five talk types (conference, meetup, podcast, workshop, webinar)
 * - Links to slides and video recordings
 * - Event information and location
 * - Optional topics and duration
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
 * Testimonials Collection
 * 
 * Endorsements and recommendations from colleagues and clients.
 * 
 * Features:
 * - Person details (name, role, company)
 * - Relationship context
 * - Quote text
 * - Optional LinkedIn profile link
 */
const testimonialsCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/testimonials' }),
  schema: z.object({
    /** Person's name */
    name: z.string(),
    
    /** Person's role/title */
    role: z.string(),
    
    /** Person's company */
    company: z.string(),
    
    /** Relationship context (e.g., "Worked together at Company X") */
    relationship: z.string(),
    
    /** Testimonial quote */
    quote: z.string(),
    
    /** LinkedIn profile URL (optional) */
    linkedin: z.url().optional(),

    /** Date of the testimonial */
    date: z.coerce.date(),
  }),
});

/**
 * Export all collections
 * 
 * This object is used by Astro to register all content collections
 * and generate TypeScript types for type-safe content queries.
 */
export const collections = {
  projects: projectsCollection,
  decisions: decisionsCollection,
  journey: journeyCollection,
  writing: writingCollection,
  speaking: speakingCollection,
  testimonials: testimonialsCollection,
};
