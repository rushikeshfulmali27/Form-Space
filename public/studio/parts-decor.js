// Construction is trusted catalog data; imported metadata cannot select a recipe.
const recipes = Object.freeze({
  chandelier: "chandelier",
  "wall-lamp": "wall-light",
  "wall-light": "wall-light",
  mirror: "wall-mirror",
  "mirror-stand": "standing-mirror",
  "workstation-partition": "solid-partition",
  "decorative-partition": "slatted-partition",
  "fitting-room-partition": "corner-partition",
  "whiteboard-stand": "whiteboard",
  "menu-stand": "a-board",
  signboard: "a-board",
  planter: "planter",
  "hanging-planter": "hanging-planter",
  "decorative-sculpture": "sculpture",
  "display-plinth": "plinth",
  "product-pedestal": "plinth",
  vase: "vase",
});
export const FINAL_OBJECTS = Object.freeze([
  "pendant-lamp",
  ...Object.keys(recipes),
]);
export function decorRecipe(d) {
  if (!Object.hasOwn(recipes, d.id)) throw Error("Unknown decor object.");
  return recipes[d.id];
}
const cm = (n) => Math.round(n * 100) / 100,
  slots = (n) =>
    Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, "0"));
export const DECOR_SLOTS = Object.freeze(slots(5));
const sides = ["left", "right"],
  legs = ["front-left", "front-right", "rear-left", "rear-right"];
const def = (label, fields, extra = {}) => ({ label, fields, ...extra }),
  group = (label, fields) => def(label, fields, { group: true });
const members = (root, ids, fields, label) =>
  Object.fromEntries(
    ids.map((id) => [
      `${root}.${id}`,
      def(`${label} ${id.replaceAll("-", " ")}`, fields, { parent: root }),
    ]),
  );
const framed = (type) =>
  ["wall-mirror", "standing-mirror", "whiteboard", "a-board"].includes(type);
export function decorDefinitions(d) {
  const type = decorRecipe(d);
  if (type === "chandelier")
    return {
      mount: def("Ceiling mount", ["thickness"]),
      stem: def("Central stem", ["diameter"]),
      arms: group("All five arms", ["section"]),
      ...members("arms", DECOR_SLOTS, ["section"], "Arm"),
      globes: group("All five globes", ["height"]),
      ...members("globes", DECOR_SLOTS, ["height"], "Globe"),
    };
  if (type === "wall-light")
    return {
      mount: def("Wall mount", ["height", "thickness"]),
      arm: def("Shade support arm", ["section"]),
      shade: def("Tapered shade", ["height"]),
    };
  if (framed(type))
    return {
      frame: def(
        "Frame rim",
        type === "wall-mirror" ? ["section"] : ["section", "thickness"],
        {
          fieldLabels: { section: "Border width" },
          ...(type === "wall-mirror" ? { globalFields: ["depth"] } : {}),
        },
      ),
      surface: def(
        type.includes("mirror") ? "Mirror surface" : "Board surface",
        ["thickness"],
      ),
      ...(type === "standing-mirror"
        ? {
            supports: group("Both angled supports", ["section"]),
            ...members("supports", sides, ["section"], "Support"),
            brace: def("Floor crossbrace", ["section"]),
          }
        : {}),
      ...(type === "whiteboard"
        ? {
            posts: group("Both posts", ["section"]),
            ...members("posts", sides, ["section"], "Post"),
            feet: group("Both feet", ["height"]),
            ...members("feet", sides, ["height"], "Foot"),
          }
        : {}),
      ...(type === "a-board"
        ? {
            legs: group("All four A-frame members", ["section"]),
            ...members("legs", legs, ["section"], "Support"),
          }
        : {}),
    };
  if (type.endsWith("partition"))
    return {
      feet: group("Both feet", ["width", "height"]),
      ...members("feet", sides, ["width", "height"], "Foot"),
      ...(type === "slatted-partition"
        ? {
            "base-rail": def("Slat base tie", ["height"]),
            slats: group("All nine slats", ["gap", "thickness"]),
            ...members("slats", slots(9), ["thickness"], "Slat"),
          }
        : {
            panel: def("Main panel", ["thickness"]),
            ...(type === "corner-partition"
              ? { return: def("Return panel", ["thickness"]) }
              : {}),
          }),
    };
  if (type.endsWith("planter"))
    return {
      pot: def("Open pot", ["width", "height", "depth"]),
      soil: def("Soil", ["thickness"]),
      stems: group("All five stems", ["section"]),
      ...members("stems", DECOR_SLOTS, ["section"], "Stem"),
      leaves: group("All five leaves", ["height"]),
      ...members("leaves", DECOR_SLOTS, ["height"], "Leaf"),
      ...(type === "hanging-planter"
        ? {
            suspension: group("All three straps", ["section"]),
            ...members("suspension", slots(3), ["section"], "Strap"),
          }
        : {}),
    };
  if (type === "sculpture")
    return {
      base: def("Base", ["height"]),
      lower: def("Lower form", ["height"]),
      upper: def("Upper form", ["height"]),
    };
  return {
    body: def("Continuous body", [], {
      globalFields: [
        "width",
        "height",
        "depth",
        ...(type === "plinth" ? ["shape"] : []),
      ],
    }),
  };
}
export function decorLimits(d, id, key) {
  const W = d.width,
    H = d.height,
    D = d.depth,
    M = Math.min(W, D),
    type = decorRecipe(d),
    root = id.split(".")[0];
  if (type === "chandelier") {
    if (root === "mount") return [H * 0.06, H * 0.16];
    if (root === "stem") return [0.05, Math.min(M * 0.06, H * 0.04)];
    if (root === "arms") return [0.1, Math.min(M * 0.05, H * 0.04)];
    return [H * 0.18, H * 0.34];
  }
  if (type === "wall-light") {
    if (root === "mount")
      return key === "height" ? [H * 0.7, H * 0.95] : [0.1, D * 0.15];
    if (root === "arm") return [0.1, Math.min(M * 0.08, H * 0.04)];
    return [H * 0.5, H * 0.75];
  }
  if (framed(type)) {
    if (root === "frame")
      return key === "section"
        ? [0.1, Math.min(W * 0.1, H * 0.05)]
        : [D * 0.08, D * 0.16];
    if (root === "surface")
      return [0.05, D * (type === "wall-mirror" ? 0.2 : 0.04)];
    if (root === "feet") return [H * 0.015, H * 0.06];
    return [0.1, Math.min(W * 0.06, D * 0.08, H * 0.03)];
  }
  if (type.endsWith("partition")) {
    if (root === "feet")
      return key === "width" ? [W * 0.05, W * 0.16] : [H * 0.015, H * 0.06];
    if (root === "base-rail") return [H * 0.02, H * 0.06];
    if (key === "gap") return [W * 0.02, W * 0.08];
    if (root === "return") return [0.1, Math.min(W * 0.12, D * 0.15)];
    return [0.1, D * 0.25];
  }
  if (type.endsWith("planter")) {
    const hanging = type === "hanging-planter";
    if (root === "pot")
      return key === "height"
        ? hanging
          ? [H * 0.24, H * 0.38]
          : [H * 0.3, H * 0.55]
        : [d[key] * 0.6, d[key] * 0.9];
    if (root === "soil") return [0.05, H * 0.02];
    if (root === "stems") return [0.05, Math.min(M * 0.025, H * 0.01)];
    if (root === "suspension") return [0.05, Math.min(M * 0.02, H * 0.005)];
    return hanging ? [H * 0.1, H * 0.18] : [H * 0.12, H * 0.24];
  }
  if (type === "sculpture")
    return root === "base"
      ? [H * 0.08, H * 0.2]
      : root === "lower"
        ? [H * 0.45, H * 0.6]
        : [H * 0.55, H * 0.68];
  throw Error("This body uses whole-object dimensions.");
}
function initial(d, id, key) {
  const type = decorRecipe(d),
    root = id.split(".")[0],
    H = d.height,
    W = d.width,
    D = d.depth;
  if (type === "chandelier")
    return root === "mount"
      ? H * 0.14
      : root === "stem"
        ? 2
        : root === "arms"
          ? 2.5
          : H * 0.34;
  if (type === "wall-light")
    return root === "mount"
      ? key === "height"
        ? H * 0.8
        : 2.5
      : root === "arm"
        ? 2.5
        : H * 0.68;
  if (framed(type))
    return root === "frame"
      ? key === "section"
        ? Math.min(3.5, W * 0.06, H * 0.03)
        : 2.5
      : root === "surface"
        ? 1.2
        : root === "feet"
          ? 4
          : 2.8;
  if (type.endsWith("partition"))
    return root === "feet"
      ? key === "width"
        ? 6
        : 5
      : root === "base-rail"
        ? 4.5
        : key === "gap"
          ? W * 0.055
          : 4;
  if (type.endsWith("planter"))
    return root === "pot"
      ? key === "height"
        ? H * (type === "hanging-planter" ? 0.38 : 0.47)
        : d[key] * 0.85
      : root === "soil"
        ? H * 0.015
        : root === "leaves"
          ? H * (type === "hanging-planter" ? 0.15 : 0.2)
          : 0.8;
  if (type === "sculpture")
    return H * (root === "base" ? 0.14 : root === "lower" ? 0.46 : 0.58);
}
export function decorDefaults(d) {
  const type = decorRecipe(d),
    out = {};
  for (const [id, definition] of Object.entries(decorDefinitions(d))) {
    const accent =
      /^(mount|stem$|arm|frame|supports|brace|posts|feet|legs|base|stems|leaves|suspension)/.test(
        id,
      );
    const p = {
      color: accent ? d.accent : d.color,
      material: accent ? "matte" : d.material,
    };
    if (id === "soil")
      Object.assign(p, { color: "#3b3023", material: "matte" });
    if (id === "surface" && type.includes("mirror")) p.material = "metal";
    for (const key of definition.fields) {
      const [min, max] = decorLimits(d, id, key).map(cm);
      p[key] = cm(Math.max(min, Math.min(max, initial(d, id, key))));
    }
    if (definition.parent)
      for (const key of [...definition.fields, "color", "material"])
        if (Object.hasOwn(d.parts?.[definition.parent] || {}, key))
          p[key] = d.parts[definition.parent][key];
    out[id] = p;
  }
  return out;
}
export const decorProfile = {
  id: "decor",
  builder: "decor",
  revision: 1,
  legacyUnversioned: true,
  parts: decorDefinitions,
  defaults: decorDefaults,
  limits: decorLimits,
  description:
    "Select a modeled component to edit its dimensions and finish. Connected parts follow their anchors.",
  hint: "Use Whole object for overall size. Groups link member settings; Apply and Reset control individual overrides.",
  readout(d, p, id) {
    const type = decorRecipe(d);
    if (type === "plinth" || type === "vase")
      return "One continuous body. Size and shape use whole-object settings; Reset selected part restores its inherited finish. Reset object restores original dimensions.";
    if (type.endsWith("planter"))
      return "Soil follows the open pot's inner wall. Five fixed stems connect the soil to their leaves. Canopy sets width/depth; hanging straps meet the rim and top anchor.";
    if (type === "chandelier")
      return "Five fixed angular slots. Arms meet the central stem and each globe; globes share the lower datum. Total height is the ceiling-to-bottom drop.";
    if (type === "wall-light")
      return "Wall mount sets the rear and lower datums. The arm follows the shade; shade top follows total height. Finishes do not emit light.";
    if (framed(type))
      return "Surface fits within the four-sided rim. Supports follow the frame. Wall-mirror frame depth uses the whole-object depth setting.";
    if (type === "slatted-partition")
      return "Nine fixed slats share a gap. Slat widths follow the available width; the base tie joins all slats to the feet.";
    return "Attached parts follow their resolved dimensions. Fixed construction and overall bounds stay consistent.";
  },
};
// Vase outer/inner profile is the released connected rotational contour.
export const VASE_PROFILE = Object.freeze([
  [0, 0],
  [0.02, 0.6],
  [0.12, 0.88],
  [0.38, 1],
  [0.66, 0.8],
  [0.87, 0.46],
  [1, 0.54],
  [1, 0.44],
  [0.87, 0.36],
  [0.66, 0.68],
  [0.15, 0.74],
  [0.07, 0],
]);
const POT_PROFILE = [
  [0, 0],
  [0, 1 / 1.27],
  [1, 1],
  [1, 0.9],
  [0.12, 0.9 / 1.27],
  [0.12, 0],
];
const innerRatio = (u) => 0.9 / 1.27 + ((u - 0.12) / 0.88) * (0.9 - 0.9 / 1.27);
function distribution() {
  const a = DECOR_SLOTS.map((id, i) => ({
      id,
      x: Math.cos((i * Math.PI * 2) / 5),
      z: Math.sin((i * Math.PI * 2) / 5),
    })),
    minX = Math.min(...a.map((p) => p.x)),
    maxX = Math.max(...a.map((p) => p.x)),
    minZ = Math.min(...a.map((p) => p.z)),
    maxZ = Math.max(...a.map((p) => p.z));
  return a.map((p) => ({
    ...p,
    nx: (p.x - (minX + maxX) / 2) / ((maxX - minX) / 2),
    nz: (p.z - (minZ + maxZ) / 2) / ((maxZ - minZ) / 2),
  }));
}
export function solveDecor(d, p) {
  const type = decorRecipe(d),
    W = d.width,
    H = d.height,
    D = d.depth,
    shapes = [];
  const box = (id, x, y, z, w, h, depth) =>
    shapes.push({ id, kind: "box", center: [x, y, z], size: [w, h, depth] });
  const cyl = (id, x, y, z, w, h, depth, taper = 1) =>
    shapes.push({
      id,
      kind: "cylinder",
      center: [x, y, z],
      size: [w, h, depth],
      taper,
    });
  const ellipsoid = (id, x, y, z, w, h, depth) =>
    shapes.push({
      id,
      kind: "ellipsoid",
      center: [x, y, z],
      size: [w, h, depth],
    });
  const post = (id, from, to, section) =>
    shapes.push({ id, kind: "post", from, to, section });
  const lathe = (id, w, h, depth, profile) =>
    shapes.push({ id, kind: "lathe", size: [w, h, depth], profile });
  const pair = (root, fn) =>
    sides.forEach((side, i) => fn(`${root}.${side}`, i === 0 ? -1 : 1));
  if (type === "chandelier") {
    const locations = distribution(),
      hubX = (-0.0954915028125263 / 0.9045084971874737) * W * 0.38,
      hubY = H * 0.45,
      t = p.mount.thickness,
      s = p.stem.diameter;
    cyl("mount", hubX, H - t / 2, 0, W * 0.24, t, D * 0.24);
    cyl("stem", hubX, (hubY + H - t / 2) / 2, 0, s, H - t / 2 - hubY, s);
    for (const q of locations) {
      const globe = `globes.${q.id}`,
        arm = `arms.${q.id}`,
        gh = p[globe].height,
        x = q.nx * W * 0.38,
        z = q.nz * D * 0.38;
      post(arm, [x, gh * 0.85, z], [hubX, hubY, 0], p[arm].section);
      ellipsoid(globe, x, gh / 2, z, W * 0.24, gh, D * 0.24);
    }
  } else if (type === "wall-light") {
    const t = p.mount.thickness,
      h = p.mount.height,
      s = p.arm.section,
      shade = p.shade.height,
      z = D * 0.15,
      y = H - shade * 0.75,
      rear = -D / 2 + t;
    box("mount", 0, h / 2, -D / 2 + t / 2, W * 0.35, h, t);
    box("arm", 0, y, (rear + z) / 2, s, s, z - rear);
    cyl("shade", 0, H - shade / 2, z, W, shade, D * 0.7, 0.6);
  } else if (framed(type)) {
    const border = p.frame.section,
      t = type === "wall-mirror" ? D : p.frame.thickness,
      bottom =
        type === "wall-mirror"
          ? 0
          : type === "standing-mirror"
            ? H * 0.12
            : H * 0.3,
      fh = H - bottom,
      rear =
        type === "a-board"
          ? -t / 2
          : type === "wall-mirror"
            ? -D / 2
            : D / 2 - t;
    box("frame", 0, H - border / 2, rear + t / 2, W, border, t);
    box("frame", 0, bottom + border / 2, rear + t / 2, W, border, t);
    for (const sign of [-1, 1])
      box(
        "frame",
        sign * (W / 2 - border / 2),
        (bottom + H) / 2,
        rear + t / 2,
        border,
        fh - 2 * border,
        t,
      );
    const st = p.surface.thickness;
    box(
      "surface",
      0,
      (bottom + H) / 2,
      rear + t - st / 2,
      W - 2 * border,
      fh - 2 * border,
      st,
    );
    if (type === "standing-mirror") {
      pair("supports", (id, sign) => {
        const s = p[id].section;
        post(
          id,
          [sign * (W / 2 - s / 2), 0, -D / 2 + s / 2],
          [sign * (W / 2 - s / 2), H * 0.82, rear + t / 2],
          s,
        );
      });
      const s = p.brace.section;
      box("brace", 0, s / 2, -D / 2 + s / 2, W, s, s);
    } else if (type === "whiteboard") {
      pair("feet", (id, sign) => {
        const h = p[id].height,
          postId = `posts.${id.split(".")[1]}`,
          s = p[postId].section,
          x = sign * W * 0.38;
        box(id, x, h / 2, 0, W * 0.12, h, D);
        box(
          postId,
          x,
          (h / 2 + bottom + border) / 2,
          rear + t / 2,
          s,
          bottom + border - h / 2,
          s,
        );
      });
    } else if (type === "a-board") {
      legs.forEach((slot, i) => {
        const id = `legs.${slot}`,
          s = p[id].section,
          x = (i % 2 === 0 ? -1 : 1) * W * 0.4;
        post(
          id,
          [x, 0, (i < 2 ? 1 : -1) * (D / 2 - s / 2)],
          [x, H - border / 2, 0],
          s,
        );
      });
    }
  } else if (type.endsWith("partition")) {
    const floor = Math.min(p["feet.left"].height, p["feet.right"].height) / 2;
    pair("feet", (id, sign) =>
      box(
        id,
        sign * W * 0.36,
        p[id].height / 2,
        0,
        p[id].width,
        p[id].height,
        D,
      ),
    );
    if (type === "slatted-partition") {
      const tie = p["base-rail"].height,
        base = floor + tie,
        gap = p.slats.gap,
        width = (W - gap * 8) / 9,
        depth = Math.max(
          ...slots(9).map((slot) => p[`slats.${slot}`].thickness),
        );
      box("base-rail", 0, floor + tie / 2, 0, W, tie, depth);
      slots(9).forEach((slot, i) =>
        box(
          `slats.${slot}`,
          -W / 2 + width / 2 + i * (width + gap),
          (base + H) / 2,
          0,
          width,
          H - base,
          p[`slats.${slot}`].thickness,
        ),
      );
    } else {
      const t = p.panel.thickness,
        returnWidth = type === "corner-partition" ? p.return.thickness : 0;
      box(
        "panel",
        returnWidth / 2,
        (floor + H) / 2,
        type === "corner-partition" ? -D / 2 + t / 2 : 0,
        W - returnWidth,
        H - floor,
        t,
      );
      if (type === "corner-partition") {
        const t = p.return.thickness;
        box("return", -W / 2 + t / 2, (floor + H) / 2, 0, t, H - floor, D);
      }
    }
  } else if (type.endsWith("planter")) {
    const pot = p.pot,
      hanging = type === "hanging-planter",
      top = pot.height - H * 0.01,
      ratio = innerRatio(top / pot.height),
      st = p.soil.thickness;
    lathe("pot", pot.width, pot.height, pot.depth, POT_PROFILE);
    cyl("soil", 0, top - st / 2, 0, pot.width * ratio, st, pot.depth * ratio);
    distribution().forEach((q, i) => {
      const leaf = `leaves.${q.id}`,
        stem = `stems.${q.id}`,
        height = p[leaf].height,
        leafTop = H * (hanging ? (i % 2 ? 0.78 : 0.64) : i % 2 ? 1 : 0.82),
        x = q.nx * W * 0.36,
        z = q.nz * D * 0.4,
        y = leafTop - height / 2;
      post(stem, [0, top, 0], [x, y, z], p[stem].section);
      ellipsoid(leaf, x, y, z, W * 0.28, height, D * 0.2);
    });
    if (hanging)
      slots(3).forEach((slot, i) => {
        const a = (i * Math.PI * 2) / 3,
          id = `suspension.${slot}`;
        post(
          id,
          [
            Math.cos(a) * pot.width * 0.46,
            pot.height * 0.95,
            Math.sin(a) * pot.depth * 0.46,
          ],
          [0, H, 0],
          p[id].section,
        );
      });
  } else if (type === "sculpture") {
    const bh = p.base.height,
      lower = p.lower.height,
      upper = p.upper.height,
      bottom = bh - H * 0.04;
    cyl("base", 0, bh / 2, 0, W, bh, D);
    ellipsoid("lower", 0, bottom + lower / 2, 0, W * 0.8, lower, D * 0.8);
    ellipsoid("upper", W * 0.08, H - upper / 2, 0, W * 0.62, upper, D * 0.62);
  } else if (type === "plinth") {
    if (d.shape === "round") cyl("body", 0, H / 2, 0, W, H, D);
    else box("body", 0, H / 2, 0, W, H, D);
  } else lathe("body", W, H, D, VASE_PROFILE);
  return shapes;
}
