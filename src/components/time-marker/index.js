import html from './template.html';
import css from './styles.css';

const { format } = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    timeZone: 'UTC'
});

function utc() {
    const d = new Date();
    const str = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((n) => {
        const s = String(n);
        return s.length === 1 ? s.padStart(2, '0') : s;
    }).join('-');
    return `${str}T00:00:00.000Z`;
}

export default class TimeMarker extends window.HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>${css}</style>${html}`;

        this._$time = this.shadowRoot.getElementById('time');
        this._$month = this.shadowRoot.getElementById('month');
        this._$year = this.shadowRoot.getElementById('year');
    }

    static get observedAttributes() {
        return ['datetime'];
    }

    connectedCallback() {
        this.datetime = utc();
    }

    attributeChangedCallback(attr) {
        if (attr === 'datetime') {
            const d = new Date(this.datetime);
            if (!isNaN(d)) {
                this._$time.setAttribute('time', this.datetime);
                const [month, year] = format(d).split(' ');
                this._$month.textContent = month;
                this._$year.textContent = year;
            }
        }
    }

    get datetime() {
        return this.getAttribute('datetime');
    }

    set datetime(newVal) {
        if (newVal) {
            this.setAttribute('datetime', newVal);
        } else {
            this.removeAttribute('datetime');
        }
    }
}

window.customElements.define('time-marker', TimeMarker);