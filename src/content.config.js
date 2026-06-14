import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';

const metadata = z.object({
  title: z.string(),
  summary: z.string().optional(),
  link: z.url(),
  image: z.url().optional(),
  caption: z.string().optional(),
  date: z.date(),
  draft: z.boolean().optional()
});

const expertise = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/expertise' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
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
    link: z.url(),
    icon: z.string()
  })
});

export const collections = {
  expertise,
  projects,
  media,
  connect
};
