import { getCollection } from 'astro:content';

export async function getStaticPaths() {
    const entries = await getCollection('media');
    return entries.map((entry) => {
        return {
            params: { slug: entry.id },
            props: { entry },
        }
    });
}

export async function GET({ props }) {
    return new Response(props.entry.body, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}
