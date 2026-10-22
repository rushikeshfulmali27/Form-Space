import {
  partDefinitions,
  getPartsProfile,
  supportsParts,
  resolveParts,
  partLimits,
  editPart,
  resetPart,
  applyGroup,
  partDescendants,
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
    this.q("#reset-part").addEventListener("click", () => {
      if (this.selected)
        this.commit(
          resetPart(this.getDesign(), this.selected),
          `${partDefinitions(this.getDesign())[this.selected].label} reset to inherited settings.`,
        );
    });
    this.q("#apply-group").addEventListener("click", () => {
      if (this.selected)
        this.commit(
          applyGroup(this.getDesign(), this.selected),
          "Group settings applied to all members.",
        );
    });
    this.q("#finish-all-parts").addEventListener("click", () => {
      const d = this.getDesign(),
        parts = structuredClone(d.parts || {});
      for (const id of Object.keys(partDefinitions(d)))
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
    if (id && !Object.hasOwn(partDefinitions(this.getDesign()), id)) id = null;
    this.selected = id;
    const parent = partDefinitions(this.getDesign())[id]?.parent;
    if (parent) {
      this.q(`#parts-members-${parent}`).hidden = false;
      this.q(`#parts-expand-${parent}`).setAttribute("aria-expanded", "true");
      this.q(`#parts-expand-${parent}`).textContent =
        `Hide individual ${parent}`;
    }
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
    const definition = partDefinitions(this.getDesign())[id];
    const add = (key, labelText, type = "number", global = false) => {
      const label = document.createElement("label");
      label.className = "part-field";
      const text = document.createElement("span");
      text.textContent = labelText;
      const input = document.createElement(
        type === "select" ? "select" : "input",
      );
      input.id = `part-${key}`;
      input.setAttribute("aria-label", `${definition.label} ${labelText}`);
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
        if (type === "number") input.step = global ? "1" : "0.01";
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
        this.commit(next(), `${definition.label} updated.`, warnings);
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
          `${definition.label} ${labelText} slider`,
        );
        range.addEventListener("input", () => {
          input.value = range.value;
          this.preview(next());
        });
        const finish = () =>
          this.commit(this.getDesign(), `${definition.label} updated.`);
        range.addEventListener("change", finish);
        range.addEventListener("pointercancel", finish);
        root.append(range);
        row.range = range;
      }
      this.inputs.push(row);
    };
    for (const key of definition.globalFields || [])
      add(
        key,
        key === "shape"
          ? "Shape"
          : `${key[0].toUpperCase() + key.slice(1)} (cm)`,
        key === "shape" ? "select" : "number",
        true,
      );
    for (const key of definition.fields)
      add(
        key,
        `${definition.fieldLabels?.[key] || key[0].toUpperCase() + key.slice(1)} (cm)`,
      );
    add("material", "Finish", "select");
    add("color", "Color", "color");
  }
  render() {
    const d = this.getDesign(),
      supported = supportsParts(d);
    const profile = getPartsProfile(d),
      definitions = partDefinitions(d);
    const signature = `${d.id}:${profile?.revision}:${Object.keys(definitions).join(",")}`;
    if (this.objectId !== signature) {
      this.objectId = signature;
      this.selected = null;
      this.builtFor = null;
      this.viewer.setSelection(null);
      this.q("#parts-list").replaceChildren();
      this.q("#parts-list").classList.toggle(
        "has-groups",
        Object.values(definitions).some((def) => def.group),
      );
      for (const [id, def] of Object.entries(definitions)) {
        const button = document.createElement("button");
        button.textContent = def.label;
        button.dataset.part = id;
        button.addEventListener("click", () => this.select(id));
        if (def.parent) {
          button.className = "part-member";
          this.q(`#parts-members-${def.parent}`).append(button);
        } else {
          this.q("#parts-list").append(button);
          if (def.group) {
            const expand = document.createElement("button"),
              members = document.createElement("div");
            expand.id = `parts-expand-${id}`;
            expand.className = "part-expand";
            expand.textContent = `Show individual ${id}`;
            expand.setAttribute("aria-expanded", "false");
            expand.setAttribute("aria-controls", `parts-members-${id}`);
            members.id = `parts-members-${id}`;
            members.className = "part-members";
            members.hidden = true;
            expand.addEventListener("click", () => {
              members.hidden = !members.hidden;
              expand.setAttribute("aria-expanded", String(!members.hidden));
              expand.textContent = `${members.hidden ? "Show" : "Hide"} individual ${id}`;
            });
            this.q("#parts-list").append(expand, members);
          }
        }
      }
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
      ? `Editing: ${definitions[this.selected].label}`
      : "Select a part";
    this.q("#part-selection-help").hidden = !!this.selected;
    this.q("#reset-part").hidden = !this.selected;
    this.q("#reset-part").textContent = definitions[this.selected]?.group
      ? "Reset group and members"
      : "Reset selected part";
    this.q("#apply-group").hidden = !definitions[this.selected]?.group;
    this.q("#parts-hint").textContent =
      profile?.hint ||
      "Parts stay connected. Base footprint stays inside the tabletop. Total height is edited in Whole object.";
    this.q("#part-custom").textContent = !this.selected
      ? ""
      : Object.keys(d.parts?.[this.selected] || {}).length
        ? "Custom settings · reset to inherit"
        : "Inherited settings";
    if (definitions[this.selected]?.group) {
      const count = partDescendants(d, this.selected).filter(
        (id) => Object.keys(d.parts?.[id] || {}).length,
      ).length;
      if (count)
        this.q("#part-custom").textContent +=
          ` · ${count} custom member${count === 1 ? "" : "s"}`;
    }
    if (this.builtFor !== this.selected) {
      this.build();
      this.builtFor = this.selected;
    }
    this.q("#parts-description").textContent = supported
      ? `${d.name} · ${profile.description}`
      : "";
    const readout = this.selected
      ? profile?.readout?.(d, resolveParts(d), this.selected) || ""
      : "";
    this.q("#column-height").hidden = !readout;
    if (!this.selected) return;
    const p = resolveParts(d)[this.selected];
    this.q("#column-height").textContent = readout;
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
