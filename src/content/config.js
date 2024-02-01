import { z, defineCollection } from 'astro:content';

export const collections = {
  'entries': defineCollection({
    type: 'content', // v2.5.0 and later
    schema: ({ image }) => z.object({
      image: image(),
      headline: z.string(),
      datetime: z.date(),
      link: z.string(),
      summary: z.string(),
      disabled: z.boolean().optional(),
    }),
  }),
};
