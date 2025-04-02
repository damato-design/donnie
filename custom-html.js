import { visit } from 'unist-util-visit';

// https://stackoverflow.com/a/51870158/3928045
const re = /(https?:\/\/)?(((m|www)\.)?(youtube(-nocookie)?|youtube.googleapis)\.com.*(v\/|v=|vi=|vi\/|e\/|embed\/|user\/.*\/u\/\d+\/)|youtu\.be\/)(?<videoId>[_0-9a-z-]+)/i;

export function remarkCustomHTML() {
    return (tree) => {
        visit(tree, 'image', (node) => {
            node.type = 'html';
            node.value = `<img src="${node.url}" alt="${node.alt}" />`;

            if (/youtube.com|youtu.be/.test(node.url)) {
                const videoId = (node.url.match(re)?.groups?.videoId) || null;
                console.log(videoId);
                node.value = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
            }

            node.value = `<figure>${node.value}<figcaption>${node.alt}</figcaption></figure>`;
        });
    };
}