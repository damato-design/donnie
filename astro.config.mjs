/**
 * Astro Configuration
 * 
 * Main configuration file for the Astro site. Defines build settings, integrations,
 * environment variables schema, image optimization, and markdown processing.
 * 
 * Configuration Sections:
 * - Output mode: Static site generation (SSG)
 * - Integrations: MDX for rich content, Sitemap for SEO
 * - Environment variables: Type-safe schema with defaults
 * - Image optimization: Sharp-based processing with responsive sizes
 * - Markdown: Syntax highlighting with Shiki
 * 
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Set SITE_URL and other environment variables
 * 3. Run `npm run dev` for development or `npm run build` for production
 * 
 * @see https://astro.build/config
 */

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/**
 * Astro configuration object
 * 
 * Defines all build-time settings, integrations, and optimizations for the site.
 * 
 * @see https://astro.build/config
 */
export default defineConfig({
  /**
   * Output mode: Static Site Generation (SSG)
   * 
   * Generates static HTML files at build time for optimal performance
   * and hosting flexibility. All pages are pre-rendered.
   */
  output: 'static',
  
  /**
   * Astro integrations
   * 
   * - MDX: Enables MDX support for rich content authoring with JSX components
   * - Sitemap: Automatically generates sitemap.xml for search engines
   */
  integrations: [
    mdx(),
    sitemap(),
  ],
  
  /**
   * Site URL
   *
   * Base URL for the site, exposed at runtime as `Astro.site`.
   * Required for:
   * - Sitemap generation
   * - Canonical URLs
   * - Open Graph tags
   * - RSS feeds
   *
   * Build URL variants with `new URL('/path', Astro.site)`.
   */
  site: 'https://donnie.damato.design',

  /**
   * Image optimization configuration
   * 
   * Uses Astro's built-in Sharp-based image service for automatic optimization.
   * 
   * Features:
   * - Automatic format conversion (AVIF, WebP, PNG, JPEG)
   * - Responsive image generation with srcset
   * - Build-time optimization for static images
   * - Memory-safe processing with pixel limits
   * 
   * The limitInputPixels setting prevents memory issues when processing
   * very large images (~16K x 16K pixels maximum).
   */
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // Limit concurrent image processing to avoid memory issues
        limitInputPixels: 268402689, // ~16K x 16K pixels
      }
    },
    // Remote image patterns (currently empty - add patterns as needed)
    remotePatterns: [],
  },
  
  /**
   * Markdown configuration
   * 
   * Configures markdown processing and syntax highlighting.
   * 
   * Shiki Configuration:
   * - Theme: GitHub Dark for consistent code highlighting
   * - Wrap: Enables line wrapping for long code lines
   */
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
