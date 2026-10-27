export const OFFICE_SLOTS = ["01", "02", "03", "04", "05"];
const SIDES = ["left", "right"];
const cm = (n) => Math.round(n * 100) / 100;
const members = (parent, ids, fields) =>
  Object.fromEntries(
    ids.map((id) => [
      `${parent}.${id}`,
      {
        parent,
        fields,
        label:
          parent === "star-base"
            ? `Base arm ${id}`
            : parent === "casters"
              ? `Caster ${id}`
              : `${id[0].toUpperCase() + id.slice(1)} ${parent === "armrests" ? "armrest" : "arm support"}`,
        ...(parent === "armrests"
          ? { fieldLabels: { height: "Armrest top height" } }
          : {}),
      },
    ]),
  );
const inherit = (d, parent, ids, values) =>
  Object.fromEntries(
    ids.map((id) => [`${parent}.${id}`, { ...values, ...d.parts?.[parent] }]),
  );
const definitions = {
  seat: {
    label: "Seat",
    fields: ["height", "thickness"],
    fieldLabels: { height: "Seat top height" },
  },
  back: {
    label: "Backrest",
    fields: ["thickness"],
    fieldLabels: { thickness: "Back depth" },
  },
  column: { label: "Support column", fields: ["diameter"] },
  armrests: {
    label: "Both armrests",
    group: true,
    fields: ["height", "section"],
    fieldLabels: { height: "Armrest top height" },
  },
  ...members("armrests", SIDES, ["height", "section"]),
  "arm-supports": { label: "Both arm supports", group: true, fields: [] },
  ...members("arm-supports", SIDES, []),
  "star-base": {
    label: "All five base arms",
    group: true,
    fields: ["section", "inset"],
    fieldLabels: { inset: "Footprint inset" },
  },
  ...members("star-base", OFFICE_SLOTS, ["section"]),
  casters: { label: "All five casters", group: true, fields: ["diameter"] },
  ...members("casters", OFFICE_SLOTS, ["diameter"]),
};
export const officeChairProfile = {
  id: "office-chair",
  builder: "office-chair",
  revision: 1,
  legacyUnversioned: true,
  parts: definitions,
  description:
    "Edit the seat, back, support column, two armrests, their supports and five base/caster slots.",
  hint: "Slots keep fixed angles. Larger casters or thicker base arms pull the footprint inward to fit. The column and arm supports follow the seat; these are visual dimensions, not animated mechanisms.",
  defaults(d) {
    const min = Math.min(d.width, d.depth),
      surface = { color: d.color, material: d.material },
      frame = { color: d.accent, material: "matte" };
    const armrests = {
      height: cm(d.height * 0.62),
      section: cm(Math.max(0.3, Math.min(4, min * 0.1, d.height * 0.035))),
      ...frame,
    };
    const base = {
      section: cm(Math.max(0.3, Math.min(3.5, min * 0.07, d.height * 0.03))),
      inset: cm(min * 0.02),
      ...frame,
    };
    const casters = {
      diameter: cm(Math.max(0.3, Math.min(5.4, min * 0.1, d.height * 0.06))),
      ...frame,
    };
    return {
      seat: {
        height: cm(d.height * 0.47),
        thickness: cm(d.height * 0.1),
        ...surface,
      },
      back: { thickness: cm(d.depth * 0.14), ...surface },
      column: {
        diameter: cm(Math.max(0.3, Math.min(5, min * 0.15, d.height * 0.06))),
        ...frame,
        material: "metal",
      },
      armrests,
      ...inherit(d, "armrests", SIDES, armrests),
      "arm-supports": frame,
      ...inherit(d, "arm-supports", SIDES, frame),
      "star-base": base,
      ...inherit(d, "star-base", OFFICE_SLOTS, base),
      casters,
      ...inherit(d, "casters", OFFICE_SLOTS, casters),
    };
  },
  limits(d, id, key) {
    const group = definitions[id]?.parent || id,
      min = Math.min(d.width, d.depth);
    if (group === "seat")
      return key === "height"
        ? [d.height * 0.36, d.height * 0.52]
        : [0.3, d.height * 0.12];
    if (group === "back") return [0.3, d.depth * 0.18];
    if (group === "column") return [0.3, Math.min(min * 0.2, d.height * 0.08)];
    if (group === "armrests")
      return key === "height"
        ? [d.height * 0.6, d.height * 0.76]
        : [0.3, Math.min(min * 0.12, d.height * 0.04)];
    if (group === "star-base")
      return key === "inset"
        ? [0, min * 0.1]
        : [0.3, Math.min(min * 0.08, d.height * 0.04)];
    if (group === "casters")
      return [0.3, Math.min(min * 0.12, d.height * 0.08)];
    throw Error("Unsupported office-chair dimension.");
  },
  readout(d, p, id) {
    const group = definitions[id]?.parent || id;
    if (group === "column") {
      const s = solveOfficeChair(d, p);
      return `Column height: ${((s.seatBottom - s.columnBottom) * 100).toFixed(2)} cm · follows the seat underside and base hub`;
    }
    if (group === "casters")
      return "Diameter measures horizontal width/depth; caster height is 75% of diameter. Each caster stays grounded and attached to its matching base arm.";
    if (group === "star-base")
      return "Section measures vertical thickness and perpendicular horizontal width. Inset is shared; member overrides keep their fixed angular slots.";
    if (group === "arm-supports")
      return "Support size/endpoints follow the matching armrest and seat. Finish is independently editable.";
    return "";
  },
};
export function solveOfficeChair(d, p) {
  const w = d.width / 100,
    h = d.height / 100,
    z = d.depth / 100,
    seatTop = p.seat.height / 100,
    seatBottom = seatTop - p.seat.thickness / 100,
    backThickness = p.back.thickness / 100;
  const reserve = Math.max(
      ...OFFICE_SLOTS.map((id) => p[`casters.${id}`].diameter / 200),
      ...OFFICE_SLOTS.map((id) => p[`star-base.${id}`].section / 200),
    ),
    inset = p["star-base"].inset / 100;
  const slots = OFFICE_SLOTS.map((id, i) => {
    const angle = (i * Math.PI * 2) / 5,
      r = p[`casters.${id}`].diameter / 200,
      height = r * 1.5,
      section = p[`star-base.${id}`].section / 100;
    return {
      id,
      angle,
      r,
      height,
      section,
      x: Math.cos(angle) * (w / 2 - reserve - inset),
      z: Math.sin(angle) * (z / 2 - reserve - inset),
      endY: height / 2 + section / 2,
    };
  });
  const hubY =
    Math.max(...slots.map((s) => s.endY)) +
    Math.max(...slots.map((s) => s.section)) / 2;
  const columnBottom = hubY - Math.min(...slots.map((s) => s.section)) / 4;
  return {
    w,
    h,
    z,
    seatTop,
    seatBottom,
    backThickness,
    slots,
    hubY,
    columnBottom,
  };
}
