import {
  createCatalog,
  TAXONOMY,
  categoryLabel,
  subcategoryLabel,
  filterCatalog,
} from "./catalog.js";
import {
  supportsParts,
  normalizeParts,
  partDefinitions,
  getPartsProfile,
} from "./parts.js";
import { normalizeConstruction, constructionFields } from "./construction.js";
export { TAXONOMY, categoryLabel, subcategoryLabel, filterCatalog };
export const PALETTE = {
  walnut: "#79553c",
  oak: "#b98c60",
  birch: "#d6bd93",
  black: "#282e2c",
  white: "#f0eee7",
  cream: "#ded6c6",
  beige: "#cfbfa8",
  brown: "#906749",
  blue: "#597a93",
  navy: "#344a61",
  green: "#71816a",
  sage: "#92a18b",
  red: "#a95446",
  terracotta: "#b76d53",
  yellow: "#d6b25a",
  orange: "#c9864f",
  pink: "#c58f96",
  purple: "#8b769f",
  grey: "#939591",
  gray: "#939591",
  gold: "#b79a61",
  silver: "#aab1b1",
};
export const MATERIALS = {
  oak: { label: "Natural oak", color: PALETTE.oak },
  walnut: { label: "Walnut", color: PALETTE.walnut },
  birch: { label: "Light birch", color: PALETTE.birch },
  matte: { label: "Matte finish" },
  metal: { label: "Brushed metal" },
};
export const CATALOG = createCatalog(PALETTE);
export const LIMITS = {
  width: [20, 240],
  height: [20, 240],
  depth: [4, 240],
  shelves: [2, 6],
};
export function fresh(id = "cafe-table") {
  const design = structuredClone(
    CATALOG.find((o) => o.id === id) || CATALOG[0],
  );
  const profile = getPartsProfile(design);
  if (profile) design.partsRevision = profile.revision;
  const construction = normalizeConstruction(design);
  if (construction) design.construction = construction;
  return design;
}
export function normalize(input) {
  const base = fresh(input?.id);
  const out = { ...base };
  const numeric = (v) =>
    (typeof v === "number" || (typeof v === "string" && v.trim() !== "")) &&
    Number.isFinite(Number(v));
  for (const key of ["width", "height", "depth"])
    if (numeric(input?.[key]))
      out[key] = Math.round(
        Math.max(LIMITS[key][0], Math.min(LIMITS[key][1], Number(input[key]))),
      );
  for (const key of ["color", "accent"])
    if (typeof input?.[key] === "string" && /^#[0-9a-f]{6}$/i.test(input[key]))
      out[key] = input[key].toLowerCase();
  if (
    typeof input?.material === "string" &&
    Object.hasOwn(MATERIALS, input.material)
  )
    out.material = input.material;
  if (base.shape && ["round", "square"].includes(input?.shape))
    out.shape = input.shape;
  if (base.shelves && numeric(input?.shelves))
    out.shelves = Math.max(2, Math.min(6, Math.round(input.shelves)));
  const construction = normalizeConstruction(
    { ...out, width: numeric(input?.width) ? Number(input.width) : out.width },
    input?.construction,
  );
  if (construction) out.construction = construction;
  if (supportsParts(out)) {
    const parts = normalizeParts(out, input?.parts, MATERIALS);
    if (Object.keys(parts).length) out.parts = parts;
  }
  return out;
}
const units = {
  cm: 1,
  centimeter: 1,
  centimeters: 1,
  centimetre: 1,
  centimetres: 1,
  m: 100,
  meter: 100,
  meters: 100,
  metre: 100,
  metres: 100,
  mm: 0.1,
  millimeter: 0.1,
  millimeters: 0.1,
  in: 2.54,
  inch: 2.54,
  inches: 2.54,
  ft: 30.48,
  foot: 30.48,
  feet: 30.48,
};
const number = "(\\d+(?:\\.\\d+)?)";
const unitNames =
  "centimeters?|centimetres?|millimeters?|meters?|metres?|inches|inch|feet|foot|cm|mm|ft|in|m";
const unit = "(" + unitNames + ")?";
const axisWords = {
  width: "(?:width|wide|wider)",
  height: "(?:height|high|tall|taller)",
  depth: "(?:depth|deep|deeper)",
};
export function parsePrompt(source, current) {
  const raw = source.trim();
  if (
    /\b(?:columns?|tabletop|support|base|top|slats?|legs?|feet|foot|lip|platform|slab|seat|backrest|armrests?|stretchers?|cushions?|arms?|back)\s+(?:diameter|thickness|width|depth|height|section|gap|count)\b|\b(?:diameter|thickness|slat gap)\b/i.test(
      raw,
    )
  )
    return {
      design: current,
      changes: [],
      warnings: [
        "Use Individual parts to edit component dimensions. Text edits apply to the whole object.",
      ],
    };
  const text = raw
    .toLowerCase()
    .replace(/café/g, "cafe")
    .replace(/sage green/g, "sage");
  let draft = { ...current };
  const warnings = [];
  const recognized = [];
  if (!raw)
    return {
      design: current,
      changes: [],
      warnings: [
        "Describe a change first, for example: make it walnut and 90 cm wide.",
      ],
    };
  const candidates = CATALOG.flatMap((o) =>
    [o.name, o.id.replaceAll("-", " "), ...(o.aliases || [])].map((alias) => ({
      id: o.id,
      alias: alias.toLowerCase().replace(/café/g, "cafe"),
    })),
  ).sort((a, b) => b.alias.length - a.alias.length);
  const named = candidates.find(({ alias }) => {
    const i = text.indexOf(alias);
    return (
      i >= 0 &&
      (i === 0 || !/[a-z]/.test(text[i - 1])) &&
      !/[a-z]/.test(text[i + alias.length] || "")
    );
  });
  const target = named?.id;
  if (target && target !== current.id) {
    draft = fresh(target);
    recognized.push("object");
  }
  let materialMatch = null;
  for (const key of ["walnut", "oak", "birch", "metal", "matte"])
    if (new RegExp("\\b" + key + "\\b").test(text)) materialMatch = key;
  if (materialMatch) {
    draft.material = materialMatch;
    if (MATERIALS[materialMatch].color)
      draft.color = MATERIALS[materialMatch].color;
    recognized.push("material");
  }
  const colorNames = Object.keys(PALETTE)
    .filter((x) => !["oak", "walnut", "birch"].includes(x))
    .sort((a, b) => b.length - a.length);
  const colorPattern = "(?:#[0-9a-f]{6}|" + colorNames.join("|") + ")";
  const resolve = (c) => (c.startsWith("#") ? c : PALETTE[c]);
  const accentRx = new RegExp(
    "\\b(?:legs?|frame|base|stem|accent)\\s*(?:(?:to|in|is|are|a)\\s+)?(" +
      colorPattern +
      ")\\b|(" +
      colorPattern +
      ")\\s+(?:legs?|frame|base|stem|accents?)\\b",
    "g",
  );
  const accentHits = [...text.matchAll(accentRx)];
  let primaryText = text;
  for (const match of accentHits) {
    draft.accent = resolve(match[1] || match[2]);
    primaryText = primaryText.replace(match[0], " ");
    recognized.push("accent");
  }
  const primaryHits = [
    ...primaryText.matchAll(
      new RegExp("(" + colorPattern + ")(?![a-z0-9])", "g"),
    ),
  ].filter((m) => m.index === 0 || !/[a-z]/.test(primaryText[m.index - 1]));
  if (primaryHits.length) {
    draft.color = resolve(primaryHits.at(-1)[1]);
    recognized.push("color");
  }
  const explicit = new Set();
  for (const [axis, word] of Object.entries(axisWords)) {
    const before = new RegExp(
      "\\b" +
        word +
        "\\s*(?:(?:to|of|is|at|=|:)\\s*)?" +
        number +
        "\\s*" +
        unit +
        "\\b",
      "g",
    );
    const after = new RegExp(
      "\\b" + number + "\\s*" + unit + "\\s*" + word + "\\b",
      "g",
    );
    const all = [...text.matchAll(before), ...text.matchAll(after)].sort(
      (a, b) => a.index - b.index,
    );
    const m = all.at(-1);
    if (m) {
      const prev = text.slice(Math.max(0, m.index - 25), m.index);
      const end = text.slice(m.index + m[0].length, m.index + m[0].length + 12);
      if (
        !/\b(?:by|increase|decrease|reduce|add|remove|raise|lower|shorten)\s+(?:the\s+)?$/.test(
          prev,
        ) &&
        !/^\s*(?:%|percent)/.test(end)
      ) {
        draft[axis] = Number(m[1]) * (units[m[2]] || 1);
        explicit.add(axis);
        recognized.push(axis);
      }
    }
  }
  // W × D × H is explicit, matching the control order in the studio.
  const triple = text.match(
    new RegExp(
      number +
        "\\s*[x×]\\s*" +
        number +
        "\\s*[x×]\\s*" +
        number +
        "\\s*" +
        unit,
    ),
  );
  if (triple) {
    const f = units[triple[4]] || 1;
    [
      ["width", 1],
      ["depth", 2],
      ["height", 3],
    ].forEach(([a, i]) => {
      draft[a] = Number(triple[i]) * f;
      explicit.add(a);
    });
    recognized.push("dimensions");
  }
  for (const [axis, word] of Object.entries(axisWords)) {
    if (explicit.has(axis)) continue;
    // Directional verbs take precedence: “reduce height by 20%” must shrink.
    const directed = text.match(
      new RegExp(
        "\\b(increase|raise|add|reduce|decrease|lower|shorten)\\s+(?:the\\s+)?" +
          word +
          "\\s*(?:by\\s*)?" +
          number +
          "\\s*(%|percent\\b|(?:" +
          unitNames +
          ")\\b)?",
      ),
    );
    if (directed) {
      const sign = /^(reduce|decrease|lower|shorten)$/.test(directed[1])
        ? -1
        : 1;
      const amount = Number(directed[2]);
      const measure = directed[3];
      draft[axis] +=
        (measure === "%" || measure === "percent"
          ? (draft[axis] * amount) / 100
          : amount * (units[measure] || 1)) * sign;
      recognized.push(axis);
      continue;
    }
    const relative = new RegExp(
      "(?:" +
        number +
        "\\s*(%|percent)\\s*" +
        word +
        "|" +
        word +
        "\\s*(?:by\\s*)?" +
        number +
        "\\s*(%|percent))",
    );
    const m = text.match(relative);
    if (m) {
      const n = Number(m[1] || m[3]);
      draft[axis] *= 1 + n / 100;
      recognized.push(axis);
      continue;
    }
    const adjective = {
      width: ["wider", "narrower"],
      height: ["taller", "shorter"],
      depth: ["deeper", "shallower"],
    }[axis];
    const hit = adjective.find((x) => new RegExp("\\b" + x + "\\b").test(text));
    if (hit) {
      const percent = text.match(
        new RegExp(
          number +
            "\\s*(?:%|percent)\\s*" +
            hit +
            "|" +
            hit +
            "\\s*(?:by\\s*)?" +
            number +
            "\\s*(?:%|percent)",
        ),
      );
      const amount = percent ? Number(percent[1] || percent[2]) / 100 : 0.15;
      draft[axis] *= 1 + (hit === adjective[0] ? amount : -amount);
      recognized.push(axis);
    }
  }
  const scale = text.match(
    new RegExp(
      number +
        "\\s*(?:%|percent)\\s*(bigger|larger|smaller)|(?:bigger|larger|smaller)\\s*(?:by\\s*)?" +
        number +
        "\\s*(?:%|percent)",
    ),
  );
  if (scale || /\b(bigger|larger|smaller)\b/.test(text)) {
    const pct = scale ? Number(scale[1] || scale[3]) / 100 : 0.15;
    const sign = /smaller/.test(scale?.[0] || text) ? -1 : 1;
    for (const a of ["width", "height", "depth"])
      if (!explicit.has(a)) draft[a] *= 1 + sign * pct;
    recognized.push("scale");
  }
  const shape = text.match(/\b(round|circular|square|rectangular)\b/);
  if (shape) {
    if (draft.shape) {
      draft.shape = ["round", "circular"].includes(shape[1])
        ? "round"
        : "square";
      recognized.push("shape");
    } else
      warnings.push("This object does not support changing its overall shape.");
  }
  const shelves = text.match(
    /\b([2-9])\s*(?:shelves|tiers)\b|\b(?:shelves|tiers)\s*(?:to\s*)?([2-9])\b/,
  );
  if (shelves) {
    if (draft.shelves) {
      draft.shelves = Number(shelves[1] || shelves[2]);
      recognized.push("shelves");
    } else
      warnings.push(
        "Shelf count is available on shelving, display racks and tiered stands.",
      );
  }
  const unsupportedText = named ? text.replace(named.alias, "") : text;
  if (
    /\b(glass|transparent|textures?|carve|engrave|drawers?|doors?|cushions?|animate|organic|intricate)\b/.test(
      unsupportedText,
    )
  )
    warnings.push(
      "This studio supports catalog objects, dimensions, colors, materials, simple top shapes and shelf counts. Other details were not applied.",
    );
  for (const a of ["width", "height", "depth", "shelves"])
    if (
      draft[a] != null &&
      (draft[a] < LIMITS[a][0] || draft[a] > LIMITS[a][1])
    )
      warnings.push(
        `${a[0].toUpperCase() + a.slice(1)} was limited to ${LIMITS[a][0]}–${LIMITS[a][1]}${a === "shelves" ? " shelves" : " cm"}.`,
      );
  const design = normalize(draft);
  const changes = diff(current, design);
  if (!recognized.length && !warnings.length)
    warnings.push(
      "I could not match an edit. Try “make it sage green”, “90 cm wide”, “20% taller”, “walnut with black legs”, or “make the top square”.",
    );
  if (recognized.length && !changes.length && !warnings.length)
    warnings.push("Your design already matches these settings.");
  return { design, changes, warnings };
}
export function diff(a, b) {
  const changes = [
    "id",
    "width",
    "depth",
    "height",
    "color",
    "accent",
    "material",
    "shape",
    "shelves",
  ]
    .filter((k) => a[k] !== b[k] && b[k] !== undefined)
    .map((key) => ({ key, before: a[key], after: b[key] }));
  const afterDefinitions = partDefinitions(b);
  const definitions = { ...partDefinitions(a), ...afterDefinitions };
  for (const [key, field] of Object.entries(constructionFields(b)))
    if (a.construction?.[key] !== b.construction?.[key])
      changes.push({
        key: field.label,
        before: a.construction?.[key],
        after: b.construction?.[key],
      });
  for (const id of Object.keys(definitions))
    for (const field of [...definitions[id].fields, "color", "material"])
      if (a.parts?.[id]?.[field] !== b.parts?.[id]?.[field])
        changes.push({
          key: `${definitions[id].label} ${field}`,
          before: a.parts?.[id]?.[field],
          after:
            b.parts?.[id]?.[field] ??
            (Object.hasOwn(afterDefinitions, id) ? "Inherited" : "Removed"),
        });
  return changes;
}
export function serialize(design) {
  return JSON.stringify(
    {
      format: "form-studio",
      version: 3,
      units: "cm",
      design: normalize(design),
    },
    null,
    2,
  );
}
export const MAX_IMPORT_BYTES = 100000;
export function deserialize(json) {
  if (
    typeof json !== "string" ||
    new TextEncoder().encode(json).length > MAX_IMPORT_BYTES
  )
    throw Error("Choose a FORM Studio JSON file smaller than 100 KB.");
  let v;
  try {
    v = JSON.parse(json);
  } catch {
    throw Error("This file is not valid JSON.");
  }
  if (
    v?.format !== "form-studio" ||
    ![1, 2, 3].includes(v.version) ||
    !v.design ||
    Array.isArray(v.design) ||
    !CATALOG.some((o) => o.id === v.design.id)
  )
    throw Error(
      "Choose a version-1, version-2 or version-3 FORM Studio design with a known object.",
    );
  if (v.units !== undefined && v.units !== "cm")
    throw Error("Design dimensions must use centimeters (cm).");
  const d = v.design,
    base = fresh(d.id);
  const profile = getPartsProfile(base);
  if (
    v.version === 3 &&
    ((profile &&
      d.partsRevision !== profile.revision &&
      !(
        profile.legacyUnversioned &&
        !Object.hasOwn(d, "partsRevision") &&
        !Object.hasOwn(d, "parts") &&
        !Object.hasOwn(d, "construction")
      )) ||
      (!profile && Object.hasOwn(d, "partsRevision")))
  )
    throw Error("Unsupported parts revision for this object.");
  for (const key of ["width", "height", "depth", "shelves"])
    if (Object.hasOwn(d, key)) {
      if (key === "shelves" && !base.shelves)
        throw Error("This object does not support shelf count.");
      if (
        typeof d[key] !== "number" ||
        !Number.isFinite(d[key]) ||
        d[key] < LIMITS[key][0] ||
        d[key] > LIMITS[key][1]
      )
        throw Error(
          `Invalid ${key}. Use a number from ${LIMITS[key][0]} to ${LIMITS[key][1]}.`,
        );
    }
  for (const key of ["color", "accent"])
    if (
      Object.hasOwn(d, key) &&
      (typeof d[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(d[key]))
    )
      throw Error("Colors must use six-digit hex values.");
  if (
    Object.hasOwn(d, "material") &&
    (typeof d.material !== "string" || !Object.hasOwn(MATERIALS, d.material))
  )
    throw Error("Unknown material.");
  if (
    Object.hasOwn(d, "shape") &&
    (!base.shape || !["round", "square"].includes(d.shape))
  )
    throw Error("Unsupported object shape.");
  if (Object.hasOwn(d, "construction") && v.version !== 3)
    throw Error("Construction settings require a version-3 design.");
  if (
    profile?.construction &&
    Object.hasOwn(d, "partsRevision") &&
    !Object.hasOwn(d, "construction")
  )
    throw Error("Missing construction settings.");
  const construction = normalizeConstruction(
    { ...base, ...d },
    d.construction,
    true,
  );
  if (Object.hasOwn(d, "parts")) {
    if (v.version === 1 || (v.version === 2 && d.id !== "cafe-table"))
      throw Error("These part settings require a version-3 design.");
    normalizeParts({ ...base, ...d }, d.parts, MATERIALS, true);
  }
  return normalize({ ...d, ...(construction ? { construction } : {}) });
}
export class History {
  constructor(initial) {
    this.items = [normalize(initial)];
    this.index = 0;
  }
  get current() {
    return structuredClone(this.items[this.index]);
  }
  push(d) {
    const next = normalize(d);
    if (JSON.stringify(this.current) === JSON.stringify(next)) return false;
    this.items = this.items.slice(0, this.index + 1);
    this.items.push(next);
    if (this.items.length > 80) this.items.shift();
    this.index = this.items.length - 1;
    return true;
  }
  undo() {
    if (this.index > 0) this.index--;
    return this.current;
  }
  redo() {
    if (this.index < this.items.length - 1) this.index++;
    return this.current;
  }
  get canUndo() {
    return this.index > 0;
  }
  get canRedo() {
    return this.index < this.items.length - 1;
  }
}
