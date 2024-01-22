import { z, defineCollection } from 'astro:content';

export const collections = {
  'entries': defineCollection({
    type: 'content', // v2.5.0 and later
    schema: z.object({
      id: z.string(),
      image: z.string(),
      headline: z.string(),
      year: z.number(),
      link: z.string(),
      summary: z.string(),
    }),
  }),
};
