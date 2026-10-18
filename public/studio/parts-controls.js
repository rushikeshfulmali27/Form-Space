import {
  PARTS,
  supportsParts,
  resolveParts,
  partLimits,
  editPart,
  resetPart,
} from "./parts.js";

export class PartsControls {
  constructor({ getDesign, preview, commit, viewer, materials }) {
    Object.assign(this, { getDesign, preview, commit, viewer, materials });
    this.mode = "object";
    this.selected = null;
    this.inputs = [];
    this.q = (s) => document.querySelector(s);
    this.q("#edit-whole").addEventListener("click", () =>
      this.setMode("object"),
    );
    this.q("#edit-parts").addEventListener("click", () =>
      this.setMode("parts"),
    );
    this.q("#parts-editor").addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.select(null);
    });
    for (const [id, def] of Object.entries(PARTS)) {
      const button = document.createElement("button");
      button.textContent = def.label;
      button.dataset.part = id;
      button.addEventListener("click", () => this.select(id));
      this.q("#parts-list").append(button);
    }
    this.q("#reset-part").addEventListener("click", () => {
      if (this.selected)
        this.commit(
          resetPart(this.getDesign(), this.selected),
          `${PARTS[this.selected].label} reset to inherited settings.`,
        );
    });
    this.q("#finish-all-parts").addEventListener("click", () => {
      const d = this.getDesign(),
        parts = structuredClone(d.parts || {});
      for (const id of Object.keys(PARTS))
        parts[id] = { ...parts[id], material: d.material, color: d.color };
      this.commit(
        { ...d, parts },
        "Current surface finish applied to all parts.",
      );
    });
    viewer.onPartSelect = (id) => this.select(id);
  }
  setMode(mode) {
    this.mode = mode;
    this.viewer.partsEnabled = mode === "parts";
    if (mode === "object") {
      this.selected = null;
      this.viewer.setSelection(null);
    }
    this.render();
  }
  select(id) {
    this.selected = id;
    this.viewer.setSelection(id);
    this.q("#auto-rotate").checked = this.viewer.auto;
    this.builtFor = null;
    this.render();
  }
  build() {
    const root = this.q("#part-fields");
    root.replaceChildren();
    this.inputs = [];
    if (!this.selected) return;
    const id = this.selected;
    const add = (key, labelText, type = "number", global = false) => {
      const label = document.createElement("label");
      label.className = "part-field";
      const text = document.createElement("span");
      text.textContent = labelText;
      const input = document.createElement(
        type === "select" ? "select" : "input",
      );
      input.id = `part-${key}`;
      input.setAttribute("aria-label", `${PARTS[id].label} ${labelText}`);
      if (type === "select") {
        for (const [value, title] of key === "shape"
          ? [
              ["round", "Round / oval"],
              ["square", "Square / rectangular"],
            ]
          : Object.entries(this.materials).map(([k, v]) => [k, v.label])) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = title;
          input.append(option);
        }
      } else {
        input.type = type;
        if (type === "number") input.step = "0.1";
      }
      const next = () => {
        const d = this.getDesign();
        const value = type === "number" ? Number(input.value) : input.value;
        return global ? { ...d, [key]: value } : editPart(d, id, key, value);
      };
      input.addEventListener("change", () => {
        if (
          type === "number" &&
          (input.value === "" || !Number.isFinite(Number(input.value)))
        ) {
          this.render();
          return;
        }
        const warnings =
          type === "number" &&
          (Number(input.value) < Number(input.min) ||
            Number(input.value) > Number(input.max))
            ? [`${labelText} was limited to ${input.min}–${input.max} cm.`]
            : [];
        this.commit(next(), `${PARTS[id].label} updated.`, warnings);
      });
      label.append(text, input);
      root.append(label);
      const row = { key, input, global, type };
      if (type === "number") {
        const range = document.createElement("input");
        range.type = "range";
        range.step = global ? "1" : "0.1";
        range.setAttribute(
          "aria-label",
          `${PARTS[id].label} ${labelText} slider`,
        );
        range.addEventListener("input", () => {
          input.value = range.value;
          this.preview(next());
        });
        const finish = () =>
          this.commit(this.getDesign(), `${PARTS[id].label} updated.`);
        range.addEventListener("change", finish);
        range.addEventListener("pointercancel", finish);
        root.append(range);
        row.range = range;
      }
      this.inputs.push(row);
    };
    if (id === "tabletop") {
      add("width", "Width (cm)", "number", true);
      add("depth", "Depth (cm)", "number", true);
      add("shape", "Shape", "select", true);
    }
    for (const key of PARTS[id].fields)
      add(key, `${key[0].toUpperCase() + key.slice(1)} (cm)`);
    add("material", "Finish", "select");
    add("color", "Color", "color");
  }
  render() {
    const d = this.getDesign(),
      supported = supportsParts(d);
    if (this.objectId !== d.id) {
      this.objectId = d.id;
      this.selected = null;
      this.builtFor = null;
      this.viewer.setSelection(null);
    }
    if (!supported) {
      this.mode = "object";
      this.selected = null;
    }
    const partsMode = supported && this.mode === "parts";
    this.viewer.partsEnabled = partsMode;
    this.q("#parts-editor").hidden = !supported;
    this.q("#parts-panel").hidden = !partsMode;
    for (const id of [
      "dimensions-section",
      "finish-section",
      "colors-section",
      "shape-section",
    ])
      this.q(`#${id}`).hidden =
        partsMode || (id === "shape-section" && !d.shape);
    this.q("#edit-whole").setAttribute("aria-pressed", String(!partsMode));
    this.q("#edit-parts").setAttribute("aria-pressed", String(partsMode));
    for (const button of document.querySelectorAll("[data-part]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.part === this.selected),
      );
    this.q("#selected-part-name").textContent = this.selected
      ? `Editing: ${PARTS[this.selected].label}`
      : "Select a part";
    this.q("#part-selection-help").hidden = !!this.selected;
    this.q("#reset-part").hidden = !this.selected;
    this.q("#part-custom").textContent = !this.selected
      ? ""
      : Object.keys(d.parts?.[this.selected] || {}).length
        ? "Custom settings · reset to inherit"
        : "Inherited settings";
    if (this.builtFor !== this.selected) {
      this.build();
      this.builtFor = this.selected;
    }
    this.q("#column-height").hidden = this.selected !== "column";
    if (!this.selected) return;
    const p = resolveParts(d)[this.selected];
    this.q("#column-height").textContent =
      `Column height: ${(d.height - resolveParts(d).tabletop.thickness - 5).toFixed(1)} cm · follows total height`;
    for (const { key, input, range, global, type } of this.inputs) {
      input.value = global ? d[key] : p[key];
      if (type === "number") {
        const [min, max] = global
          ? [key === "depth" ? 4 : 20, 240]
          : partLimits(d, this.selected, key);
        input.min = min;
        input.max = max;
        if (range) {
          range.min = min;
          range.max = max;
          range.value = input.value;
        }
      }
    }
  }
}
