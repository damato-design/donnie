/**
 * Site Configuration
 *
 * Centralized configuration for the entire site, defined as plain literals.
 * Edit the values here to change identity, metadata, social links, or navigation.
 *
 * The site URL is intentionally NOT stored here: it comes from Astro's built-in
 * `Astro.site` (set by `site:` in astro.config.mjs), and any variant is built with
 * `new URL('/path', Astro.site)`.
 *
 * Configuration Sections:
 * - Site metadata (language, title, description)
 * - Author information (name, title, bio, email, location)
 * - Social links (GitHub, LinkedIn, Mastodon, Bluesky)
 * - Navigation structure
 *
 * @module config
 */

/**
 * Site configuration object
 *
 * Centralized, type-safe configuration used throughout the application.
 *
 * @constant
 */
export const siteConfig = {
  /**
   * Site language (ISO 639-1 code)
   *
   * Two-letter language code for HTML lang attribute and SEO.
   * Examples: 'en', 'id', 'es', 'fr'
   */
  language: 'en',

  /**
   * Site title
   *
   * Used as fallback when page-specific title is not provided.
   */
  title: "Donnie D'Amato",

  /**
   * Site description
   *
   * Default meta description for SEO and social sharing.
   */
  description: 'User Experience Architect based in New York, author of Mise en Mode, and international speaker bridging design and engineering with scalable, token-driven systems.',

  /**
   * Author information
   *
   * Personal details used throughout the site for attribution,
   * contact information, and structured data.
   */
  author: {
    /** Full name */
    name: "Donnie D'Amato",

    /** Professional title or role */
    title: 'User Experience Architect',

    /** Short biography or professional summary */
    bio: 'User Experience Architect based in New York and author of Mise en Mode. I began as an artist making creative interactions and, after two decades of being a maker on the web, found my purpose: to build great systems and pass the knowledge on to others.',

    /** Contact email address */
    email: 'donnie@damato.design',

    /** Location (optional, empty string to hide) */
    location: 'New York, NY',
  },

  /**
   * Social media links
   *
   * Set to empty string to hide a specific platform.
   * Only configured (non-empty) links will be displayed.
   */
  social: {
    /** LinkedIn profile URL */
    linkedin: 'https://linkedin.com/in/fauxserious',

    /** Bluesky profile URL */
    bluesky: 'https://bsky.app/profile/donnie.damato.design',

    /** GitHub profile URL */
    github: 'https://github.com/fauxserious',

     /** Mastodon profile URL */
    mastodon: 'https://mastodon.social/@donniedamato',
  },
  
  /**
   * Navigation links
   * 
   * Main site navigation structure. Order determines display order in the nav bar.
   * Add or remove items to customize navigation.
   */
  nav: [
    { label: 'Projects', href: '/projects' },
    { label: 'Decisions', href: '/decisions' },
    { label: 'Journey', href: '/journey' },
    { label: 'Writing', href: '/writing' },
    { label: 'Speaking', href: '/speaking' },
    { label: 'Connect', href: '/contact' },
  ],
} as const;

/**
 * Type export for the entire site configuration
 * 
 * Use this type when you need to reference the full config structure.
 */
export type SiteConfig = typeof siteConfig;

/**
 * Type export for social links object
 * 
 * Use this type when working specifically with social media links.
 */
export type SocialLinks = typeof siteConfig.social;

/**
 * Type export for a single navigation item
 * 
 * Use this type when working with individual nav items.
 */
export type NavItem = typeof siteConfig.nav[number];
