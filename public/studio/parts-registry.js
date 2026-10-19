// Profiles are trusted application definitions, never selected by imported data.
import { standardDeskProfile } from "./parts-desks.js";
const cm = (value) => Math.round(value * 100) / 100;
const pedestal = {
  id: "pedestal-table",
  revision: 1,
  builder: "pedestal-table",
  description:
    "Edit the top, support column and four-foot base. Parts stay connected.",
  parts: {
    tabletop: {
      label: "Tabletop",
      fields: ["thickness"],
      globalFields: ["width", "depth", "shape"],
    },
    column: { label: "Support column", fields: ["diameter"] },
    base: { label: "Base assembly", fields: ["width", "depth"] },
  },
  defaults(d) {
    return {
      tabletop: {
        thickness: Math.min(4.5, d.height * 0.08),
        color: d.color,
        material: d.material,
      },
      column: {
        diameter: cm(Math.min(d.width, d.depth) * 0.15),
        color: d.accent,
        material: "matte",
      },
      base: {
        width: cm(d.width * 0.68),
        depth: cm(d.depth * 0.68),
        color: d.accent,
        material: "matte",
      },
    };
  },
  limits(d, id, key) {
    if (id === "tabletop" && key === "thickness")
      return [0.5, Math.min(12, d.height - 10)];
    if (id === "column" && key === "diameter")
      return [0.5, Math.min(d.width, d.depth) * 0.4];
    if (id === "base" && ["width", "depth"].includes(key))
      return [d[key] * 0.25, d[key]];
    throw Error("Unsupported part dimension.");
  },
  readout(d, parts, id) {
    return id === "column"
      ? `Column height: ${(d.height - parts.tabletop.thickness - 5).toFixed(1)} cm · follows total height`
      : "";
  },
};
const objects = Object.freeze({
  "cafe-table": pedestal,
  "side-table": pedestal,
  "square-cafe-table": pedestal,
  "work-desk": standardDeskProfile,
  "coffee-table": standardDeskProfile,
  "dining-table": standardDeskProfile,
  "conference-table": standardDeskProfile,
  "communal-table": standardDeskProfile,
});
export const getPartsProfile = (d) =>
  d && Object.hasOwn(objects, d.id) ? objects[d.id] : null;
export const partDefinitions = (d) => getPartsProfile(d)?.parts || {};
export const supportedPartObjects = Object.freeze(Object.keys(objects));
