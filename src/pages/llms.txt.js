import { getCollection } from 'astro:content';
import { u } from 'unist-builder';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown';

import metadata from '../metadata.json';
import intro from '../intro.md?raw';

/**
 * Build an mdast section from a collection
 * Returns an array of nodes: [H2, List]
 */
function collectionToSection(title, entries) {
  if (!entries || entries.length === 0) return [];
  const { origin } = new URL(import.meta.env.SITE);

  const list = u(
    'list',
    { ordered: false },
    entries.map(entry => {
      const label = entry.data?.title;
      const mdPath = new URL(`/${entry.collection}/${entry.id}.md`, origin);

      return u('listItem', [
        u('paragraph', [
          u('link', { url: mdPath }, [u('text', label)])
        ])
      ]);
    })
  );

  return [
    u('heading', { depth: 2 }, [u('text', title)]),
    list
  ];
}

function mdastToPlainText({ children: nodes }) {
  if (!nodes) return '';
  return nodes
    .filter(node => node.type === 'paragraph') // only paragraphs
    .map(node =>
      node.children
        .filter(child => child.type === 'text') // only text nodes
        .map(child => child.value)
        .join(' ')
    )
    .join(' '); // join all paragraphs into one large string
}

export async function GET() {
  const expertise = await getCollection('expertise');
  const media = await getCollection('media');
  const projects = await getCollection('projects');

  const tree = u('root', [
    // H1 project title
    u('heading', { depth: 1 }, [u('text', metadata.title)]),

    // Blockquote summary
    u('blockquote', [
      u('paragraph', [
        u('text', metadata.description)
      ])
    ]),

    // Optional free-form paragraph (flattened intro.md)
    u('paragraph', [u('text', mdastToPlainText(fromMarkdown(intro)))]),

    // Posts section
    ...collectionToSection('Expertise', expertise),
    ...collectionToSection('Media', media),
    ...collectionToSection('Projects', projects),
  ]);

  const markdown = toMarkdown(tree);

  return new Response(markdown, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
