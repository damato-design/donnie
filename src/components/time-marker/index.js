import html from './template.html';
import css from './styles.css';

export default class TimeMarker extends window.HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>${css}</style>${html}`;
    }
}

window.customElements.define('time-marker', TimeMarker);