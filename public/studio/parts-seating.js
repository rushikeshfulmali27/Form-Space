// Fixed seating constructions. Settings are centimeters; solved anchors are meters.
export const SEATING_LEGS = [
  "front-left",
  "rear-left",
  "front-right",
  "rear-right",
];
export const BACK_SLATS = ["01", "02", "03", "04", "05"];
export const STRETCHERS = ["front", "rear", "left", "right"];
const cm = (n) => Math.round(n * 100) / 100;
const members = (parent, ids, fields = []) =>
  Object.fromEntries(
    ids.map((id) => [
      `${parent}.${id}`,
      {
        label: `${id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase())} ${parent === "legs" ? "leg" : parent === "back-slats" ? "back slat" : parent === "armrests" ? "armrest" : parent === "arm-supports" ? "arm support" : "stretcher"}`,
        fields,
        parent,
      },
    ]),
  );
const inherited = (d, parent, ids, values) =>
  Object.fromEntries(
    ids.map((id) => [`${parent}.${id}`, { ...values, ...d.parts?.[parent] }]),
  );
const common = { revision: 1, legacyUnversioned: true };

export function createSeatingProfile(kind) {
  const stool = kind === "stool",
    slatted = kind === "slatted-chair",
    arms = kind === "armchair" || slatted;
  const parts = {
    seat: {
      label: "Seat",
      fields: stool ? ["thickness"] : ["height", "thickness"],
      fieldLabels: { height: "Seat top height" },
      ...(stool ? { globalFields: ["width", "depth", "shape"] } : {}),
    },
    ...(stool
      ? {}
      : slatted
        ? {
            "back-slats": {
              label: "All five back slats",
              group: true,
              fields: ["thickness", "gap"],
            },
            ...members("back-slats", BACK_SLATS),
          }
        : { back: { label: "Backrest", fields: ["thickness"] } }),
    legs: { label: "All four legs", fields: ["section"], group: true },
    ...members("legs", SEATING_LEGS, ["section"]),
    ...(arms
      ? {
          armrests: {
            label: "Both armrests",
            fields: ["height", "section"],
            fieldLabels: { height: "Armrest top height" },
            group: true,
          },
          ...members("armrests", ["left", "right"], ["height", "section"]),
          "arm-supports": {
            label: "Both arm supports",
            fields: [],
            group: true,
          },
          ...members("arm-supports", ["left", "right"]),
        }
      : {}),
    ...(stool
      ? {
          stretchers: {
            label: "All four stretchers",
            fields: ["height", "section"],
            fieldLabels: { height: "Stretcher center height" },
            group: true,
          },
          ...members("stretchers", STRETCHERS, ["section"]),
        }
      : {}),
  };
  return {
    ...common,
    id: kind,
    builder: "seating",
    parts,
    description: stool
      ? "Edit the seat, four splayed legs and connecting stretchers."
      : slatted
        ? "Edit the seat, five back slats, four legs, armrests and their supports."
        : arms
          ? "Edit the seat, backrest, four legs, armrests and their supports."
          : "Edit the seat, backrest and four splayed legs.",
    hint: "Dimensions stay inside the whole-object envelope. Legs follow the seat underside. Group edits preserve custom members; apply group settings to replace their overrides.",
    defaults(d) {
      const min = Math.min(d.width, d.depth),
        surface = { color: d.color, material: d.material },
        frame = { color: d.accent, material: "matte" };
      const seat = {
        thickness: cm(stool ? Math.min(5, d.height * 0.08) : d.height * 0.105),
        ...(!stool ? { height: cm(d.height * 0.5325) } : {}),
        ...surface,
      };
      const legs = { section: cm(Math.max(0.3, min * 0.068)), ...frame };
      const out = { seat, legs, ...inherited(d, "legs", SEATING_LEGS, legs) };
      if (!stool) {
        const back = { thickness: cm(d.depth * 0.15), ...surface };
        if (slatted) {
          const slats = { ...back, gap: cm(d.width * 0.0125) };
          out["back-slats"] = slats;
          Object.assign(out, inherited(d, "back-slats", BACK_SLATS, slats));
        } else out.back = back;
      }
      if (arms) {
        const armrests = {
          height: cm(d.height * 0.64),
          section: cm(Math.min(d.width * 0.07, d.depth * 0.1, d.height * 0.05)),
          ...frame,
        };
        out.armrests = armrests;
        Object.assign(
          out,
          inherited(d, "armrests", ["left", "right"], armrests),
        );
        out["arm-supports"] = { ...frame };
        Object.assign(
          out,
          inherited(d, "arm-supports", ["left", "right"], frame),
        );
      }
      if (stool) {
        const stretchers = {
          height: cm(d.height * 0.3),
          section: cm(
            Math.max(0.3, Math.min(2.2, min * 0.07, d.height * 0.05)),
          ),
          ...frame,
        };
        out.stretchers = stretchers;
        Object.assign(out, inherited(d, "stretchers", STRETCHERS, stretchers));
      }
      return out;
    },
    limits(d, id, key) {
      const min = Math.min(d.width, d.depth);
      if (id === "seat")
        return key === "height"
          ? [d.height * 0.3, d.height * 0.55]
          : [0.3, d.height * (stool ? 0.15 : 0.12)];
      if (id === "back" || id === "back-slats")
        return key === "gap" ? [0, d.width * 0.025] : [0.3, d.depth * 0.18];
      if (id === "legs" || parts[id]?.parent === "legs")
        return [0.3, min * 0.12];
      if (id === "armrests" || parts[id]?.parent === "armrests")
        return key === "height"
          ? [d.height * 0.62, d.height * 0.8]
          : [0.3, Math.min(min * 0.12, d.height * 0.05)];
      if (id === "stretchers" || parts[id]?.parent === "stretchers")
        return key === "height"
          ? [d.height * 0.15, d.height * 0.45]
          : [0.3, Math.max(0.3, Math.min(min * 0.07, d.height * 0.05))];
      throw Error("Unsupported seating dimension.");
    },
    readout(d, p, id) {
      if (id === "legs" || parts[id]?.parent === "legs")
        return "Section measures the horizontal cross section. Splay and leg length follow the seat anchors.";
      if (id === "arm-supports" || parts[id]?.parent === "arm-supports")
        return "Support size and endpoints follow the corresponding armrest and seat. Finish can be customized independently.";
      if (id === "back-slats" || parts[id]?.parent === "back-slats")
        return "Five fixed slats. Shared thickness and gap determine their dimensions; each slat can have its own finish.";
      return "";
    },
  };
}
export const armchairProfile = createSeatingProfile("armchair");
export const armlessChairProfile = createSeatingProfile("armless-chair");
export const slattedChairProfile = createSeatingProfile("slatted-chair");
export const stoolProfile = createSeatingProfile("stool");

export function solveSeating(d, p) {
  const stool = d.kind === "stool",
    w = d.width / 100,
    h = d.height / 100,
    z = d.depth / 100;
  const seatTop = stool ? h : p.seat.height / 100,
    seatBottom = seatTop - p.seat.thickness / 100;
  const backThickness = stool ? 0 : (p.back || p["back-slats"]).thickness / 100;
  const topX = stool && d.shape === "round" ? 0.29 : 0.34,
    topZ = stool && d.shape === "round" ? 0.29 : 0.33;
  const legs = Object.fromEntries(
    SEATING_LEGS.map((id) => {
      const x = id.endsWith("left") ? -1 : 1,
        zz = id.startsWith("front") ? 1 : -1;
      return [
        id,
        {
          bottom: [x * w * 0.39, 0, zz * z * 0.39],
          top: [x * w * topX, seatBottom, zz * z * topZ],
          section: p[`legs.${id}`].section / 100,
        },
      ];
    }),
  );
  return { w, h, z, stool, seatTop, seatBottom, backThickness, legs };
}
