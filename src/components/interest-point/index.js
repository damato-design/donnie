import html from "./template.html";
import css from "./styles.css";
import { TYPES } from "../point-types.js";
import utc from "../utc.js";

const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const DIVISIONS = [
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
];

function formatTimeAgo(date) {
  let duration = (date - new Date(utc())) / 1000 / 60 / 60 / 24;

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
}

export default class InterestPoint extends window.HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: "open",
    }).innerHTML = `<style>${css}</style>${html}`;

    this._$title = this.shadowRoot.getElementById("title");
    this._$reltime = this.shadowRoot.getElementById("relative-time");
    this._$marker = this.shadowRoot.getElementById("time-marker");
    this._$icon = this.shadowRoot.getElementById("icon");
  }

  static get observedAttributes() {
    return ["title", "url", "type", "datetime"];
  }

  attributeChangedCallback(attr) {
    if (attr === "datetime") {
      this._$marker.datetime = this.datetime;
      this._$reltime.textContent = formatTimeAgo(new Date(this.datetime));
    }

    if (attr === "title" || attr === "url") {
      this._$title.innerHTML = "";
      if (this.url) {
        const link = document.createElement("a");
        link.href = this.url;
        link.innerHTML = this.title;
        this._$title.appendChild(link);
      } else {
        this._$title.innerHTML = this.title;
      }
    }

    if (attr === "type") {
      this._$icon.textContent = TYPES[this.type];
    }
  }

  get datetime() {
    return this.getAttribute("datetime");
  }

  set datetime(newVal) {
    if (newVal) {
      this.setAttribute("datetime", newVal);
    } else {
      this.removeAttribute("datetime");
    }
  }

  get title() {
    return this.getAttribute("title");
  }

  set title(newVal) {
    if (newVal) {
      this.setAttribute("title", newVal);
    } else {
      this.removeAttribute("title");
    }
  }

  get type() {
    return this.getAttribute("type");
  }

  set type(newVal) {
    if (newVal) {
      this.setAttribute("type", newVal);
    } else {
      this.removeAttribute("type");
    }
  }

  get url() {
    return this.getAttribute("url");
  }

  set url(newVal) {
    if (newVal) {
      this.setAttribute("url", newVal);
    } else {
      this.removeAttribute("url");
    }
  }
}

window.customElements.whenDefined("time-marker").then(() => {
  window.customElements.define("interest-point", InterestPoint);
});
