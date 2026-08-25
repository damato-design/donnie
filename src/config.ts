/**
 * Site Configuration
 *
 * Centralized configuration for the entire site, defined as plain literals.
 * Edit the values here to change identity, metadata, social links, or navigation.
 *
 * **This module imports nothing, and must stay that way.** `content.config.ts`
 * reads it during `astro sync`, which runs outside the component graph, so a
 * runtime import of an `.astro` file here would drag a component into content
 * collection generation. That is why the components that read this config own
 * the adapters that shape it into their props (the panel builders in
 * `grid.config.ts`; `Layout` for the header bars) rather than this module
 * owning them. Data belongs here; anything that has to know a component's prop
 * types does not.
 *
 * The lists below are shaped so they need no adapter at all: a `nav` or
 * `social` entry is already a valid `HeaderLink`, and `Layout` hands them
 * straight to `Header`.
 *
 * The site URL is intentionally NOT stored here: it comes from Astro's built-in
 * `Astro.site` (set by `site:` in astro.config.mjs), and any variant is built with
 * `new URL('/path', Astro.site)`.
 *
 * Configuration Sections:
 * - Site metadata (language, title, description)
 * - Author information (name, title, bio, email, location)
 * - Social profiles (label, glyph, and URL)
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
  description: 'Focused on improving the practice of design systems and AI model behavior.',

  /**
   * Browser chrome color
   *
   * The dark end of the dashboard shell, used wherever a browser or an OS paints
   * around the page rather than inside it: the `theme-color` meta tag and the web
   * app manifest's `theme_color`/`background_color` (so an installed app's splash
   * screen is the shell, not a white flash before it).
   *
   * It lives here because those two consumers are in different files and drifted
   * apart once already. It is a plain colour, not one of `global.css`'s `--dash-*`
   * gradients, since neither consumer can resolve a CSS variable or a gradient.
   */
  themeColor: '#0a0a0a',

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
    bio: 'User Experience Architect based in New York and author of Mise en Mode. I began as an artist making creative interactions and, after two decades of being a maker on the web, found my purpose: building great systems by finding creativity within their constraints, and passing the knowledge on to others.',

    /** Contact email address */
    email: 'donnie@damato.design',

    /** Location (optional, empty string to hide) */
    location: 'New York, NY',
  },

  /**
   * Social profiles
   *
   * Order determines display order in the connect bar. Remove an entry (or
   * blank its `href`) to hide that platform.
   *
   * Each entry carries its own display name and glyph, so no component has to
   * keep a lookup table keyed by platform. `icon` is a plain string here rather
   * than an imported `IconName`, to keep this module import-free (see above);
   * `as const` makes it a literal type, so a typo still fails to compile where
   * `Header` assigns it to `IconName`.
   *
   * These are read by `Header` (the connect bar, which marks them `rel="me"`)
   * and by `StructuredData` (JSON-LD `sameAs`), which is why they are a plain
   * list here rather than part of a header-shaped structure. Both are identity
   * claims: this list is "profiles that are me", not "links I like", so an
   * external link that is not Donnie's own account does not belong in it. Nothing about a new tab is recorded: an absolute
   * URL opens in one, which `Header` derives.
   */
  social: [
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://linkedin.com/in/fauxserious' },
    { label: 'Bluesky', icon: 'bluesky', href: 'https://bsky.app/profile/donnie.damato.design' },
    { label: 'GitHub', icon: 'github', href: 'https://github.com/fauxserious' },
    { label: 'Mastodon', icon: 'mastodon', href: 'https://mastodon.social/@donniedamato' },
  ],

  
  /**
   * Scheduling link
   *
   * The primary "get in touch" action. Surfaced by the connect bar on every
   * page, which replaced the former /contact page.
   */
  scheduling: 'https://cal.com/donnie-damato',

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
  ],
} as const;
