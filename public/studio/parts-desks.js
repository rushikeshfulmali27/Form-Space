const cm = (n) => Math.round(n * 100) / 100;
export const DESK_LEGS = [
  "front-left",
  "rear-left",
  "front-right",
  "rear-right",
];
const definitions = {
  tabletop: {
    label: "Tabletop",
    fields: ["thickness"],
    globalFields: ["width", "depth", "shape"],
  },
  legs: { label: "All legs", fields: ["section", "inset"], group: true },
  ...Object.fromEntries(
    DESK_LEGS.map((id) => [
      `legs.${id}`,
      {
        label:
          id
            .split("-")
            .map((s) => s[0].toUpperCase() + s.slice(1))
            .join(" ") + " leg",
        fields: ["section"],
        parent: "legs",
      },
    ]),
  ),
  feet: {
    label: "Both feet",
    fields: ["width", "depth", "thickness"],
    group: true,
  },
  "feet.left": {
    label: "Left foot",
    fields: ["width", "depth", "thickness"],
    parent: "feet",
  },
  "feet.right": {
    label: "Right foot",
    fields: ["width", "depth", "thickness"],
    parent: "feet",
  },
  "rear-brace": { label: "Rear brace", fields: ["section"] },
};
export const standardDeskProfile = {
  id: "standard-desk",
  revision: 1,
  builder: "standard-desk",
  legacyUnversioned: true,
  description:
    "Edit the top, four legs, two feet and rear brace. Expand a group to edit one member.",
  hint: "Legs follow the top and feet. Group edits preserve custom members; apply group settings to replace member overrides.",
  parts: definitions,
  defaults(d) {
    const min = Math.min(d.width, d.depth),
      frame = { color: d.accent, material: "matte" };
    const legs = {
      section: cm(Math.min(4, min * 0.1)),
      inset: cm(min * 0.04),
      ...frame,
    };
    const feet = {
      width: cm(Math.min(6, min * 0.15)),
      depth: cm(d.depth * 0.83),
      thickness: cm(Math.min(5, d.height * 0.1)),
      ...frame,
    };
    return {
      tabletop: {
        thickness: Math.min(4.5, d.height * 0.08),
        color: d.color,
        material: d.material,
      },
      legs,
      ...Object.fromEntries(
        DESK_LEGS.map((id) => [`legs.${id}`, { ...legs, ...d.parts?.legs }]),
      ),
      feet,
      "feet.left": { ...feet, ...d.parts?.feet },
      "feet.right": { ...feet, ...d.parts?.feet },
      "rear-brace": {
        section: cm(Math.min(4.5, min * 0.12, d.height * 0.08)),
        ...frame,
      },
    };
  },
  limits(d, id, key) {
    const min = Math.min(d.width, d.depth),
      def = definitions[id];
    if (!def || !def.fields.includes(key))
      throw Error("Unsupported part dimension.");
    if (id === "tabletop") return [0.5, Math.min(12, d.height - 10)];
    if (id === "legs" || def.parent === "legs")
      return key === "inset" ? [0, min * 0.12] : [0.3, min * 0.15];
    if (id === "feet" || def.parent === "feet") {
      if (key === "width") return [0.5, min * 0.25];
      if (key === "depth") return [d.depth * 0.4, d.depth * 0.95];
      return [0.3, Math.min(6, d.height * 0.12)];
    }
    return [0.3, Math.min(min * 0.15, d.height * 0.1)];
  },
  readout(d, p, id) {
    if (id === "legs" || definitions[id]?.parent === "legs")
      return "Leg lengths follow the tabletop underside and each foot. Inset is shared by the group.";
    return "";
  },
};

export function solveDesk(d, p) {
  const h = d.height / 100,
    t = p.tabletop.thickness / 100,
    inset = p.legs.inset / 100;
  const maxSection =
    Math.max(...DESK_LEGS.map((id) => p[`legs.${id}`].section)) / 100;
  const widest =
    Math.max(
      p["feet.left"].width,
      p["feet.right"].width,
      p["rear-brace"].section,
      maxSection * 100,
    ) / 100;
  const x = d.width / 200 - inset - widest / 2;
  const sides = {};
  for (const side of ["left", "right"]) {
    const foot = p[`feet.${side}`];
    sides[side] = {
      x: side === "left" ? -x : x,
      z: Math.max(
        0,
        Math.min(
          d.depth / 200 - inset - maxSection / 2,
          foot.depth / 200 - maxSection / 2,
        ),
      ),
      footTop: foot.thickness / 100,
    };
    if (d.shape === "round") {
      const radius = Math.hypot(
        sides[side].x / (d.width / 200),
        sides[side].z / (d.depth / 200),
      );
      const factor = Math.min(1, 0.7 / (radius || 1));
      sides[side].x *= factor;
      sides[side].z *= factor;
    }
    if (d.id === "patio-table") {
      const gap = p.tabletop.gap / 100;
      const slat = (d.width / 100 - 6 * gap) / 7;
      const candidates = Array.from(
        { length: 7 },
        (_, i) => -d.width / 200 + slat / 2 + i * (slat + gap),
      );
      // Snap inward to a slat so even a thin support cannot end in a gap.
      const target = Math.abs(sides[side].x);
      const center = Math.max(
        0,
        ...candidates.filter((n) => n >= -1e-8 && n <= target + 1e-8),
      );
      sides[side].x = side === "left" ? -center : center;
    }
  }
  const maxFoot = Math.max(sides.left.footTop, sides.right.footTop),
    brace = p["rear-brace"].section / 100;
  return {
    h,
    t,
    sides,
    braceY: Math.min(h - t - brace / 2, maxFoot + (h - t - maxFoot) * 0.85),
  };
}
