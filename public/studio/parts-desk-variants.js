import { standardDeskProfile } from "./parts-desks.js";
const cm = (n) => Math.round(n * 100) / 100;
const members = (parent, names, fields = []) =>
  Object.fromEntries(
    names.map((name) => [
      `${parent}.${name}`,
      {
        label: /^\d+$/.test(name)
          ? `Slat ${name}`
          : name.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase()) +
            ({ columns: " column", feet: " foot", legs: " leg" }[parent] || ""),
        parent,
        fields,
      },
    ]),
  );
const frame = (d) => ({ color: d.accent, material: "matte" });
const top = (d) => ({ color: d.color, material: d.material });
const inherited = (d, parent, ids, defaults) =>
  Object.fromEntries(
    ids.map((id) => [`${parent}.${id}`, { ...defaults, ...d.parts?.[parent] }]),
  );
const common = { revision: 1, legacyUnversioned: true };
const sides = ["left", "right"];
export const CORNER_LEGS = [
  "main-rear",
  "main-front-left",
  "main-front-right",
  "return-rear",
  "return-front",
];
export const SLATS = Array.from({ length: 7 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

export const standingDeskProfile = {
  ...common,
  id: "standing-desk",
  builder: "standing-desk",
  description:
    "Edit the top, two support columns, two feet and connecting brace.",
  hint: "Columns follow the top underside and feet. Total height stays in Whole object. Expand a group for individual finishes and dimensions.",
  parts: {
    tabletop: standardDeskProfile.parts.tabletop,
    columns: { label: "Both columns", fields: ["section"], group: true },
    ...members("columns", sides, ["section"]),
    feet: standardDeskProfile.parts.feet,
    ...members("feet", sides, ["width", "depth", "thickness"]),
    "rear-brace": standardDeskProfile.parts["rear-brace"],
  },
  defaults(d) {
    const defaults = standardDeskProfile.defaults(d);
    const columns = {
      section: cm(Math.min(6, Math.min(d.width, d.depth) * 0.12)),
      ...frame(d),
    };
    return {
      tabletop: defaults.tabletop,
      columns,
      ...inherited(d, "columns", sides, columns),
      feet: defaults.feet,
      ...inherited(d, "feet", sides, defaults.feet),
      "rear-brace": defaults["rear-brace"],
    };
  },
  limits(d, id, key) {
    if (id === "columns" || id.startsWith("columns."))
      return [0.3, Math.min(d.width, d.depth) * 0.15];
    return standardDeskProfile.limits(d, id, key);
  },
};
export const cornerDeskProfile = {
  ...common,
  id: "corner-desk",
  builder: "corner-desk",
  description:
    "Edit two joined top slabs and five supports without losing the L shape.",
  hint: "Top group width sets the main slab width; depth sets the return slab depth. Thickness is shared so the join stays flush. Expand to change each slab finish.",
  parts: {
    tabletop: {
      label: "Joined tops",
      fields: ["thickness", "width", "depth"],
      fieldLabels: { width: "Main slab width", depth: "Return slab depth" },
      group: true,
    },
    ...members("tabletop", ["main-top", "return-top"]),
    legs: { label: "All five legs", fields: ["section"], group: true },
    ...members("legs", CORNER_LEGS, ["section"]),
  },
  defaults(d) {
    const tabletop = {
      thickness: Math.min(4.5, d.height * 0.08),
      width: cm(d.width * 0.35),
      depth: cm(d.depth * 0.35),
      ...top(d),
    };
    const legs = {
      section: cm(Math.min(4, Math.min(d.width, d.depth) * 0.1)),
      ...frame(d),
    };
    return {
      tabletop,
      ...inherited(d, "tabletop", ["main-top", "return-top"], tabletop),
      legs,
      ...inherited(d, "legs", CORNER_LEGS, legs),
    };
  },
  limits(d, id, key) {
    if (id === "tabletop")
      return key === "thickness"
        ? [0.5, Math.min(12, d.height - 10)]
        : [d[key] * 0.2, d[key] * 0.55];
    return [0.3, Math.min(d.width, d.depth) * 0.15];
  },
};
export const slattedTableProfile = {
  ...common,
  id: "slatted-table",
  builder: "slatted-table",
  description: "Edit seven top slats, four legs, two feet and a rear brace.",
  hint: "Slat width follows the total width and shared gap. Round shape clips the same seven slats to an oval and preserves individual finishes. Thickness and gap belong to the top group.",
  parts: {
    ...standardDeskProfile.parts,
    tabletop: {
      label: "All seven slats",
      fields: ["thickness", "gap"],
      globalFields: ["width", "depth", "shape"],
      group: true,
    },
    ...members("tabletop", SLATS),
  },
  defaults(d) {
    const defaults = standardDeskProfile.defaults(d);
    const tabletop = { ...defaults.tabletop, gap: cm(d.width * 0.008) };
    return {
      ...defaults,
      tabletop,
      ...inherited(d, "tabletop", SLATS, tabletop),
    };
  },
  limits(d, id, key) {
    if (id === "tabletop" && key === "gap") return [0, d.width * 0.015];
    return standardDeskProfile.limits(d, id, key);
  },
};
export const laptopStandProfile = {
  ...common,
  id: "laptop-stand",
  builder: "laptop-stand",
  description:
    "Edit the platform, angled support, grounded base and front retaining lip.",
  hint: "The support follows the base and platform. Lip height is included in total height; the lip stays attached to the platform's front edge.",
  parts: {
    platform: {
      label: "Platform",
      fields: ["thickness"],
      globalFields: ["width", "depth"],
    },
    support: { label: "Angled support", fields: ["section"] },
    base: { label: "Base", fields: ["width", "depth", "thickness"] },
    lip: { label: "Retaining lip", fields: ["height"] },
  },
  defaults(d) {
    return {
      platform: { thickness: cm(d.height * 0.12), ...top(d) },
      support: {
        section: cm(Math.min(5, Math.min(d.width, d.depth) * 0.12)),
        ...frame(d),
      },
      base: {
        width: cm(d.width * 0.8),
        depth: cm(d.depth * 0.9),
        thickness: cm(d.height * 0.14),
        ...frame(d),
      },
      lip: { height: cm(d.height * 0.04), ...frame(d) },
    };
  },
  limits(d, id, key) {
    if (id === "base" && key !== "thickness")
      return [d[key] * 0.4, d[key] * 0.95];
    if (id === "support") return [0.3, Math.min(d.width, d.depth) * 0.12];
    if (id === "lip") return [0.3, d.height * 0.2];
    return [0.3, d.height * 0.15];
  },
};
