export { default as InterestPoint } from './interest-point/index.js';
export { default as TimeMarker } from './time-marker/index.js';

const LOCAL_POINTS_URL = './points.json';
const BLOG_POINTS_URL = 'https://blog.damato.design/feed.json';
const PKG_POINTS_URL = 'https://registry.npmjs.org/-/v1/search?text=author:fauxserious';
const $timeline = document.getElementById('timeline');

function datesort(a, b) {
    return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
}

function pointCreate(point) {
    const attrs = Object.entries(point)
        .filter(({ name }) => name !== 'textContent')
        .map(([name, value]) => `${name}="${value}"`)
        .join(' ');
    const textContent = point.textContent || '';
    return `<interest-point ${attrs}>${textContent}</interest-point>`
}

function blogFormat({ items }) {
    return items.map(({ title, url, date_published, summary }) => {
        return {
            title,
            url,
            type: 'article',
            textContent: summary,
            datetime: date_published
        }
    });
}

function npmFormat({ objects }) {
    return objects.map(({ package: pkg }) => {
        return {
            title: pkg.name,
            url: pkg.links.npm,
            type: 'package',
            textContent: pkg.description,
            datetime: pkg.date
        }
    });
}

function success(results) {
    $timeline.innerHTML = results.filter(({ status }) => status === 'fulfilled').map(({ value }) => {
        if (value.items) {
            return blogFormat(value);
        }

        if (value.objects) {
            return npmFormat(value);
        }

        return value;
    }).flat().sort(datesort).map(pointCreate).join('');
    $timeline.dataset.loaded = true;
}

function fail(err) {
    console.error(err);
}

export default (function timeline () {
    window.customElements.whenDefined('interest-point').then(() => {
        Promise.allSettled([
            fetch(LOCAL_POINTS_URL),
            fetch(BLOG_POINTS_URL),
            fetch(PKG_POINTS_URL)
        ])
            .then((results) => {
                const promises = results.map(({ status, value }) => {
                    return status === 'fulfilled'
                        ? value.json()
                        : Promise.resolve();
                });
                return Promise.allSettled(promises);
            } )
            .then(success)
            .catch(fail);
    });
})();