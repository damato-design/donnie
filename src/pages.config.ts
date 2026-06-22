/**
 * Page Metadata Configuration
 * 
 * Centralized SEO metadata for all static pages. Single source of truth
 * for titles and descriptions to ensure consistency across the site.
 * 
 * Usage:
 * ```astro
 * ---
 * import BaseLayout from '@layouts/BaseLayout.astro';
 * import SEO from '@components/SEO.astro';
 * import { pagesConfig } from '../pages.config';
 * ---
 * 
 * <BaseLayout>
 *   <SEO 
 *     slot="head"
 *     title={pagesConfig.projects.title}
 *     description={pagesConfig.projects.description}
 *   />
 *   <!-- Page content -->
 * </BaseLayout>
 * ```
 * 
 * @module pages.config
 */

/**
 * Page metadata interface
 */
interface PageMeta {
  /** Page title (used in browser tab and SEO) */
  title: string;
  
  /** Page description (used in meta tags and SEO) */
  description: string;
  
  /** Page heading (displayed as h1, optional - defaults to title) */
  heading?: string;
  
  /** Page intro text (displayed below heading, optional) */
  intro?: string;
}

/**
 * Pages configuration object
 * 
 * Contains metadata for all static pages. Dynamic pages (like individual
 * project or article pages) generate their own metadata from content.
 */
export const pagesConfig = {
  /**
   * Home page (/)
   * Note: Home page uses siteConfig for title/description as it represents the site itself
   */
  home: {
    title: 'Home',
    description: 'Design Systems Architect bridging design and engineering with scalable, accessible, token-driven systems.',
  },

  /**
   * Projects listing page (/projects)
   */
  projects: {
    title: 'Projects - Case Studies',
    description: 'Case studies in design systems, theming, and design token architecture, from enterprise component libraries to community projects.',
    heading: 'Projects',
    intro: 'Case studies that demonstrate how I approach design systems, theming, and the space between design and engineering. Each project tells the story of the challenge, the constraints, the decisions made, and the outcomes achieved.',
  },

  /**
   * Decisions listing page (/decisions)
   */
  decisions: {
    title: 'Decisions - Design Systems & Technical Choices',
    description: 'A log of design systems and technical decisions, documenting the context, alternatives considered, and reasoning behind key choices.',
    heading: 'Decisions',
    intro: 'A transparent log of the design systems and technical decisions behind my work, semantic tokens, theming, layout, and content models. Each entry documents the context, the alternatives considered, and the reasoning behind the choice.',
  },

  /**
   * Journey timeline page (/journey)
   */
  journey: {
    title: 'Journey - Career Growth & Learning Timeline',
    description: 'A chronological timeline of my professional journey across design, engineering, and education, the milestones and transitions that shaped my practice.',
    heading: 'Journey',
    intro: 'A timeline of my professional growth across UX design, front-end engineering, and higher education. This isn\'t a resume, it\'s the story of how my practice evolved, the pivotal moments that shaped my thinking, and the work that came out of them.',
  },

  /**
   * Writing/blog listing page (/writing)
   */
  writing: {
    title: 'Writing - Articles & Hot Takes',
    description: 'Articles and hot takes on design systems, design tokens, CSS, and the craft of bridging design and engineering.',
    heading: 'Writing',
    intro: 'Takes best served hot, on design systems, design tokens, CSS, and the craft of bridging design and engineering. The full archive lives on my blog; here are the highlights.',
  },

  /**
   * Speaking engagements page (/speaking)
   */
  speaking: {
    title: 'Speaking - Talks, Panels & Podcasts',
    description: 'Conference talks, panels, podcast appearances, and live sessions on design systems, design tokens, and theming.',
    heading: 'Speaking',
    intro: 'I regularly speak at conferences and on podcasts, panels, and live shows about design systems, design tokens, and theming. Here\'s a collection of my talks and appearances.',
  },

  /**
   * Uses/tools page (/uses)
   */
  uses: {
    title: 'Uses - Tools, Stack & Environment',
    description: 'The tools, technologies, and environment I use to build design systems and the work around them.',
    heading: 'Uses',
    intro: 'A transparent look at the tools, technologies, and environment behind my design systems work and the community projects around it, what I use and why.',
  },

  /**
   * Contact page (/contact)
   */
  contact: {
    title: 'Connect - Get in Touch',
    description: 'Get in touch to discuss design systems, collaborations, speaking, or teaching.',
    heading: 'Let\'s Connect',
  },
} as const;

/**
 * Type export for the pages configuration
 */
export type PagesConfig = typeof pagesConfig;

/**
 * Type export for a single page metadata
 */
export type PageConfig = PageMeta;
