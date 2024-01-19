export { default as InterestPoint } from './interest-point/index.js';
export { default as TimeMarker } from './time-marker/index.js';
import { TYPES } from './point-types.js';
import utc from './utc.js';

const LOCAL_POINTS_URL = './points.json';
const BLOG_POINTS_URL = 'https://blog.damato.design/feed.json';
const PKG_POINTS_URL = 'https://registry.npmjs.org/-/v1/search?text=maintainer:fauxserious';
const $points = document.getElementById('points');
const $filter = document.getElementById('filter');

function fail(err) {
    console.error(err);
}

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
    return items.map(({ title, url, date_modified, summary }) => {
        return {
            title,
            url,
            type: 'article',
            textContent: summary,
            datetime: date_modified
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
            datetime: utc(pkg.date)
        }
    });
}

function formatter({ value }) {
    if (value.items) {
        return blogFormat(value);
    }

    if (value.objects) {
        return npmFormat(value);
    }

    return value;
}

let data;
function success(results) {
    data = results
        .filter(({ status }) => status === 'fulfilled')
        .map(formatter)
        .flat()
        .sort(datesort);

    createFilters();
    $filter.addEventListener('change', ({ target }) => useFilter(target.value));

    render(data);
    $points.dataset.loaded = true;
}

function render(points) {
    $points.innerHTML = points.map(pointCreate).join('');
}

function count(type) {
    return (type === 'all' ? data : data.filter((point) => point.type === type)).length;
}

function createFilters() {
    $filter.innerHTML = ['all'].concat(Object.keys(TYPES)).map((type) => {
        const selected = type === 'all' ? ' selected' : '';
        return `<option value="${type}" ${selected}>${type} (${count(type)})</option>`;
    }).join('');
}

function useFilter(type) {
    render(data.filter((point) => type === 'all' || point.type === type));
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