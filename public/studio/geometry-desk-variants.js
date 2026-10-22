import { buildStandardDesk } from "./geometry-desks.js";
import { CORNER_LEGS, SLATS } from "./parts-desk-variants.js";

export function buildDeskVariant(d, p, writer, component) {
  const { box, cylinder, beam, tri } = writer;
  const w = d.width / 100,
    h = d.height / 100,
    z = d.depth / 100;
  const draw = (id, fn) =>
    component(id, () =>
      fn(
        p[id].color
          .slice(1)
          .match(/../g)
          .map((v) => parseInt(v, 16) / 255),
        ["oak", "walnut", "birch"].includes(p[id].material)
          ? 1
          : p[id].material === "metal"
            ? 2
            : 0,
      ),
    );
  if (d.id === "standing-desk") {
    const t = p.tabletop.thickness / 100;
    draw("tabletop", (c, m) =>
      d.shape === "round"
        ? cylinder(0, h - t / 2, 0, w / 2, z / 2, t, c, m)
        : box(0, h - t / 2, 0, w, t, z, c, m),
    );
    const maxWidth =
      Math.max(
        p["feet.left"].width,
        p["feet.right"].width,
        p["columns.left"].section,
        p["columns.right"].section,
      ) / 100;
    const x = Math.min(w * 0.36, w / 2 - maxWidth / 2);
    for (const [side, sign] of [
      ["left", -1],
      ["right", 1],
    ]) {
      const foot = p[`feet.${side}`],
        col = p[`columns.${side}`],
        bottom = (foot.thickness / 100) * 0.75;
      draw(`feet.${side}`, (c, m) =>
        box(
          sign * x,
          foot.thickness / 200,
          0,
          foot.width / 100,
          foot.thickness / 100,
          foot.depth / 100,
          c,
          m,
        ),
      );
      draw(`columns.${side}`, (c, m) =>
        box(
          sign * x,
          (bottom + h - t) / 2,
          0,
          col.section / 100,
          h - t - bottom,
          col.section / 100,
          c,
          m,
        ),
      );
    }
    const s = p["rear-brace"].section / 100;
    draw("rear-brace", (c, m) => box(0, h - t - s / 2, 0, x * 2, s, s, c, m));
  } else if (d.id === "corner-desk") {
    const t = p.tabletop.thickness / 100,
      a = p.tabletop.width / 100,
      b = p.tabletop.depth / 100;
    // One attachment line: main right edge equals return left edge.
    draw("tabletop.main-top", (c, m) =>
      box(-w / 2 + a / 2, h - t / 2, 0, a, t, z, c, m, 0),
    );
    draw("tabletop.return-top", (c, m) =>
      box(a / 2, h - t / 2, -z / 2 + b / 2, w - a, t, b, c, m, 0),
    );
    const s =
      Math.max(...CORNER_LEGS.map((id) => p[`legs.${id}`].section)) / 100;
    const margin = s / 2 + Math.min(w, z) * 0.025;
    const points = [
      [-w / 2 + margin, -z / 2 + margin],
      [-w / 2 + margin, z / 2 - margin],
      [-w / 2 + a - margin, z / 2 - margin],
      [w / 2 - margin, -z / 2 + margin],
      [w / 2 - margin, -z / 2 + b - margin],
    ];
    CORNER_LEGS.forEach((id, i) =>
      draw(`legs.${id}`, (c, m) =>
        box(
          points[i][0],
          (h - t) / 2,
          points[i][1],
          p[`legs.${id}`].section / 100,
          h - t,
          p[`legs.${id}`].section / 100,
          c,
          m,
        ),
      ),
    );
  } else if (d.id === "patio-table") {
    const t = p.tabletop.thickness / 100,
      gap = p.tabletop.gap / 100,
      sw = (w - 6 * gap) / 7;
    buildStandardDesk(d, p, writer, component, () => {
      SLATS.forEach((id, i) =>
        draw(`tabletop.${id}`, (c, m) => {
          const left = -w / 2 + i * (sw + gap),
            right = left + sw;
          if (d.shape !== "round") {
            box((left + right) / 2, h - t / 2, 0, sw, t, z, c, m, 0);
            return;
          }
          // Clip a convex oval to each fixed slat strip; preserve IDs across shapes.
          let polygon = Array.from({ length: 64 }, (_, j) => {
            const a = (j * Math.PI) / 32;
            return [(Math.cos(a) * w) / 2, (Math.sin(a) * z) / 2];
          });
          for (const [edge, sign] of [
            [left, 1],
            [right, -1],
          ]) {
            const out = [];
            for (let j = 0; j < polygon.length; j++) {
              const a = polygon[j],
                b = polygon[(j + 1) % polygon.length],
                insideA = (a[0] - edge) * sign >= 0,
                insideB = (b[0] - edge) * sign >= 0;
              if (insideA) out.push(a);
              if (insideA !== insideB) {
                const f = (edge - a[0]) / (b[0] - a[0]);
                out.push([edge, a[1] + f * (b[1] - a[1])]);
              }
            }
            polygon = out;
          }
          const center = [
            polygon.reduce((s, v) => s + v[0], 0) / polygon.length,
            polygon.reduce((s, v) => s + v[1], 0) / polygon.length,
          ];
          for (let j = 0; j < polygon.length; j++) {
            const a = polygon[j],
              b = polygon[(j + 1) % polygon.length],
              A = [a[0], h, a[1]],
              B = [b[0], h, b[1]],
              C = [b[0], h - t, b[1]],
              D = [a[0], h - t, a[1]];
            tri([center[0], h, center[1]], B, A, [0, 1, 0], c, m);
            tri([center[0], h - t, center[1]], D, C, [0, -1, 0], c, m);
            tri(A, B, C, null, c, m);
            tri(A, C, D, null, c, m);
          }
        }),
      );
    });
  } else if (d.id === "laptop-stand") {
    const t = p.platform.thickness / 100,
      l = p.lip.height / 100,
      b = p.base.thickness / 100,
      y = h - l - t;
    draw("platform", (c, m) => box(0, y + t / 2, 0, w, t, z, c, m));
    draw("base", (c, m) =>
      box(0, b / 2, 0, p.base.width / 100, b, p.base.depth / 100, c, m),
    );
    draw("support", (c, m) => {
      const half = p.support.section / 200;
      // Horizontal end faces attach flush, even with a thin base and wide support.
      const points = [
        [b * 0.75, (-p.base.depth / 100) * 0.2],
        [y + t * 0.25, z * 0.1],
      ].flatMap(([yy, zz]) => [
        [-half, yy, zz - half],
        [half, yy, zz - half],
        [half, yy, zz + half],
        [-half, yy, zz + half],
      ]);
      for (const face of [
        [0, 1, 2, 3],
        [4, 7, 6, 5],
        [0, 4, 5, 1],
        [1, 5, 6, 2],
        [2, 6, 7, 3],
        [3, 7, 4, 0],
      ]) {
        const [a, b, c1, e] = face.map((i) => points[i]);
        tri(a, b, c1, null, c, m);
        tri(a, c1, e, null, c, m);
      }
    });
    const depth = Math.min(0.02, z * 0.12);
    draw("lip", (c, m) =>
      box(0, h - l / 2, z / 2 - depth / 2, w * 0.9, l, depth, c, m, 0),
    );
  }
}
