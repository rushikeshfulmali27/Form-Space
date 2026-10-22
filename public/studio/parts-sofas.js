import { SEATING_LEGS } from "./parts-seating.js";
const cm = (n) => Math.round(n * 100) / 100;
export const legacyCushionCount = (d) => (d.width > 190 ? 3 : 2);
export const cushionCount = (d) =>
  Number.isInteger(d.construction?.cushionCount) &&
  d.construction.cushionCount >= 1 &&
  d.construction.cushionCount <= 4
    ? d.construction.cushionCount
    : legacyCushionCount(d);
export const cushionIds = (d) =>
  Array.from({ length: cushionCount(d) }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
const members = (group, ids, fields) =>
  Object.fromEntries(
    ids.map((id) => [
      `${group}.${id}`,
      {
        label:
          group === "cushions"
            ? `Cushion ${id}`
            : `${id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase())} ${group === "arms" ? "arm" : "leg"}`,
        parent: group,
        fields,
        fieldLabels:
          group === "arms"
            ? { height: "Arm top height", thickness: "Arm width" }
            : {},
      },
    ]),
  );
const inherited = (d, parent, ids, values) =>
  Object.fromEntries(
    ids.map((id) => [`${parent}.${id}`, { ...values, ...d.parts?.[parent] }]),
  );
export const sofaProfile = {
  id: "sofa",
  builder: "sofa",
  revision: 1,
  legacyUnversioned: true,
  construction: {
    cushionCount: {
      label: "Cushion count",
      min: 1,
      max: 4,
      default: legacyCushionCount,
    },
  },
  description:
    "Edit the base, back, arms, individual cushions and four legs. Choose one to four cushions.",
  hint: "Count changes keep surviving cushion settings. Removed slots can be restored with Undo; re-adding creates inherited defaults. Width changes preserve the chosen count.",
  parts(d) {
    return {
      base: {
        label: "Base",
        fields: ["height", "thickness"],
        fieldLabels: { height: "Base top height" },
      },
      back: { label: "Backrest", fields: ["thickness"] },
      arms: {
        label: "Both arms",
        fields: ["height", "thickness"],
        fieldLabels: { height: "Arm top height", thickness: "Arm width" },
        group: true,
      },
      ...members("arms", ["left", "right"], ["height", "thickness"]),
      cushions: {
        label: "All cushions",
        fields: ["thickness", "gap"],
        group: true,
      },
      ...members("cushions", cushionIds(d), ["thickness"]),
      legs: { label: "All four legs", fields: ["section"], group: true },
      ...members("legs", SEATING_LEGS, ["section"]),
    };
  },
  defaults(d) {
    const surface = { color: d.color, material: d.material },
      frame = { color: d.accent, material: "matte" };
    const arms = {
        height: cm(d.height * 0.735),
        thickness: cm(d.width * 0.08),
        ...surface,
      },
      cushions = {
        thickness: cm(d.height * 0.16),
        gap: cm(d.width * 0.012),
        ...surface,
      },
      legs = {
        section: cm(
          Math.max(0.3, Math.min(5, Math.min(d.width, d.depth) * 0.08)),
        ),
        ...frame,
      };
    return {
      base: {
        height: cm(d.height * 0.4),
        thickness: cm(d.height * 0.2),
        ...surface,
      },
      back: { thickness: cm(d.depth * 0.22), ...surface },
      arms,
      ...inherited(d, "arms", ["left", "right"], arms),
      cushions,
      ...inherited(d, "cushions", cushionIds(d), cushions),
      legs,
      ...inherited(d, "legs", SEATING_LEGS, legs),
    };
  },
  limits(d, id, key) {
    if (id === "base")
      return key === "height"
        ? [d.height * 0.32, d.height * 0.48]
        : [d.height * 0.1, d.height * 0.22];
    if (id === "back") return [0.3, d.depth * 0.24];
    if (id === "arms" || id.startsWith("arms."))
      return key === "height"
        ? [d.height * 0.7, d.height * 0.85]
        : [0.3, d.width * 0.15];
    if (id === "cushions" || id.startsWith("cushions."))
      return key === "gap" ? [0, d.width * 0.02] : [0.3, d.height * 0.18];
    if (id === "legs" || id.startsWith("legs."))
      return [0.3, Math.min(d.width, d.depth) * 0.12];
    throw Error("Unsupported sofa dimension.");
  },
  readout(d, p, id) {
    return id === "cushions" || id.startsWith("cushions.")
      ? "Cushion width is derived from the space between arms and the shared gap. Bottoms follow the base top; thickness can differ per cushion."
      : "";
  },
};
export function solveSofa(d, p) {
  const w = d.width / 100,
    h = d.height / 100,
    z = d.depth / 100,
    baseTop = p.base.height / 100,
    baseBottom = baseTop - p.base.thickness / 100;
  const left = -w / 2 + p["arms.left"].thickness / 100,
    right = w / 2 - p["arms.right"].thickness / 100,
    ids = cushionIds(d),
    gap = p.cushions.gap / 100,
    width = (right - left - (ids.length - 1) * gap) / ids.length;
  return {
    w,
    h,
    z,
    baseTop,
    baseBottom,
    left,
    right,
    gap,
    width,
    ids,
    rear: -z / 2 + (p.back.thickness / 100) * 0.9,
    front: z * 0.43,
  };
}
