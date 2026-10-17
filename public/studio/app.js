import {
  TAXONOMY,
  categoryLabel,
  subcategoryLabel,
  filterCatalog,
  CATALOG,
  MATERIALS,
  PALETTE,
  LIMITS,
  fresh,
  normalize,
  parsePrompt,
  History,
  diff,
  serialize,
  deserialize,
} from "./design.js";
import { Viewer, thumbnail } from "./viewer.js";
import { loadWorkspace, saveWorkspace, storageMessage } from "./storage.js";
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const icon = (name) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#i-" + name);
  svg.append(use);
  return svg;
};
const storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
};
const restored = loadWorkspace(storage),
  initial = restored.design;
let storageState = restored.status;
let history = new History(initial),
  design = history.current,
  category = "All",
  subcategory = "All",
  query = "",
  toastTimer;
const viewer = new Viewer($("#scene"), () => {
  $("#zoom-label").textContent = Math.round(viewer.zoom * 100) + "%";
  selectCamera(viewer.view);
  $("#renderer-status").textContent =
    viewer.mode === "WebGL"
      ? "WebGL · procedural finishes"
      : "Software 3D fallback · simplified finishes";
});
const thumbnails =
  typeof IntersectionObserver === "function"
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              thumbnail(
                entry.target,
                CATALOG.find((o) => o.id === entry.target.dataset.thumbnail),
              );
              thumbnails.unobserve(entry.target);
            }
        },
        { root: $("#object-list"), rootMargin: "150px" },
      )
    : null;
const labels = {
  id: "Object",
  width: "Width",
  depth: "Depth",
  height: "Height",
  color: "Surface",
  accent: "Frame",
  material: "Material",
  shape: "Shape",
  shelves: "Shelves",
};
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3200);
}
function persist() {
  storageState = saveWorkspace(storage, design);
  $("#save-status").textContent = storageMessage(storageState);
}
function feedback(title, changes = [], warnings = []) {
  const root = $("#prompt-feedback");
  root.replaceChildren();
  const marker = document.createElement("span");
  marker.className = "feedback-icon";
  marker.append(icon(warnings.length && !changes.length ? "info" : "check"));
  const body = document.createElement("div");
  const heading = document.createElement("strong");
  heading.textContent = title;
  body.append(heading);
  if (changes.length) {
    const tags = document.createElement("div");
    tags.className = "change-tags";
    for (const { key, after } of changes) {
      const tag = document.createElement("span");
      tag.className = "change-tag";
      let val = after;
      if (["width", "height", "depth"].includes(key)) val += " cm";
      if (key === "material") val = MATERIALS[after]?.label || after;
      if (key === "id")
        val = CATALOG.find((o) => o.id === after)?.name || after;
      if (["color", "accent"].includes(key)) {
        const sw = document.createElement("span");
        Object.assign(sw.style, {
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: after,
          border: "1px solid #0001",
        });
        tag.append(sw);
      }
      tag.append(document.createTextNode(`${labels[key]}: ${val}`));
      tags.append(tag);
    }
    body.append(tags);
  }
  for (const warning of warnings) {
    const p = document.createElement("p");
    p.className = "warning";
    p.textContent = warning;
    body.append(p);
  }
  if (!changes.length && !warnings.length) {
    const p = document.createElement("p");
    p.textContent =
      "The original proportions and finish are ready for your next idea.";
    body.append(p);
  }
  root.append(marker, body);
}
function renderSubcategories() {
  if (!$("#subcategory")) return;
  const select = $("#subcategory");
  select.replaceChildren();
  const addOption = (parent, value, label) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    parent.append(option);
  };
  const groups = TAXONOMY.filter(
    (c) => category === "All" || c.id === category,
  );
  addOption(
    select,
    "All",
    category === "All"
      ? "All subcategories"
      : "All " + categoryLabel(category) + " objects",
  );
  for (const group of groups) {
    const parent =
      category === "All" ? document.createElement("optgroup") : select;
    if (parent !== select) parent.label = group.label;
    for (const sub of group.subcategories) {
      const count = CATALOG.filter((o) => o.subcategory === sub.id).length;
      addOption(parent, sub.id, `${sub.label} (${count})`);
    }
    if (parent !== select) select.append(parent);
  }
  select.value = subcategory;
  $("#subcategory-summary").textContent =
    groups.reduce((n, g) => n + g.subcategories.length, 0) + " subcategories";
  $$("[data-category]").forEach((b) => {
    const active = b.dataset.category === category;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}
function renderLibrary() {
  if (!$("#object-list")) return;
  const list = $("#object-list");
  thumbnails?.disconnect();
  list.replaceChildren();
  const objects = filterCatalog(CATALOG, { category, subcategory, query });
  list.hidden = objects.length === 0;
  $("#library-count").textContent =
    objects.length + (objects.length === 1 ? " object" : " objects");
  $("#library-empty").hidden = objects.length > 0;
  for (const o of objects) {
    const b = document.createElement("button");
    b.className = "object-card" + (o.id === design.id ? " active" : "");
    b.dataset.object = o.id;
    b.setAttribute(
      "aria-label",
      `Select ${o.name}, ${categoryLabel(o.category)}, ${subcategoryLabel(o.subcategory)}`,
    );
    b.setAttribute("aria-pressed", o.id === design.id ? "true" : "false");
    const cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    const mark = document.createElement("span");
    mark.className = "selected-marker";
    mark.append(icon("check"));
    const info = document.createElement("div");
    info.className = "object-info";
    const name = document.createElement("strong");
    name.textContent = o.name;
    const categoryText = document.createElement("span");
    categoryText.textContent = subcategoryLabel(o.subcategory);
    categoryText.title =
      categoryLabel(o.category) + " / " + subcategoryLabel(o.subcategory);
    info.append(name, categoryText);
    b.append(cv, info, mark);
    b.addEventListener("click", () => {
      if (design.id === o.id) return;
      commit(fresh(o.id), `${o.name} is ready to customize.`);
      viewer.fit();
      selectCamera("perspective");
    });
    list.append(b);
    cv.dataset.thumbnail = o.id;
    if (thumbnails) thumbnails.observe(cv);
    else thumbnail(cv, o);
  }
}
function resetLibraryFilters() {
  category = "All";
  subcategory = "All";
  query = "";
  $("#library-search").value = "";
  renderSubcategories();
  renderLibrary();
}
function revealDesign() {
  if (
    !filterCatalog(CATALOG, { category, subcategory, query }).some(
      (o) => o.id === design.id,
    )
  ) {
    category = design.category;
    subcategory = design.subcategory;
    query = "";
    $("#library-search").value = "";
    renderSubcategories();
    renderLibrary();
  }
}

function buildControls() {
  const controls = $("#dimension-controls");
  for (const axis of ["width", "depth", "height"]) {
    const root = document.createElement("div");
    root.className = "dim-control";
    const row = document.createElement("div");
    row.className = "dim-label";
    const label = document.createElement("label");
    label.htmlFor = axis + "-number";
    const symbol = document.createElement("span");
    symbol.className = "dim-symbol";
    symbol.textContent = axis[0].toUpperCase();
    label.append(symbol, document.createTextNode(labels[axis]));
    const box = document.createElement("div");
    box.className = "dim-number";
    const number = document.createElement("input");
    number.type = "number";
    number.id = axis + "-number";
    number.min = LIMITS[axis][0];
    number.max = LIMITS[axis][1];
    number.step = 1;
    number.inputMode = "numeric";
    const unit = document.createElement("span");
    unit.textContent = "cm";
    box.append(number, unit);
    row.append(label, box);
    const range = document.createElement("input");
    range.type = "range";
    range.id = axis + "-range";
    range.min = number.min;
    range.max = number.max;
    range.step = 1;
    range.setAttribute("aria-label", labels[axis] + " in centimeters");
    range.addEventListener("input", () =>
      preview({ ...design, [axis]: Number(range.value) }),
    );
    range.addEventListener("change", () =>
      commit(design, "Proportions updated."),
    );
    range.addEventListener("pointercancel", () =>
      commit(design, "Proportions updated."),
    );
    number.addEventListener("change", () => {
      const val = Number(number.value);
      if (!Number.isFinite(val) || number.value === "") {
        render();
        toast("Enter a valid dimension in centimeters.");
        return;
      }
      if (val < LIMITS[axis][0] || val > LIMITS[axis][1])
        toast(`${labels[axis]} is limited to ${number.min}–${number.max} cm.`);
      commit({ ...design, [axis]: val }, "Proportions updated.");
    });
    root.append(row, range);
    controls.append(root);
  }
  const options = $("#material-options");
  for (const [key, m] of Object.entries(MATERIALS)) {
    const button = document.createElement("button");
    button.dataset.material = key;
    button.className = "material-button";
    button.setAttribute("aria-label", `Use ${m.label}`);
    const preview = document.createElement("span");
    preview.className =
      "material-preview " +
      (["oak", "walnut", "birch"].includes(key) ? "wood" : key);
    preview.style.setProperty("--material-color", m.color || "#b8bfb1");
    const label = document.createElement("span");
    label.textContent = {
      oak: "Oak",
      walnut: "Walnut",
      birch: "Birch",
      matte: "Matte",
      metal: "Metal",
    }[key];
    button.append(preview, label);
    button.addEventListener("click", () =>
      commit(
        { ...design, material: key, ...(m.color ? { color: m.color } : {}) },
        "Finish updated.",
      ),
    );
    options.append(button);
  }
  const colors = [
    "cream",
    "oak",
    "walnut",
    "sage",
    "terracotta",
    "blue",
    "black",
  ];
  for (const color of colors) {
    const button = document.createElement("button");
    button.className = "swatch";
    button.style.setProperty("--color", PALETTE[color]);
    button.dataset.color = PALETTE[color];
    button.title = color[0].toUpperCase() + color.slice(1);
    button.setAttribute("aria-label", `Set main surface to ${color}`);
    button.addEventListener("click", () =>
      commit({ ...design, color: PALETTE[color] }, "Surface color updated."),
    );
    $("#color-swatches").append(button);
  }
}
function render() {
  viewer.update(design);
  $("#object-name").textContent = design.name;
  $("#breadcrumb-name").textContent = design.name;
  $("#object-tag").textContent =
    design.kind === "table"
      ? `Pedestal · ${design.shape} top`
      : design.kind === "stool"
        ? `${design.shape === "round" ? "Round" : "Square"} seat · four legs`
        : design.tag;
  $("#category-badge").textContent =
    categoryLabel(design.category) +
    " / " +
    subcategoryLabel(design.subcategory);
  $("#material-label").textContent = MATERIALS[design.material].label;
  $("#dimension-label").textContent =
    `${design.width} × ${design.depth} × ${design.height} cm`;
  for (const axis of ["width", "depth", "height"]) {
    const num = $("#" + axis + "-number");
    num.value = design[axis];
    $("#" + axis + "-range").value = design[axis];
  }
  $("#primary-color").value = design.color;
  $("#accent-color").value = design.accent;
  $("#primary-hex").textContent = design.color.toUpperCase();
  $("#accent-hex").textContent = design.accent.toUpperCase();
  $$("[data-material]").forEach((b) => {
    const yes = b.dataset.material === design.material;
    b.classList.toggle("active", yes);
    b.setAttribute("aria-pressed", String(yes));
  });
  $$("[data-color]").forEach((b) => {
    const yes = b.dataset.color === design.color;
    b.classList.toggle("active", yes);
    b.setAttribute("aria-pressed", String(yes));
  });
  $("#shape-section").hidden = !design.shape;
  $$("[data-shape]").forEach((b) => {
    const yes = b.dataset.shape === design.shape;
    b.classList.toggle("active", yes);
    b.setAttribute("aria-pressed", String(yes));
  });
  $("#shelf-section").hidden = !design.shelves;
  if (design.shelves) {
    $("#shelf-count").value = design.shelves;
    $("#shelf-output").textContent = design.shelves;
  }
  $("#shape-example").hidden = !design.shape;
  $("#undo").disabled = !history.canUndo;
  $("#redo").disabled = !history.canRedo;
  $$(".object-card").forEach((b) => {
    const yes = b.dataset.object === design.id;
    b.classList.toggle("active", yes);
    b.setAttribute("aria-pressed", String(yes));
  });
  $("#save-status").textContent = storageMessage(storageState);
  $("#renderer-status").textContent =
    viewer.mode === "WebGL"
      ? "WebGL · procedural finishes"
      : "Software 3D fallback · simplified finishes";
}
function preview(next) {
  design = normalize(next);
  render();
  $("#save-status").textContent = storageMessage("editing");
}
function commit(next, title = "Design updated.", warnings = []) {
  const before = history.current;
  design = normalize(next);
  const changes = diff(before, design);
  history.push(design);
  render();
  persist();
  feedback(
    changes.length ? title : "Your design is up to date.",
    changes,
    warnings,
  );
}
function selectCamera(name) {
  $$("[data-view]").forEach((b) => {
    const active = b.dataset.view === name;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}
if ($("#catalog-count")) $("#catalog-count").textContent = CATALOG.length;
buildControls();
renderSubcategories();
renderLibrary();
render();
$$("[data-category]").forEach((b) =>
  b.addEventListener("click", () => {
    category = b.dataset.category;
    subcategory = "All";
    renderSubcategories();
    renderLibrary();
  }),
);
$("#subcategory")?.addEventListener("change", (e) => {
  subcategory = e.target.value;
  renderLibrary();
});
$("#library-search")?.addEventListener("input", (e) => {
  query = e.target.value;
  renderLibrary();
});
$("#clear-library-filters")?.addEventListener("click", resetLibraryFilters);
$$("[data-shape]").forEach((b) =>
  b.addEventListener("click", () =>
    commit({ ...design, shape: b.dataset.shape }, "A new shape, same idea."),
  ),
);
for (const [selector, key] of [
  ["#primary-color", "color"],
  ["#accent-color", "accent"],
]) {
  const input = $(selector);
  input.addEventListener("input", () =>
    preview({ ...design, [key]: input.value }),
  );
  input.addEventListener("change", () =>
    commit(design, "Color palette updated."),
  );
}
$("#shelf-count").addEventListener("input", (e) =>
  preview({ ...design, shelves: Number(e.target.value) }),
);
$("#shelf-count").addEventListener("change", () =>
  commit(design, "Shelving updated."),
);
$("#prompt-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("#prompt").value;
  if (!text.trim()) {
    feedback(
      "Describe your next edit.",
      [],
      ["Try “make it walnut and 90 cm wide”."],
    );
    $("#prompt").focus();
    return;
  }
  const result = parsePrompt(text, design);
  const changedObject = result.design.id !== design.id;
  commit(
    result.design,
    result.changes.length ? "Your edit, applied." : "No changes applied.",
    result.warnings,
  );
  if (changedObject) {
    revealDesign();
    viewer.fit();
    selectCamera("perspective");
  }
  $("#prompt").value = "";
});
$$("[data-prompt]").forEach((b) =>
  b.addEventListener("click", () => {
    $("#prompt").value = b.dataset.prompt;
    $("#prompt").focus();
  }),
);
$("#prompt").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    $("#prompt-form").requestSubmit();
  }
});
function undo() {
  if (!history.canUndo) return;
  design = history.undo();
  revealDesign();
  render();
  persist();
  feedback("Last edit undone.", [], ["Use Redo to bring it back."]);
}
function redo() {
  if (!history.canRedo) return;
  design = history.redo();
  revealDesign();
  render();
  persist();
  feedback("Edit restored.");
}
$("#undo").addEventListener("click", undo);
$("#redo").addEventListener("click", redo);
document.addEventListener("keydown", (e) => {
  if (
    !["INPUT", "TEXTAREA"].includes(e.target.tagName) &&
    (e.ctrlKey || e.metaKey) &&
    e.key.toLowerCase() === "z"
  ) {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  }
  if (
    !["INPUT", "TEXTAREA"].includes(e.target.tagName) &&
    (e.ctrlKey || e.metaKey) &&
    e.key.toLowerCase() === "y"
  ) {
    e.preventDefault();
    redo();
  }
});
$("#reset").addEventListener("click", () => {
  commit(fresh(design.id), "Original design restored.");
  viewer.fit();
  selectCamera("perspective");
  toast(
    history.canUndo
      ? "Object reset. Undo is available."
      : "Object is already at its original settings.",
  );
});
$$("[data-view]").forEach((b) =>
  b.addEventListener("click", () => {
    viewer.setView(b.dataset.view);
    selectCamera(b.dataset.view);
  }),
);
$("#fit").addEventListener("click", () => {
  viewer.fit();
  selectCamera("perspective");
});
$("#zoom-in").addEventListener("click", () => {
  viewer.zoom = Math.min(2.7, viewer.zoom * 1.15);
  viewer.render();
});
$("#zoom-out").addEventListener("click", () => {
  viewer.zoom = Math.max(0.45, viewer.zoom / 1.15);
  viewer.render();
});
$("#auto-rotate").addEventListener(
  "change",
  (e) => (viewer.auto = e.target.checked),
);
$("#wireframe").addEventListener("change", (e) => {
  viewer.wire = e.target.checked;
  viewer.render();
});
$("#export").addEventListener("click", () => {
  try {
    const blob = new Blob([serialize(design)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-${design.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Design download requested. Keep the JSON file to reopen it.");
  } catch {
    toast("Download could not start. Try another browser.");
  }
});
$("#import").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 100000)
      throw Error("Choose a FORM Studio JSON file smaller than 100 KB.");
    const next = deserialize(await file.text());
    commit(next, "Your saved design is open.");
    document.dispatchEvent(new Event("form:design-imported"));
    viewer.fit();
    selectCamera("perspective");
    revealDesign();
    toast("Saved design opened.");
  } catch (error) {
    toast(error.message || "This design file could not be opened.");
  } finally {
    e.target.value = "";
  }
});
$("#prompt-help").addEventListener("click", () =>
  $("#help-dialog").showModal(),
);
$("#close-help").addEventListener("click", () => $("#help-dialog").close());
$("#help-done").addEventListener("click", () => $("#help-dialog").close());
$("#help-dialog").addEventListener("click", (e) => {
  if (e.target === $("#help-dialog")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
});
if (storageState === "unavailable")
  toast("Browser storage is unavailable. Export your design to keep edits.");
if (storageState === "corrupt")
  toast(
    "The saved design could not be opened. Its data is kept until your next edit; export to keep new work.",
  );
