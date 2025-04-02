import { defineConfig } from 'astro/config';
import { remarkCustomHTML } from './custom-html.js';

export default defineConfig({
  site: 'https://donnie.damato.design',
  experimental: {
    svg: true,
  },
  markdown: {
    remarkPlugins: [remarkCustomHTML],
  },
});
