// src/pages/.well-known/mcp/resources.json.ts
import { getCollection } from 'astro:content';

async function makeResource(category) {
    const posts = await getCollection(category);

    return posts.map((post) => ({
        name: post.id,
        uri: `https://donnie.damato.design/${category}/${post.id}`,
        mimeType: 'text/markdown',
        markdown: post.body,
        ...post.data,
        date: post?.data?.date?.toISOString()
    }));
}

export const GET = async () => {
  const expertise = await makeResource('expertise');
  const projects = await makeResource('projects');
  const media = await makeResource('media');
  const connect = await makeResource('connect');

  const body = {
    resources: [].concat(expertise, projects, media, connect)
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
