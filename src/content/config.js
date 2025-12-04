import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const metadata = z.object({
  title: z.string(),
  link: z.string().url(),
  image: z.string().url().optional(),
  caption: z.string().optional(),
  date: z.date()
});

const expertise = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/expertise' }),
  schema: z.object({
    title: z.string(),
    sort: z.number()
  })
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: metadata
});

const media = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/media' }),
  schema: metadata
});

const connect = defineCollection({
  loader: file('src/content/connect.json'),
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
  connect
};
