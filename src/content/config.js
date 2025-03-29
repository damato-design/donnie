import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const metadata = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  date: z.date(),
  image: z.string()
});

const expertise = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/expertise' })
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: metadata
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/media' }),
  schema: metadata
});

const contact = defineCollection({
  loader: file('src/content/contact.json'),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    link: z.string().url(),
    icon: z.string()
  })
});

export const collections = {
  expertise,
  projects,
  media,
  contact
};
