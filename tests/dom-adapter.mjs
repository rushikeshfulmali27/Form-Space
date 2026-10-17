// Minimal event/DOM adapter for application tests. It is not a browser.
import fs from "node:fs";
export function setupDOM(file, seed = new Map()) {
  const elements = [];
  class Element {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.handlers = {};
      this.dataset = {};
      this.attributes = {};
      this.style = { setProperty() {} };
      this.live = false;
      this.value = "";
      this.className = "";
      this.disabled = false;
      this.hidden = false;
      this._text = "";
      elements.push(this);
      this.classList = {
        toggle: (c, yes) => {
          const list = this.className.split(" ").filter(Boolean);
          if (yes === undefined) yes = !list.includes(c);
          this.className = [
            ...list.filter((x) => x !== c),
            ...(yes ? [c] : []),
          ].join(" ");
        },
        add: (c) => this.classList.toggle(c, true),
        remove: (c) => this.classList.toggle(c, false),
      };
    }
    set textContent(v) {
      this.replaceChildren();
      this._text = String(v);
    }
    get textContent() {
      return this._text + this.children.map((c) => c.textContent).join("");
    }
    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k === "id") this.id = v;
      if (k === "class") this.className = v;
      if (k === "hidden") this.hidden = true;
      if (k === "disabled") this.disabled = true;
      if (k.startsWith("data-"))
        this.dataset[
          k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        ] = v;
    }
    getAttribute(k) {
      return this.attributes[k] ?? null;
    }
    append(...nodes) {
      for (const n of nodes) {
        if (typeof n === "string") {
          this._text += n;
          continue;
        }
        n.parent = this;
        this.children.push(n);
        const visit = (e) => {
          e.live = this.live;
          e.children.forEach(visit);
        };
        visit(n);
      }
    }
    replaceChildren(...nodes) {
      const off = (e) => {
        e.live = false;
        e.children.forEach(off);
      };
      this.children.forEach(off);
      this.children = [];
      this._text = "";
      this.append(...nodes);
    }
    replaceWith(el) {
      this.live = false;
      el.live = true;
      if (this.parent) {
        const i = this.parent.children.indexOf(this);
        this.parent.children[i] = el;
        el.parent = this.parent;
      }
    }
    addEventListener(name, fn) {
      (this.handlers[name] ??= []).push(fn);
    }
    async fire(type, data = {}) {
      for (const fn of this.handlers[type] || [])
        await fn({ target: this, preventDefault() {}, ...data });
    }
    dispatchEvent(event) {
      for (const fn of this.handlers[event.type] || []) fn(event);
      return true;
    }
    click() {
      return this.fire("click");
    }
    focus() {
      document.activeElement = this;
    }
    requestSubmit() {
      return this.fire("submit");
    }
    getBoundingClientRect() {
      return {
        width: 650,
        height: 450,
        left: 0,
        top: 0,
        right: 650,
        bottom: 450,
      };
    }
    setPointerCapture() {}
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
    }
    getContext(type) {
      if (type === "webgl") return null;
      const noop = () => {};
      return new Proxy(
        { createRadialGradient: () => ({ addColorStop: noop }) },
        {
          get: (target, key) => target[key] || noop,
          set: (t, k, v) => ((t[k] = v), true),
        },
      );
    }
  }
  const doc = new Element("document");
  doc.live = true;
  const stack = [doc],
    html = fs.readFileSync(file, "utf8"),
    voids = new Set(["meta", "link", "input", "br", "hr", "img", "source"]);
  for (const token of html.matchAll(/<\/?[a-z][^<>]*>|[^<>]+/gi)) {
    const value = token[0];
    if (value.startsWith("</")) {
      const tag = value.slice(2, -1).toUpperCase();
      while (stack.length > 1) {
        if (stack.pop().tagName === tag) break;
      }
      continue;
    }
    if (value.startsWith("<")) {
      const tag = value.match(/^<([\w-]+)/)[1];
      const e = new Element(tag);
      stack.at(-1).append(e);
      for (const a of value.matchAll(/([\w-]+)="([^"]*)"/g))
        e.setAttribute(a[1], a[2]);
      if (/\bdisabled(?:\s|>)/.test(value)) e.disabled = true;
      if (/\bhidden(?:\s|>)/.test(value)) e.hidden = true;
      if ("value" in e.attributes) e.value = e.attributes.value;
      if (tag === "option") {
        const select = stack.at(-1);
        if (!select.value || /\bselected\b/.test(value)) select.value = e.value;
      }
      if (!value.endsWith("/>") && !voids.has(tag)) stack.push(e);
    } else if (value.trim()) stack.at(-1)._text += value;
  }
  const matches = (e, s) => {
    if (!e.live) return false;
    if (s.startsWith("#")) return e.id === s.slice(1);
    if (s.startsWith(".")) return e.className.split(" ").includes(s.slice(1));
    if (s.startsWith("[data-"))
      return (
        e.dataset[
          s.slice(6, -1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        ] !== undefined
      );
    return e.tagName === s.toUpperCase();
  };
  doc.querySelector = (s) => elements.find((e) => matches(e, s)) || null;
  doc.querySelectorAll = (s) => elements.filter((e) => matches(e, s));
  doc.createElement = (t) => new Element(t);
  doc.createElementNS = (_, t) => new Element(t);
  doc.createTextNode = (t) => {
    const e = new Element("#text");
    e.textContent = t;
    return e;
  };
  doc.body = doc.querySelector("body");
  doc.activeElement = null;
  globalThis.document = doc;
  globalThis.devicePixelRatio = 1;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.requestAnimationFrame = () => {};
  globalThis.localStorage = {
    getItem: (k) => seed.get(k) || null,
    setItem: (k, v) => seed.set(k, v),
  };
  return seed;
}
