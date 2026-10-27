// Trusted construction recipes. Dimensions and attachment coordinates are cm.
const cm = (n) => Math.round(n * 100) / 100;
// Imported metadata cannot change an object's construction or fixed front count.
const recipes = Object.freeze({
  bookshelf: ["shelf", "", 0],
  "wall-shelving": ["shelf", "", 0],
  "display-rack": ["rack", "", 0],
  "shoe-rack": ["rack", "", 0],
  "display-cabinet": ["cabinet", "open", 0],
  "tv-unit": ["cabinet", "media", 3],
  wardrobe: ["cabinet", "", 3],
  "bedside-table": ["cabinet", "drawers", 2],
  "filing-cabinet": ["cabinet", "drawers", 4],
  "drawer-unit": ["cabinet", "drawers", 3],
  "storage-locker": ["cabinet", "locker", 2],
  "wall-shelf": ["wall-shelf", "", 0],
  "bed-frame": ["bed", "", 0],
  "dressing-table": ["vanity", "", 0],
  "kitchen-island": ["counter", "", 3],
});
function trusted(d) {
  if (!Object.hasOwn(recipes, d.id))
    throw Error("Unknown storage/bedroom object.");
  const [kind, variant, panels] = recipes[d.id];
  return { ...d, kind, variant, panels };
}
export const NEXT_OBJECTS = Object.freeze([
  "bookshelf",
  "wall-shelving",
  "display-rack",
  "shoe-rack",
  "display-cabinet",
  "tv-unit",
  "wardrobe",
  "bedside-table",
  "filing-cabinet",
  "drawer-unit",
  "storage-locker",
  "wall-shelf",
  "bed-frame",
  "dressing-table",
  "kitchen-island",
]);
export const shelfCount = (d) =>
  Math.max(2, Math.min(6, Math.round(d.shelves || 4)));
export const slotIds = (n) =>
  Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, "0"));
const shelving = (d) =>
  ["shelf", "rack"].includes(d.kind) || d.variant === "open";
const internalCount = (d) =>
  d.variant === "open" ? shelfCount(d) - 1 : shelfCount(d);
const legIds = ["front-left", "front-right", "rear-left", "rear-right"];
const fields = (label, keys, extra = {}) => ({ label, fields: keys, ...extra });
const group = (label, keys) => fields(label, keys, { group: true });
function members(parent, ids, keys, name) {
  return Object.fromEntries(
    ids.map((id) => [
      `${parent}.${id}`,
      fields(`${name} ${id.replaceAll("-", " ")}`, keys, { parent }),
    ]),
  );
}
export function storageDefinitions(d) {
  d = trusted(d);
  if (shelving(d)) {
    const open = d.variant === "open",
      rack = d.kind === "rack",
      ids = slotIds(internalCount(d));
    return {
      ...(rack
        ? {
            posts: group("All four posts", ["section"]),
            ...members("posts", legIds, ["section"], "Post"),
          }
        : {
            sides: group("Both side panels", ["thickness"]),
            ...members("sides", ["left", "right"], ["thickness"], "Side"),
            back: fields("Back panel", ["thickness"]),
          }),
      ...(open
        ? {
            plinth: fields("Plinth", ["height"]),
            bottom: fields("Bottom panel", ["thickness"]),
            top: fields("Top panel", ["thickness"]),
          }
        : {}),
      shelves: group(open ? "All internal shelves" : "All shelf boards", [
        "thickness",
      ]),
      ...Object.fromEntries(
        ids.map((id, i) => [
          `shelves.${id}`,
          fields(
            `Shelf ${id} (bottom to top)`,
            open || (i > 0 && i < ids.length - 1)
              ? ["thickness", "height"]
              : ["thickness"],
            {
              parent: "shelves",
              fieldLabels: { height: "Center height from floor" },
            },
          ),
        ]),
      ),
    };
  }
  if (d.kind === "cabinet") {
    const ids = slotIds(d.panels || 2);
    return {
      plinth: fields("Plinth", ["height"]),
      sides: group("Both side panels", ["thickness"]),
      ...members("sides", ["left", "right"], ["thickness"], "Side"),
      top: fields("Top panel", ["thickness"]),
      bottom: fields("Bottom panel", ["thickness"]),
      back: fields("Back panel", ["thickness"]),
      fronts: group(
        d.variant === "drawers" ? "All drawer fronts" : "All door fronts",
        ["thickness", "gap"],
      ),
      ...members(
        "fronts",
        ids,
        ["thickness"],
        d.variant === "drawers" ? "Drawer front" : "Door front",
      ),
      handles: group("All handles", ["section"]),
      ...members("handles", ids, ["section"], "Handle"),
      ...(d.variant === "locker"
        ? {
            vents: group("Decorative vent strips", []),
            ...members(
              "vents",
              ids.flatMap((id) => [1, 2, 3].map((n) => `${id}-${n}`)),
              [],
              "Vent",
            ),
          }
        : {}),
    };
  }
  if (d.kind === "wall-shelf")
    return {
      board: fields("Shelf board", ["thickness"]),
      mounts: group("Both wall mounts", ["section"]),
      ...members("mounts", ["left", "right"], ["section"], "Wall mount"),
      brackets: group("Both diagonal brackets", ["section"]),
      ...members("brackets", ["left", "right"], ["section"], "Bracket"),
    };
  if (d.kind === "bed")
    return {
      frame: fields("Platform frame", ["height", "thickness"], {
        fieldLabels: { height: "Platform top height" },
      }),
      headboard: fields("Headboard", ["thickness"]),
      mattress: fields("Mattress", ["thickness"]),
      pillows: group("Both pillows", ["thickness"]),
      ...members("pillows", ["left", "right"], ["thickness"], "Pillow"),
      legs: group("All four legs", ["section"]),
      ...members("legs", legIds, ["section"], "Leg"),
    };
  if (d.kind === "vanity")
    return {
      worktop: fields("Worktop", ["height", "thickness"], {
        fieldLabels: { height: "Worktop top height" },
      }),
      "mirror-frame": fields("Mirror frame", ["section", "thickness"]),
      mirror: fields("Mirror surface", []),
      "mirror-support": fields("Mirror support", ["section"]),
      "drawer-block": fields("Decorative drawer block", ["height"]),
      legs: group("All four legs", ["section"]),
      ...members("legs", legIds, ["section"], "Leg"),
    };
  return {
    body: fields("Counter body", []),
    top: fields("Countertop", ["thickness"]),
    plinth: fields("Plinth", ["height"]),
    fronts: group("All three front panels", ["thickness", "gap"]),
    ...members("fronts", slotIds(3), ["thickness"], "Front panel"),
  };
}
export function storageLimits(d, id, key) {
  d = trusted(d);
  const W = d.width,
    H = d.height,
    D = d.depth,
    M = Math.min(W, D),
    root = id.split(".")[0];
  if (shelving(d)) {
    if (root === "posts") return [0.1, M * 0.12];
    if (root === "sides") return [0.1, M * 0.08];
    if (root === "back") return [0.1, D * 0.12];
    if (root === "plinth") return [H * 0.05, H * 0.16];
    if (root === "top" || root === "bottom")
      return [0.1, Math.min(H * 0.04, D * 0.15)];
    if (key === "thickness")
      return [
        0.1,
        Math.min((H / (shelfCount(d) + 1)) * 0.12, D * 0.15, W * 0.08),
      ];
    const i = Number(id.split(".")[1]) - 1,
      n = shelfCount(d);
    // Fixed, disjoint bands leave clearance even at combined maximum thickness.
    const center =
      d.variant === "open"
        ? H * (0.24 + (0.66 * (i + 1)) / n)
        : (H * i) / (n - 1);
    const delta = (H * 0.16) / (n + 1);
    return [center - delta, center + delta];
  }
  if (d.kind === "cabinet") {
    if (root === "plinth") return [H * 0.05, H * 0.16];
    if (root === "sides") return [0.1, Math.min(W * 0.08, D * 0.12)];
    if (root === "top" || root === "bottom")
      return [0.1, Math.min(H * 0.06, D * 0.12)];
    if (root === "back" || (root === "fronts" && key === "thickness"))
      return [0.1, D * 0.08];
    if (key === "gap") return [0, (Math.min(W, H) / (d.panels || 2)) * 0.04];
    if (root === "handles")
      return [
        0.05,
        Math.min(W / (d.panels || 2), H / (d.panels || 2), D) * 0.05,
      ];
  }
  if (d.kind === "wall-shelf")
    return key === "thickness"
      ? [H * 0.05, H * 0.2]
      : [0.1, Math.min(W * 0.08, D * 0.08, H * 0.08)];
  if (d.kind === "bed") {
    if (root === "frame")
      return key === "height" ? [H * 0.3, H * 0.46] : [H * 0.1, H * 0.2];
    if (root === "headboard") return [0.1, D * 0.08];
    if (root === "mattress") return [H * 0.08, H * 0.22];
    if (root === "pillows") return [H * 0.02, H * 0.12];
    return [0.1, Math.min(W, D) * 0.08];
  }
  if (d.kind === "vanity") {
    if (root === "worktop")
      return key === "height" ? [H * 0.4, H * 0.54] : [0.1, H * 0.05];
    if (root === "mirror-frame")
      return key === "section"
        ? [0.1, Math.min(W * 0.06, H * 0.04)]
        : [0.1, D * 0.08];
    if (root === "drawer-block") return [H * 0.06, H * 0.2];
    return [0.1, Math.min(W, D) * 0.08];
  }
  if (root === "top") return [0.1, H * 0.12];
  if (root === "plinth") return [H * 0.04, H * 0.14];
  if (key === "gap") return [0, W * 0.015];
  return [0.1, D * 0.08];
}
function defaultValue(d, id, key) {
  d = trusted(d);
  const root = id.split(".")[0],
    H = d.height,
    D = d.depth;
  if (shelving(d) && key === "height" && root === "shelves") {
    const i = Number(id.split(".")[1]) - 1;
    return d.variant === "open"
      ? H * (0.24 + (0.66 * (i + 1)) / shelfCount(d))
      : (H * i) / (shelfCount(d) - 1);
  }
  if (key === "height")
    return (
      H *
      (root === "plinth"
        ? 0.1
        : root === "drawer-block"
          ? 0.12
          : d.kind === "bed"
            ? 0.37
            : 0.48)
    );
  if (key === "gap") return Math.min(d.width, H) * 0.008;
  if (key === "section") return root === "handles" ? 1.2 : 3.4;
  if (root === "headboard") return D * 0.06;
  if (root === "mattress") return H * 0.18;
  if (root === "pillows") return H * 0.09;
  if (root === "frame") return H * 0.16;
  if (root === "board") return H * 0.12;
  return root === "back" ? 1.6 : 2.7;
}
export function storageDefaults(d) {
  d = trusted(d);
  const defs = storageDefinitions(d),
    out = {};
  for (const [id, def] of Object.entries(defs)) {
    const accent =
      /^(back|posts|plinth|handles|vents|legs|mounts|brackets|mattress|pillows|mirror)/.test(
        id,
      ) ||
      (d.kind === "counter" && id === "top");
    const values = {
      color: accent ? d.accent : d.color,
      material: accent ? "matte" : d.material,
    };
    for (const key of def.fields) {
      const [min, max] = storageLimits(d, id, key).map(cm);
      values[key] = cm(Math.max(min, Math.min(max, defaultValue(d, id, key))));
    }
    if (id === "mirror")
      Object.assign(values, { color: "#a8bab8", material: "metal" });
    if (def.parent) {
      for (const key of [...def.fields, "color", "material"])
        if (Object.hasOwn(d.parts?.[def.parent] || {}, key))
          values[key] = d.parts[def.parent][key];
    }
    out[id] = values;
  }
  return out;
}
export const storageBedroomProfile = {
  id: "storage-bedroom",
  builder: "storage-bedroom",
  revision: 1,
  legacyUnversioned: true,
  parts: storageDefinitions,
  defaults: storageDefaults,
  limits: storageLimits,
  description:
    "Select a component to edit dimensions and finish. Attached parts follow their anchors.",
  hint: "Use Whole object for overall size. Group settings can be applied to members; Reset restores inherited settings.",
  readout(d, p, id) {
    d = trusted(d);
    if (shelving(d))
      return d.variant === "open"
        ? "Count means open bays: fixed bottom/top plus count minus one internal shelves. Center heights stay in separate safe bands."
        : "Count includes the first and last boards, anchored at floor/top. Internal shelf center heights stay in separate safe bands.";
    if (d.kind === "wall-shelf")
      return "Mounts follow the wall edge; diagonal bracket endpoints follow the shelf underside.";
    if (d.kind === "vanity")
      return "Mirror support connects the worktop to the frame. Drawer block is decorative and stays closed.";
    if (d.kind === "cabinet")
      return "Door and drawer fronts stay closed. Handles follow each front; fronts remain attached to the carcass.";
    return "Attached parts follow resolved component dimensions. Overall dimensions remain the outer envelope.";
  },
};

// Box recipes share the same resolved measurements as the controls. Geometry
// never rescales the final assembly. Slanted brackets use a separate post recipe.
export function solveStorageBedroom(d, p) {
  d = trusted(d);
  const W = d.width,
    H = d.height,
    D = d.depth,
    boxes = [],
    posts = [];
  const box = (id, x, y, z, w, h, depth) =>
    boxes.push({ id, center: [x, y, z], size: [w, h, depth] });
  const pair = (root, fn) =>
    ["left", "right"].forEach((side, i) =>
      fn(`${root}.${side}`, i === 0 ? -1 : 1),
    );
  const legs = (top, root = "legs") =>
    legIds.forEach((id, i) => {
      const s = p[`${root}.${id}`].section;
      box(
        `${root}.${id}`,
        (i % 2 === 0 ? -1 : 1) * (W * 0.4 - s / 2),
        top / 2,
        (i < 2 ? 1 : -1) * (D * 0.38 - s / 2),
        s,
        top,
        s,
      );
    });
  if (shelving(d)) {
    const open = d.variant === "open",
      rack = d.kind === "rack";
    let left = -W / 2,
      right = W / 2,
      rear = -D / 2;
    if (rack)
      legIds.forEach((id, i) => {
        const s = p[`posts.${id}`].section;
        box(
          `posts.${id}`,
          (i % 2 === 0 ? -1 : 1) * (W / 2 - s / 2),
          H / 2,
          (i < 2 ? 1 : -1) * (D / 2 - s / 2),
          s,
          H,
          s,
        );
      });
    else {
      const l = p["sides.left"].thickness,
        r = p["sides.right"].thickness,
        b = p.back.thickness;
      pair("sides", (id, sign) => {
        const t = p[id].thickness;
        box(id, sign * (W / 2 - t / 2), H / 2, 0, t, H, D);
      });
      box("back", 0, H / 2, -D / 2 + b / 2, W, H, b);
      left += l;
      right -= r;
      rear += b;
    }
    if (open) {
      const base = p.plinth.height,
        b = p.bottom.thickness,
        t = p.top.thickness;
      box("plinth", 0, base / 2, 0, W * 0.94, base, D * 0.94);
      box(
        "bottom",
        (left + right) / 2,
        base + b / 2,
        (rear + D / 2) / 2,
        right - left,
        b,
        D / 2 - rear,
      );
      box(
        "top",
        (left + right) / 2,
        H - t / 2,
        (rear + D / 2) / 2,
        right - left,
        t,
        D / 2 - rear,
      );
    }
    const ids = slotIds(internalCount(d));
    ids.forEach((slot, i) => {
      const id = `shelves.${slot}`,
        t = p[id].thickness;
      const y =
        open || (i > 0 && i < ids.length - 1)
          ? p[id].height
          : i === 0
            ? t / 2
            : H - t / 2;
      box(
        id,
        (left + right) / 2,
        y,
        (rear + D / 2) / 2,
        right - left,
        t,
        D / 2 - rear,
      );
    });
  } else if (d.kind === "cabinet") {
    const count = d.panels || 2,
      ids = slotIds(count),
      base = p.plinth.height;
    const l = p["sides.left"].thickness,
      r = p["sides.right"].thickness,
      b = p.back.thickness,
      top = p.top.thickness,
      bottom = p.bottom.thickness;
    const maxFront = Math.max(...ids.map((id) => p[`fronts.${id}`].thickness)),
      anchor = D / 2 - D * 0.08 - maxFront;
    const left = -W / 2 + l,
      right = W / 2 - r,
      lo = base + bottom,
      hi = H - top;
    box("plinth", 0, base / 2, 0, W * 0.94, base, D * 0.9);
    pair("sides", (id, sign) => {
      const t = p[id].thickness;
      box(
        id,
        sign * (W / 2 - t / 2),
        (base + H) / 2,
        (anchor - D / 2) / 2,
        t,
        H - base,
        anchor + D / 2,
      );
    });
    box("top", 0, H - top / 2, (anchor - D / 2) / 2, W, top, anchor + D / 2);
    box(
      "bottom",
      0,
      base + bottom / 2,
      (anchor - D / 2) / 2,
      W,
      bottom,
      anchor + D / 2,
    );
    box("back", 0, (base + H) / 2, -D / 2 + b / 2, W, H - base, b);
    ids.forEach((slot, i) => {
      const id = `fronts.${slot}`,
        t = p[id].thickness,
        gap = p.fronts.gap,
        drawer = d.variant === "drawers";
      const fw = drawer ? right - left + (l + r) / 2 : (right - left) / count,
        fh = drawer ? (hi - lo) / count : hi - lo + (top + bottom) / 2;
      const x = drawer ? (left + right) / 4 : left + fw * (i + 0.5),
        y = drawer ? lo + fh * (i + 0.5) : (hi + lo + (top - bottom) / 2) / 2;
      // Drawer overlays reach the side frame; door overlays reach top/bottom.
      // Their rear planes meet the carcass front anchor at every allowed gap.
      box(
        id,
        x,
        y,
        anchor + t / 2,
        drawer ? fw : fw - gap,
        drawer ? fh - gap : fh,
        t,
      );
      const handle = `handles.${slot}`,
        s = p[handle].section,
        hx = drawer ? x : x + fw * 0.3;
      box(
        handle,
        hx,
        y,
        (anchor + t + D / 2) / 2,
        drawer ? fw * 0.25 : s,
        drawer ? s : fh * 0.1,
        D / 2 - anchor - t,
      );
      if (d.variant === "locker")
        [1, 2, 3].forEach((n) => {
          const depth = Math.min(0.3, D * 0.01);
          box(
            `vents.${slot}-${n}`,
            x,
            lo + fh * (0.85 - n * 0.035),
            anchor + t + depth / 2,
            fw * 0.4,
            fh * 0.012,
            depth,
          );
        });
    });
  } else if (d.kind === "wall-shelf") {
    const t = p.board.thickness,
      under = H - t;
    box("board", 0, H - t / 2, 0, W, t, D);
    pair("mounts", (id, sign) => {
      const s = p[id].section;
      box(id, sign * W * 0.34, under / 2, -D / 2 + s / 2, s, under, s);
    });
    pair("brackets", (id, sign) => {
      const s = p[id].section;
      posts.push({
        id,
        from: [sign * W * 0.34, s / 2, -D / 2 + s / 2],
        to: [sign * W * 0.34, under, D * 0.38],
        section: s,
      });
    });
  } else if (d.kind === "bed") {
    const top = p.frame.height,
      t = p.frame.thickness,
      back = p.headboard.thickness,
      mt = p.mattress.thickness;
    box("headboard", 0, H / 2, -D / 2 + back / 2, W, H, back);
    const rear = -D / 2 + back,
      depth = D / 2 - rear;
    box("frame", 0, top - t / 2, (rear + D / 2) / 2, W, t, depth);
    box(
      "mattress",
      0,
      top + mt / 2,
      (rear + D / 2) / 2,
      W * 0.94,
      mt,
      depth * 0.94,
    );
    pair("pillows", (id, sign) => {
      const pt = p[id].thickness;
      box(
        id,
        sign * W * 0.235,
        top + mt + pt / 2,
        rear + depth * 0.17,
        W * 0.4,
        pt,
        depth * 0.22,
      );
    });
    legs(top - t);
  } else if (d.kind === "vanity") {
    const top = p.worktop.height,
      t = p.worktop.thickness,
      s = p["mirror-frame"].section,
      mt = p["mirror-frame"].thickness;
    const rear = -D / 2,
      frameBottom = H * 0.56,
      frameW = W * 0.65;
    box("worktop", 0, top - t / 2, 0, W, t, D);
    box(
      "mirror-frame",
      0,
      (frameBottom + H) / 2,
      rear + mt / 2,
      frameW,
      H - frameBottom,
      mt,
    );
    const mirrorT = Math.min(mt * 0.3, D * 0.02);
    box(
      "mirror",
      0,
      (frameBottom + H) / 2,
      rear + mt,
      frameW - 2 * s,
      H - frameBottom - 2 * s,
      mirrorT,
    );
    const support = p["mirror-support"].section;
    box(
      "mirror-support",
      0,
      (top + frameBottom + s) / 2,
      rear + mt / 2,
      support,
      frameBottom + s - top,
      Math.min(support, mt),
    );
    const dh = p["drawer-block"].height;
    box(
      "drawer-block",
      -W * 0.29,
      top - t - dh / 2,
      D * 0.04,
      W * 0.35,
      dh,
      D * 0.8,
    );
    legs(top - t);
  } else {
    const top = p.top.thickness,
      base = p.plinth.height;
    const maxT = Math.max(
      ...slotIds(3).map((slot) => p[`fronts.${slot}`].thickness),
    );
    const front = D / 2 - maxT,
      rear = -D / 2 + D * 0.06;
    box("top", 0, H - top / 2, 0, W, top, D);
    box("plinth", 0, base / 2, 0, W * 0.92, base, D * 0.9);
    box(
      "body",
      0,
      (base + H - top) / 2,
      (rear + front) / 2,
      W * 0.94,
      H - top - base,
      front - rear,
    );
    slotIds(3).forEach((slot, i) => {
      const id = `fronts.${slot}`,
        t = p[id].thickness;
      box(
        id,
        (i - 1) * W * 0.31,
        (base + H - top) / 2,
        front + t / 2,
        W * 0.3 - p.fronts.gap,
        H - top - base,
        t,
      );
    });
  }
  return { boxes, posts };
}
