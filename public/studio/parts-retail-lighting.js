// ID-owned recipes: imported metadata never chooses construction or member count.
const recipes = Object.freeze({
  "pastry-display-stand": "trays",
  "plant-stand": "plants",
  "garment-rail": "rail",
  "hanging-rack": "rail-shelf",
  "accessory-stand": "accessory",
  "brochure-holder": "pockets",
  "promotional-stand": "promo",
  "freestanding-logo-display": "logo",
  "floor-lamp": "lamp",
  "table-lamp": "lamp",
  "pendant-light": "pendant",
  "pendant-lamp": "pendant",
});
export const RETAIL_LIGHTING_OBJECTS = Object.freeze(Object.keys(recipes));
export function retailRecipe(d) {
  if (!Object.hasOwn(recipes, d.id))
    throw Error("Unknown retail/lighting object.");
  return recipes[d.id];
}
export const trayCount = (d) =>
  Math.max(2, Math.min(6, Math.round(d.shelves || 3)));
const ids = (n) =>
  Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, "0"));
const cm = (n) => Math.round(n * 100) / 100;
const def = (label, fields, extra = {}) => ({ label, fields, ...extra });
const group = (label, fields) => def(label, fields, { group: true });
const members = (root, slots, fields, name) =>
  Object.fromEntries(
    slots.map((id) => [
      `${root}.${id}`,
      def(`${name} ${id}`, fields, { parent: root }),
    ]),
  );
const sides = ["left", "right"],
  fixed = ids(3);
export function retailDefinitions(d) {
  const type = retailRecipe(d);
  if (type === "trays")
    return {
      posts: group("Both support posts", ["section"]),
      ...members("posts", sides, ["section"], "Post"),
      trays: group("All trays", ["thickness"]),
      ...Object.fromEntries(
        ids(trayCount(d)).map((slot, i) => [
          `trays.${slot}`,
          def(
            `Tray ${slot} (bottom to top)`,
            [
              "thickness",
              ...(i > 0 ? ["width", "depth"] : []),
              ...(i > 0 && i < trayCount(d) - 1 ? ["height"] : []),
            ],
            {
              parent: "trays",
              fieldLabels: { height: "Center height from floor" },
            },
          ),
        ]),
      ),
    };
  if (type === "plants")
    return {
      platforms: group("All three platforms", ["thickness"]),
      ...Object.fromEntries(
        fixed.map((slot, i) => [
          `platforms.${slot}`,
          def(
            `Platform ${slot}`,
            ["thickness", "width", ...(i < 2 ? ["height"] : [])],
            {
              parent: "platforms",
              fieldLabels: { height: "Platform top height" },
            },
          ),
        ]),
      ),
      supports: group("All six supports", ["section"]),
      ...members(
        "supports",
        fixed.flatMap((slot) => [`${slot}-front`, `${slot}-rear`]),
        ["section"],
        "Support",
      ),
    };
  if (type.startsWith("rail"))
    return {
      feet: group("Both feet", ["width", "height"]),
      ...members("feet", sides, ["width", "height"], "Foot"),
      uprights: group("Both uprights", ["section"]),
      ...members("uprights", sides, ["section"], "Upright"),
      rail: def("Top hanging rail", ["section"]),
      ...(type === "rail-shelf"
        ? {
            shelf: def("Lower shelf", ["height", "thickness"], {
              fieldLabels: { height: "Shelf center height" },
            }),
          }
        : {}),
    };
  if (type === "accessory")
    return {
      base: def("Base", ["thickness"]),
      mast: def("Central mast", ["section"]),
      crossbars: group("Both crossbars", ["section", "width"]),
      "crossbars.lower": def("Lower crossbar", ["section", "width", "height"], {
        parent: "crossbars",
        fieldLabels: { height: "Center height from floor" },
      }),
      "crossbars.upper": def("Upper crossbar", ["section", "width"], {
        parent: "crossbars",
      }),
    };
  if (type === "pockets")
    return {
      base: def("Base", ["thickness"]),
      mast: def("Support mast", ["section"]),
      backs: group("All pocket backs", ["thickness", "width"]),
      ...members("backs", fixed, ["thickness", "width"], "Pocket back"),
      floors: group("All pocket floors", ["thickness"]),
      ...members("floors", fixed, ["thickness"], "Pocket floor"),
      lips: group("All pocket lips", ["thickness", "height"]),
      ...members("lips", fixed, ["thickness", "height"], "Pocket lip"),
    };
  if (type === "promo")
    return {
      base: def("Base", ["thickness"]),
      back: def("Display back", ["thickness"]),
      shelves: group("Both display shelves", ["thickness"]),
      ...members("shelves", ["01", "02"], ["thickness", "height"], "Shelf"),
    };
  if (type === "logo")
    return {
      base: def("Base", ["thickness"]),
      support: def("Mark support", ["section"]),
      mark: group("Fixed logo mark", ["section", "thickness"]),
      ...members(
        "mark",
        ["stem", "top", "middle"],
        ["section", "thickness"],
        "Mark bar",
      ),
    };
  return {
    ...(type === "lamp"
      ? {
          base: def("Lamp base", ["thickness"]),
          stem: def("Stem", ["diameter"]),
        }
      : {
          mount: def("Ceiling mount", ["thickness"]),
          cable: def("Suspension cable", ["diameter"]),
        }),
    shade: def("Tapered shade", ["height"]),
    diffuser: def("Diffuser", ["thickness"]),
  };
}
export function retailLimits(d, id, key) {
  const type = retailRecipe(d),
    W = d.width,
    H = d.height,
    D = d.depth,
    M = Math.min(W, D),
    root = id.split(".")[0];
  if (type === "trays") {
    if (root === "posts") return [0.1, Math.min(M * 0.08, H * 0.04)];
    const i = Number(id.split(".")[1]) - 1;
    if (key === "thickness")
      return [0.1, Math.min((H / (trayCount(d) + 1)) * 0.1, D * 0.1)];
    if (key === "width") return [W * 0.42, W * (1 - i * 0.08)];
    if (key === "depth") return [D * 0.4, D * (1 - i * 0.06)];
    const y = (H * i) / (trayCount(d) - 1),
      delta = (H * 0.12) / (trayCount(d) + 1);
    return [y - delta, y + delta];
  }
  if (type === "plants") {
    if (root === "supports")
      return [0.1, Math.min(W * 0.06, D * 0.1, H * 0.04)];
    if (key === "thickness") return [H * 0.02, H * 0.08];
    if (key === "width") return [W * 0.22, W * 0.36];
    return id === "platforms.01" ? [H * 0.28, H * 0.44] : [H * 0.53, H * 0.69];
  }
  if (type.startsWith("rail")) {
    if (root === "feet")
      return key === "height" ? [H * 0.02, H * 0.08] : [W * 0.12, W * 0.22];
    if (root === "uprights") return [0.1, Math.min(M * 0.08, H * 0.04)];
    if (root === "rail") return [0.1, Math.min(M * 0.1, H * 0.05)];
    return key === "height" ? [H * 0.12, H * 0.3] : [0.1, H * 0.05];
  }
  if (type === "accessory") {
    if (root === "base") return [H * 0.02, H * 0.12];
    if (root === "mast") return [0.1, M * 0.12];
    if (key === "width") return [W * 0.4, W * 0.95];
    if (key === "height") return [H * 0.35, H * 0.65];
    return [0.1, Math.min(M * 0.12, H * 0.05)];
  }
  if (type === "pockets") {
    if (root === "base") return [H * 0.02, H * 0.08];
    if (root === "mast") return [0.1, Math.min(M * 0.1, H * 0.05)];
    if (key === "width") return [W * 0.6, W * 0.9];
    if (key === "height") return [H * 0.04, H * 0.12];
    return [0.1, Math.min(H * 0.04, D * 0.08)];
  }
  if (type === "promo") {
    if (root === "base") return [H * 0.08, H * 0.2];
    if (root === "back") return [0.1, D * 0.15];
    if (key === "thickness") return [0.1, Math.min(H * 0.05, D * 0.12)];
    return id === "shelves.01" ? [H * 0.23, H * 0.37] : [H * 0.52, H * 0.72];
  }
  if (type === "logo") {
    if (root === "base") return [H * 0.06, H * 0.16];
    if (root === "support") return [0.1, Math.min(W * 0.1, D * 0.12)];
    return key === "section"
      ? [0.1, Math.min(W * 0.2, H * 0.14)]
      : [0.1, D * 0.25];
  }
  if (root === "base") return [H * 0.01, H * 0.08];
  if (root === "mount") return [H * 0.02, H * 0.08];
  if (root === "stem") return [0.05, Math.min(M * 0.1, H * 0.04)];
  if (root === "cable") return [0.05, Math.min(M * 0.025, H * 0.02)];
  if (root === "shade")
    return type === "lamp" ? [H * 0.18, H * 0.38] : [H * 0.24, H * 0.45];
  return [0.05, Math.min(H * 0.02, M * 0.05)];
}
function defaultValue(d, id, key) {
  const type = retailRecipe(d),
    W = d.width,
    H = d.height,
    D = d.depth,
    root = id.split(".")[0],
    i = Number(id.split(".")[1]) - 1;
  if (type === "trays")
    return key === "section"
      ? 3
      : key === "thickness"
        ? 4
        : key === "height"
          ? (H * i) / (trayCount(d) - 1)
          : key === "width"
            ? W * (1 - i * 0.12)
            : D * (1 - i * 0.1);
  if (type === "plants")
    return key === "section"
      ? 2.5
      : key === "thickness"
        ? 2.5
        : key === "width"
          ? W / 3
          : H * (id.endsWith("01") ? 0.4 : 0.65);
  if (type.startsWith("rail"))
    return root === "feet"
      ? key === "width"
        ? W * 0.14
        : 5
      : key === "section"
        ? 3.5
        : key === "height"
          ? H * 0.16
          : 2.5;
  if (type === "accessory")
    return key === "height"
      ? H * 0.55
      : key === "width"
        ? W * 0.9
        : key === "thickness"
          ? 4
          : 2.5;
  if (type === "pockets")
    return key === "width"
      ? W * 0.9
      : key === "height"
        ? H * 0.12
        : root === "base"
          ? H * 0.05
          : key === "section"
            ? 3.5
            : 2;
  if (type === "promo")
    return root === "base"
      ? H * 0.16
      : root === "back"
        ? 3.5
        : key === "thickness"
          ? 2.5
          : id.endsWith("01")
            ? H * 0.25
            : H * 0.59;
  if (type === "logo")
    return root === "base"
      ? H * 0.12
      : root === "support"
        ? W * 0.08
        : key === "section"
          ? Math.min(W * 0.18, H * 0.14)
          : D * 0.24;
  return root === "base"
    ? 3.6
    : root === "mount"
      ? H * 0.04
      : root === "stem"
        ? 2.8
        : root === "cable"
          ? 0.8
          : root === "shade"
            ? H * (type === "lamp" ? 0.24 : 0.34)
            : 0.5;
}
export function retailDefaults(d) {
  const type = retailRecipe(d),
    out = {};
  for (const [id, definition] of Object.entries(retailDefinitions(d))) {
    const accent =
      /^(base|mount|stem|cable|posts|supports|feet|uprights|mast|support)/.test(
        id,
      ) ||
      (type === "promo" && id.startsWith("shelves"));
    const value = {
      color: accent ? d.accent : d.color,
      material: accent ? "matte" : d.material,
    };
    if (id === "diffuser")
      Object.assign(value, {
        color: type === "lamp" ? "#ebd9ad" : "#ede0b8",
        material: "matte",
      });
    for (const key of definition.fields) {
      const [min, max] = retailLimits(d, id, key).map(cm);
      value[key] = cm(Math.max(min, Math.min(max, defaultValue(d, id, key))));
    }
    if (definition.parent)
      for (const key of [...definition.fields, "material", "color"])
        if (Object.hasOwn(d.parts?.[definition.parent] || {}, key))
          value[key] = d.parts[definition.parent][key];
    out[id] = value;
  }
  return out;
}
export const retailLightingProfile = {
  id: "retail-lighting",
  builder: "retail-lighting",
  revision: 1,
  legacyUnversioned: true,
  shelfCountLabel: "Tray count",
  parts: retailDefinitions,
  defaults: retailDefaults,
  limits: retailLimits,
  description:
    "Select a component to edit its dimensions and finish. Connected parts follow their anchors.",
  hint: "Use Whole object for overall size. Groups link member settings; Apply and Reset control individual overrides.",
  readout(d, p, id) {
    const type = retailRecipe(d);
    if (type === "trays")
      return "Count includes the first and last trays, anchored at floor/top. Internal center heights stay in separate safe bands; posts fit inside the smallest allowed footprint.";
    if (type === "plants")
      return "Three fixed platforms: widths move the outer centers to preserve overall width. Supports follow each platform underside; the highest top follows total height.";
    if (type === "logo")
      return "The three-bar mark stays fixed. Support follows the vertical stroke. Stroke section changes width on the vertical bar and height on horizontal bars; thickness is depth.";
    if (type === "lamp")
      return "Shade top follows total height. Stem connects the grounded base through the diffuser to the shade. Finishes do not emit light.";
    if (type === "pendant")
      return "Total height is the ceiling-to-bottom drop. The cable follows the ceiling mount and shade; the diffuser stays at the bottom datum. Finishes do not emit light.";
    if (type === "pockets")
      return "Three fixed pockets. Floors and lips follow their back width; pocket heights remain fixed and the mast connects them to the base.";
    return "Attached component positions follow their resolved dimensions. Fixed members cannot be added or removed.";
  },
};

export function solveRetailLighting(d, p) {
  const type = retailRecipe(d),
    W = d.width,
    H = d.height,
    D = d.depth,
    shapes = [];
  const box = (id, x, y, z, w, h, depth) =>
    shapes.push({ id, kind: "box", center: [x, y, z], size: [w, h, depth] });
  const cylinder = (id, y, w, h, depth, taper = 1) =>
    shapes.push({
      id,
      kind: "cylinder",
      center: [0, y, 0],
      size: [w, h, depth],
      taper,
    });
  const pair = (root, fn) =>
    sides.forEach((side, i) => fn(`${root}.${side}`, i === 0 ? -1 : 1));
  if (type === "trays") {
    const slots = ids(trayCount(d)),
      postTop = H - p[`trays.${slots.at(-1)}`].thickness;
    pair("posts", (id, sign) => {
      const s = p[id].section;
      box(id, sign * W * 0.15, postTop / 2, -D * 0.14, s, postTop, s);
    });
    slots.forEach((slot, i) => {
      const id = `trays.${slot}`,
        t = p[id].thickness,
        y = i === 0 ? t / 2 : i === slots.length - 1 ? H - t / 2 : p[id].height;
      box(id, 0, y, 0, i === 0 ? W : p[id].width, t, i === 0 ? D : p[id].depth);
    });
  } else if (type === "plants") {
    fixed.forEach((slot, i) => {
      const id = `platforms.${slot}`,
        t = p[id].thickness,
        w = p[id].width,
        top = i === 2 ? H : p[id].height,
        x = i === 0 ? -W / 2 + w / 2 : i === 2 ? W / 2 - w / 2 : 0;
      box(id, x, top - t / 2, 0, w, t, D);
      for (const side of ["front", "rear"]) {
        const support = `supports.${slot}-${side}`,
          s = p[support].section;
        box(
          support,
          x,
          (top - t) / 2,
          (side === "front" ? 1 : -1) * (D / 2 - s / 2),
          s,
          top - t,
          s,
        );
      }
    });
  } else if (type.startsWith("rail")) {
    const top = H - p.rail.section;
    pair("feet", (id, sign) => {
      const w = p[id].width,
        h = p[id].height,
        x = sign * (W / 2 - w / 2),
        upright = `uprights.${id.split(".")[1]}`,
        s = p[upright].section;
      box(id, x, h / 2, 0, w, h, D);
      box(upright, x, (h / 2 + top) / 2, 0, s, top - h / 2, s);
    });
    box(
      "rail",
      0,
      H - p.rail.section / 2,
      0,
      W,
      p.rail.section,
      p.rail.section,
    );
    if (type === "rail-shelf")
      box("shelf", 0, p.shelf.height, 0, W, p.shelf.thickness, D);
  } else if (type === "accessory") {
    const t = p.base.thickness,
      s = p.mast.section,
      top = H - p["crossbars.upper"].section / 2;
    box("base", 0, t / 2, 0, W, t, D);
    box("mast", 0, (t / 2 + top) / 2, 0, s, top - t / 2, s);
    for (const slot of ["lower", "upper"]) {
      const id = `crossbars.${slot}`,
        q = p[id];
      box(
        id,
        0,
        slot === "upper" ? H - q.section / 2 : q.height,
        s / 2 + q.section / 2,
        q.width,
        q.section,
        q.section,
      );
    }
  } else if (type === "pockets") {
    const t = p.base.thickness,
      s = p.mast.section;
    box("base", 0, t / 2, 0, W, t, D);
    box(
      "mast",
      0,
      (t / 2 + H * 0.9) / 2,
      -D / 2 + s / 2,
      s,
      H * 0.9 - t / 2,
      s,
    );
    fixed.forEach((slot, i) => {
      const back = p[`backs.${slot}`],
        floor = p[`floors.${slot}`],
        lip = p[`lips.${slot}`],
        y = H * (0.3 + i * 0.25),
        w = back.width + W * 0.1;
      box(
        `backs.${slot}`,
        0,
        (y - floor.thickness + y + H * 0.2) / 2,
        -D / 2 + s + back.thickness / 2,
        back.width,
        H * 0.2 + floor.thickness,
        back.thickness,
      );
      box(
        `floors.${slot}`,
        0,
        y - floor.thickness / 2,
        0,
        w,
        floor.thickness,
        D,
      );
      box(
        `lips.${slot}`,
        0,
        y - floor.thickness / 2 + lip.height / 2,
        D / 2 - lip.thickness / 2,
        w,
        lip.height,
        lip.thickness,
      );
    });
  } else if (type === "promo") {
    const t = p.base.thickness,
      b = p.back.thickness;
    box("base", 0, t / 2, 0, W, t, D);
    box("back", 0, (t / 2 + H) / 2, -D / 2 + b / 2, W * 0.82, H - t / 2, b);
    for (const slot of ["01", "02"]) {
      const id = `shelves.${slot}`,
        q = p[id];
      box(id, 0, q.height, b / 2, W, q.thickness, D - b);
    }
  } else if (type === "logo") {
    const t = p.base.thickness,
      s = p.support.section,
      stroke = p["mark.stem"].section,
      x = -W * 0.32 + stroke / 2;
    box("base", 0, t / 2, 0, W, t, D);
    box("support", x, (t / 2 + H * 0.32) / 2, 0, s, H * 0.32 - t / 2, s);
    box(
      "mark.stem",
      x,
      (H * 0.32 + H - p["mark.top"].section) / 2,
      0,
      stroke,
      H * 0.68 - p["mark.top"].section,
      p["mark.stem"].thickness,
    );
    for (const slot of ["top", "middle"]) {
      const id = `mark.${slot}`,
        q = p[id],
        left = -W * 0.32 + (slot === "middle" ? stroke : 0),
        w =
          W * (slot === "top" ? 0.67 : 0.56) - (slot === "middle" ? stroke : 0),
        top = H * (slot === "top" ? 1 : 0.7);
      box(id, left + w / 2, top - q.section / 2, 0, w, q.section, q.thickness);
    }
  } else if (type === "lamp") {
    const b = p.base.thickness,
      s = p.stem.diameter,
      shade = p.shade.height,
      diff = p.diffuser.thickness,
      bottom = H - shade,
      stemTop = bottom + shade * 0.25;
    cylinder("base", b / 2, W * 0.64, b, D * 0.64);
    cylinder("stem", (b / 2 + stemTop) / 2, s, stemTop - b / 2, s);
    cylinder("shade", bottom + shade / 2, W, shade, D, 0.52);
    cylinder("diffuser", bottom - diff / 2, W * 0.92, diff, D * 0.92);
  } else {
    const mount = p.mount.thickness,
      c = p.cable.diameter,
      shade = p.shade.height,
      diff = p.diffuser.thickness,
      cableBottom = diff + shade * 0.9,
      cableTop = H - mount / 2;
    cylinder("mount", H - mount / 2, W * 0.32, mount, D * 0.32);
    cylinder(
      "cable",
      (cableBottom + cableTop) / 2,
      c,
      cableTop - cableBottom,
      c,
    );
    cylinder("shade", diff + shade / 2, W, shade, D, 0.28);
    cylinder("diffuser", diff / 2, W * 0.94, diff, D * 0.94);
  }
  return shapes;
}
