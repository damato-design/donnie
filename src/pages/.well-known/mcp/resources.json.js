// src/pages/.well-known/mcp/resources.json.ts
import { getCollection } from 'astro:content';

async function makeResource(category) {
    const posts = await getCollection(category);

    return posts.map((post) => ({
        name: post.slug,
        uri: `https://donnie.damato.design/${category}/${post.slug}`,
        mimeType: 'text/markdown',
        markdown: post.body,
        ...post.data,
        date: post.data.date.toISOString()
    }));
}

export const GET = async () => {
  const expertise = await makeResource('expertise');
  const projects = await makeResource('projects');
  const media = await getCollection('media');
  const connect = await getCollection('connect');

  return new Response(JSON.stringify([].concat(expertise, projects, media, connect), null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
