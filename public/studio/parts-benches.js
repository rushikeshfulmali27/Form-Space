import { SEATING_LEGS } from "./parts-seating.js";
export const BENCH_SEAT_SLATS = ["01", "02", "03", "04"];
export const BENCH_BACK_SLATS = ["01", "02", "03"];
const SIDES = ["left", "right"];
const cm = (n) => Math.round(n * 100) / 100;
const members = (group, ids, fields) =>
  Object.fromEntries(
    ids.map((id) => [
      `${group}.${id}`,
      {
        parent: group,
        fields,
        label:
          group === "seat-slats"
            ? `Seat slat ${id} (rear to front)`
            : group === "back-slats"
              ? `Back slat ${id} (bottom to top)`
              : `${id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase())} ${group === "legs" ? "leg" : group === "bearers" ? "seat bearer" : "back support"}`,
        ...(group === "back-slats"
          ? { fieldLabels: { height: "Slat height", thickness: "Slat depth" } }
          : {}),
      },
    ]),
  );
const inherited = (d, group, ids, values) =>
  Object.fromEntries(
    ids.map((id) => [`${group}.${id}`, { ...values, ...d.parts?.[group] }]),
  );

export function createBenchProfile(backrest) {
  const parts = {
    "seat-slats": {
      label: "All four seat slats",
      group: true,
      fields: [...(backrest ? ["height"] : []), "thickness", "gap"],
      fieldLabels: { height: "Seat top height" },
    },
    ...members("seat-slats", BENCH_SEAT_SLATS, ["thickness"]),
    bearers: { label: "Both seat bearers", group: true, fields: ["section"] },
    ...members("bearers", SIDES, ["section"]),
    legs: { label: "All four legs", group: true, fields: ["section"] },
    ...members("legs", SEATING_LEGS, ["section"]),
    ...(backrest
      ? {
          "back-slats": {
            label: "All three back slats",
            group: true,
            fields: ["height", "thickness"],
            fieldLabels: { height: "Slat height", thickness: "Slat depth" },
          },
          ...members("back-slats", BENCH_BACK_SLATS, ["height", "thickness"]),
          "back-supports": {
            label: "Both back supports",
            group: true,
            fields: ["section"],
          },
          ...members("back-supports", SIDES, ["section"]),
        }
      : {}),
  };
  return {
    id: backrest ? "backrest-bench" : "backless-bench",
    builder: "bench",
    revision: 1,
    legacyUnversioned: true,
    parts,
    description: backrest
      ? "Edit four seat slats, two seat bearers, four legs, three back slats and two back supports."
      : "Edit four seat slats, two seat bearers and four splayed legs.",
    hint: "Slat counts stay fixed. Group edits preserve custom members. Seat bearers connect all four boards to the legs. Whole-object dimensions remain the outer bounds.",
    defaults(d) {
      const min = Math.min(d.width, d.depth),
        surface = { color: d.color, material: d.material },
        frame = { color: d.accent, material: "matte" };
      const seat = {
        ...(backrest ? { height: cm(d.height * 0.54) } : {}),
        thickness: cm(Math.min(4, d.height * 0.1)),
        gap: cm(d.depth * 0.025),
        ...surface,
      };
      const bearers = {
        section: cm(Math.max(0.3, Math.min(4, min * 0.08, d.height * 0.05))),
        ...frame,
      };
      const legs = {
        section: cm(Math.max(0.3, Math.min(5, min * 0.08))),
        ...frame,
      };
      const out = {
        "seat-slats": seat,
        ...inherited(d, "seat-slats", BENCH_SEAT_SLATS, seat),
        bearers,
        ...inherited(d, "bearers", SIDES, bearers),
        legs,
        ...inherited(d, "legs", SEATING_LEGS, legs),
      };
      if (backrest) {
        const back = {
            height: cm(d.height * 0.105),
            thickness: cm(Math.min(2.5, d.depth * 0.08)),
            ...surface,
          },
          supports = {
            section: cm(Math.max(0.3, Math.min(3.5, min * 0.08))),
            ...frame,
          };
        out["back-slats"] = back;
        Object.assign(out, inherited(d, "back-slats", BENCH_BACK_SLATS, back));
        out["back-supports"] = supports;
        Object.assign(out, inherited(d, "back-supports", SIDES, supports));
      }
      return out;
    },
    limits(d, id, key) {
      const group = parts[id]?.parent || id,
        min = Math.min(d.width, d.depth);
      if (group === "seat-slats")
        return key === "height"
          ? [d.height * 0.35, d.height * 0.58]
          : key === "gap"
            ? [0, d.depth * 0.04]
            : [0.3, d.height * 0.12];
      if (group === "bearers")
        return [0.3, Math.min(min * 0.1, d.height * 0.06)];
      if (group === "legs") return [0.3, min * 0.12];
      if (group === "back-slats")
        return key === "height"
          ? [d.height * 0.04, d.height * 0.12]
          : [0.3, d.depth * 0.12];
      if (group === "back-supports") return [0.3, min * 0.1];
      throw Error("Unsupported bench dimension.");
    },
    readout(d, p, id) {
      const group = parts[id]?.parent || id;
      if (group === "seat-slats")
        return backrest
          ? "Seat boards share one top height. Thickness can differ per board; bearers and legs follow underneath."
          : "Seat top is the overall height. Thickness can differ per board; bearers and legs follow underneath.";
      if (group === "back-slats")
        return "Three fixed horizontal boards. Spacing follows seat height and each board's height; the top board reaches total height.";
      if (group === "legs")
        return "Section is the horizontal cross section. Splayed legs stay grounded and follow their seat bearer's underside.";
      return "";
    },
  };
}
export const gardenBenchProfile = createBenchProfile(true);
export const cafeBenchProfile = createBenchProfile(false);

export function solveBench(d, p) {
  const w = d.width / 100,
    h = d.height / 100,
    z = d.depth / 100,
    backrest = d.variant === "backrest";
  const seatTop = backrest ? p["seat-slats"].height / 100 : h,
    gap = p["seat-slats"].gap / 100,
    slatDepth = (z - 3 * gap) / 4;
  const bearerTop =
    seatTop -
    Math.min(...BENCH_SEAT_SLATS.map((id) => p[`seat-slats.${id}`].thickness)) /
      100;
  const bearers = Object.fromEntries(
    SIDES.map((side) => [
      side,
      {
        x: (side === "left" ? -1 : 1) * w * 0.4,
        top: bearerTop,
        bottom: bearerTop - p[`bearers.${side}`].section / 100,
      },
    ]),
  );
  const legs = Object.fromEntries(
    SEATING_LEGS.map((id) => {
      const side = id.endsWith("left") ? "left" : "right",
        sign = side === "left" ? -1 : 1,
        front = id.startsWith("front") ? 1 : -1;
      return [
        id,
        {
          bottom: [sign * w * 0.43, 0, front * z * 0.4],
          top: [bearers[side].x, bearers[side].bottom, front * z * 0.35],
          section: p[`legs.${id}`].section / 100,
        },
      ];
    }),
  );
  let back;
  if (backrest) {
    const depth =
      Math.max(
        ...BENCH_BACK_SLATS.map((id) => p[`back-slats.${id}`].thickness),
        ...SIDES.map((side) => p[`back-supports.${side}`].section),
      ) / 100;
    const heights = BENCH_BACK_SLATS.map(
        (id) => p[`back-slats.${id}`].height / 100,
      ),
      bottom = seatTop + h * 0.03;
    const spacing = (h - bottom - heights.reduce((a, b) => a + b, 0)) / 2;
    let y = bottom;
    const slats = heights.map((height) => {
      const slat = { bottom: y, top: y + height };
      y += height + spacing;
      return slat;
    });
    back = {
      z: -z / 2 + depth / 2,
      slats,
      spacing,
      bottom: seatTop - p["seat-slats.01"].thickness / 200,
    };
  }
  return { w, h, z, seatTop, gap, slatDepth, bearers, legs, back };
}
