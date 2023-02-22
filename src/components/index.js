export { default as InterestPoint } from './interest-point/index.js';
export { default as TimeMarker } from './time-marker/index.js';

const LOCAL_POINTS_URL = './points.json';
const BLOG_POINTS_URL = 'https://blog.damato.design/feed.json';
const $timeline = document.getElementById('timeline');

function datesort(a, b) {
    return new Date(b.datetime) > new Date(a.datetime);
}

function pointCreate(point) {
    $timeline.appendChild(Object.assign(document.createElement('interest-point'), point));
}

function blogFormat({ items }) {
    return items.map(({ title, url, date_published }) => {
        return {
            title,
            url,
            type: 'article',
            datetime: date_published
        }
    });
}

function success(results) {
    results.filter(({ status }) => status === 'fulfilled').map(({ value }) => {
        if (value.items) {
            return blogFormat(value);
        }
        return value;
    }).flat().sort(datesort).forEach(pointCreate);
}

function fail(err) {
    console.error(err);
}

export default (function timeline () {
    window.customElements.whenDefined('interest-point').then(() => {
        Promise.allSettled([
            fetch(LOCAL_POINTS_URL),
            fetch(BLOG_POINTS_URL)
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