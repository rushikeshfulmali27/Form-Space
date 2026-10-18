// Parametric catalog geometry. Coordinates are in meters, controls in centimeters.
import {
  supportsParts,
  resolveParts,
  partDefinitions,
  getPartsProfile,
} from "./parts.js";
export function buildModel(d, low = false) {
  return buildAssemblyModel(d, low).data;
}
export function buildAssemblyModel(d, low = false) {
  const w = d.width / 100,
    h = d.height / 100,
    z = d.depth / 100;
  const vertices = [];
  const parts = [];
  function component(id, fn) {
    const firstVertex = vertices.length / 10;
    fn();
    parts.push({
      id,
      label: partDefinitions(d)[id].label,
      firstVertex,
      vertexCount: vertices.length / 10 - firstVertex,
    });
  }
  const wood = ["oak", "walnut", "birch"].includes(d.material)
    ? 1
    : d.material === "metal"
      ? 2
      : 0;
  const rgb = (hex) =>
    hex
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255);
  const primary = rgb(d.color),
    accent = rgb(d.accent);
  function tri(a, b, c, ns, color, mat) {
    if (
      Math.hypot(
        ...cross(
          b.map((v, i) => v - a[i]),
          c.map((v, i) => v - a[i]),
        ),
      ) < 1e-10
    )
      return;
    const n = ns || normal(a, b, c);
    for (const [i, p] of [a, b, c].entries())
      vertices.push(...p, ...(Array.isArray(n[0]) ? n[i] : n), ...color, mat);
  }
  function box(cx, cy, cz, sx, sy, sz, color = primary, mat = wood, r = 0.009) {
    r = Math.min(r, sx / 2, sy / 2, sz / 2);
    const halves = [sx / 2, sy / 2, sz / 2],
      center = [cx, cy, cz];
    const point = (axis, sign, u, v) => {
      const axes = [0, 1, 2].filter((a) => a !== axis);
      const p = [0, 0, 0];
      p[axis] = sign * halves[axis];
      p[axes[0]] = u * halves[axes[0]];
      p[axes[1]] = v * halves[axes[1]];
      const inner = p.map((x, i) =>
        Math.max(-halves[i] + r, Math.min(halves[i] - r, x)),
      );
      const delta = p.map((x, i) => x - inner[i]);
      const len = Math.hypot(...delta) || 1;
      const n = delta.map((x) => x / len);
      return { p: inner.map((x, i) => center[i] + x + n[i] * r), n };
    };
    for (let axis = 0; axis < 3; axis++) {
      const axes = [0, 1, 2].filter((a) => a !== axis);
      const samples = (k) =>
        [...new Set([-1, -1 + r / halves[k], 0, 1 - r / halves[k], 1])].sort(
          (a, b) => a - b,
        );
      const us = samples(axes[0]),
        vs = samples(axes[1]);
      for (const sign of [-1, 1])
        for (let i = 0; i < us.length - 1; i++)
          for (let j = 0; j < vs.length - 1; j++) {
            const a = point(axis, sign, us[i], vs[j]),
              b = point(axis, sign, us[i + 1], vs[j]),
              c = point(axis, sign, us[i + 1], vs[j + 1]),
              e = point(axis, sign, us[i], vs[j + 1]);
            const flip = (axis === 1 ? -sign : sign) < 0;
            const q = flip ? [a, c, b, a, e, c] : [a, b, c, a, c, e];
            tri(
              q[0].p,
              q[1].p,
              q[2].p,
              q.slice(0, 3).map((t) => t.n),
              color,
              mat,
            );
            tri(
              q[3].p,
              q[4].p,
              q[5].p,
              q.slice(3).map((t) => t.n),
              color,
              mat,
            );
          }
    }
  }
  function cylinder(
    cx,
    cy,
    cz,
    rx,
    rz,
    height,
    color = primary,
    mat = wood,
    topScale = 1,
  ) {
    const count = low ? 20 : 64;
    const y0 = cy - height / 2,
      y1 = cy + height / 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2,
        b = ((i + 1) / count) * Math.PI * 2;
      const p = [cx + Math.cos(a) * rx, y0, cz + Math.sin(a) * rz],
        q = [cx + Math.cos(b) * rx, y0, cz + Math.sin(b) * rz];
      const t = [
          cx + Math.cos(a) * rx * topScale,
          y1,
          cz + Math.sin(a) * rz * topScale,
        ],
        s = [
          cx + Math.cos(b) * rx * topScale,
          y1,
          cz + Math.sin(b) * rz * topScale,
        ];
      const slope = ((1 - topScale) * (rx + rz)) / 2 / height;
      const norm = (v) => {
        const n = [
          Math.cos(v) / rx,
          slope / Math.min(rx, rz),
          Math.sin(v) / rz,
        ];
        const l = Math.hypot(...n);
        return n.map((x) => x / l);
      };
      tri(p, t, s, [norm(a), norm(a), norm(b)], color, mat);
      tri(p, s, q, [norm(a), norm(b), norm(b)], color, mat);
      tri([cx, y1, cz], s, t, [0, 1, 0], color, mat);
      tri([cx, y0, cz], p, q, [0, -1, 0], color, mat);
    }
  }
  function beam(a, b, width, color = accent, mat = 0) {
    const delta = b.map((v, i) => v - a[i]),
      len = Math.hypot(...delta);
    const y = delta.map((x) => x / len);
    const ref = Math.abs(y[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    const x = unit(cross(ref, y)),
      zz = cross(x, y);
    const at = (side, ix, iz) =>
      a.map(
        (v, i) =>
          v +
          delta[i] * side +
          (x[i] * ix * width) / 2 +
          (zz[i] * iz * width) / 2,
      );
    const v = [
      at(0, -1, -1),
      at(0, 1, -1),
      at(0, 1, 1),
      at(0, -1, 1),
      at(1, -1, -1),
      at(1, 1, -1),
      at(1, 1, 1),
      at(1, -1, 1),
    ];
    for (const f of [
      [0, 1, 2, 3],
      [4, 7, 6, 5],
      [0, 4, 5, 1],
      [1, 5, 6, 2],
      [2, 6, 7, 3],
      [3, 7, 4, 0],
    ]) {
      tri(v[f[0]], v[f[1]], v[f[2]], null, color, mat);
      tri(v[f[0]], v[f[2]], v[f[3]], null, color, mat);
    }
  }
  function ellipsoid(cx, cy, cz, rx, ry, rz, color = primary, mat = wood) {
    const rings = low ? 8 : 14,
      segments = low ? 16 : 32;
    const at = (i, j) => {
      const a = (Math.PI * i) / rings,
        b = (Math.PI * 2 * j) / segments;
      const p = [
        Math.sin(a) * Math.cos(b),
        Math.cos(a),
        Math.sin(a) * Math.sin(b),
      ];
      return {
        p: [cx + p[0] * rx, cy + p[1] * ry, cz + p[2] * rz],
        n: unit([p[0] / rx, p[1] / ry, p[2] / rz]),
      };
    };
    for (let i = 0; i < rings; i++)
      for (let j = 0; j < segments; j++) {
        const a = at(i, j),
          b = at(i + 1, j),
          c = at(i + 1, j + 1),
          e = at(i, j + 1);
        tri(a.p, b.p, c.p, [a.n, b.n, c.n], color, mat);
        tri(a.p, c.p, e.p, [a.n, c.n, e.n], color, mat);
      }
  }
  function lathe(profile, color = primary, mat = wood) {
    const count = low ? 24 : 64;
    for (let i = 0; i < profile.length - 1; i++)
      for (let j = 0; j < count; j++) {
        const a = (j / count) * Math.PI * 2,
          b = ((j + 1) / count) * Math.PI * 2;
        const p = profile[i],
          q = profile[i + 1];
        const pt = (t, r) => [
          Math.cos(t) * w * r[1],
          h * r[0],
          Math.sin(t) * z * r[1],
        ];
        const A = pt(a, p),
          B = pt(a, q),
          C = pt(b, q),
          D = pt(b, p);
        tri(A, B, C, null, color, mat);
        tri(A, C, D, null, color, mat);
      }
  }
  function legs(top, spread = 0.42, bottom = 0.015, size = 0.035) {
    for (const x of [-1, 1])
      for (const zz of [-1, 1])
        beam(
          [x * w * spread, bottom, zz * z * spread],
          [x * w * spread, top, zz * z * spread],
          size,
        );
  }
  function foliage(cx, base, cz, scale) {
    const green = accent;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5,
        dx = Math.cos(angle) * scale * 0.32,
        dz = Math.sin(angle) * scale * 0.32;
      beam(
        [cx, base, cz],
        [cx + dx, base + scale * (0.65 + (i % 2) * 0.2), cz + dz],
        0.008,
        green,
        0,
      );
      ellipsoid(
        cx + dx,
        base + scale * (0.6 + (i % 2) * 0.2),
        cz + dz,
        scale * 0.16,
        scale * 0.26,
        scale * 0.07,
        green,
        0,
      );
    }
  }
  const thick = Math.min(0.045, h * 0.08);
  if (getPartsProfile(d)?.builder === "pedestal-table") {
    const p = resolveParts(d),
      t = p.tabletop.thickness / 100;
    const material = (id) =>
      ["oak", "walnut", "birch"].includes(p[id].material)
        ? 1
        : p[id].material === "metal"
          ? 2
          : 0;
    component("tabletop", () => {
      if (d.shape === "round")
        cylinder(
          0,
          h - t / 2,
          0,
          w / 2,
          z / 2,
          t,
          rgb(p.tabletop.color),
          material("tabletop"),
        );
      else
        box(
          0,
          h - t / 2,
          0,
          w,
          t,
          z,
          rgb(p.tabletop.color),
          material("tabletop"),
          0.018,
        );
    });
    component("column", () =>
      cylinder(
        0,
        (h - t + 0.05) / 2,
        0,
        p.column.diameter / 200,
        p.column.diameter / 200,
        h - t - 0.05,
        rgb(p.column.color),
        material("column"),
        0.75,
      ),
    );
    component("base", () => {
      const first = vertices.length / 10;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        beam(
          [0, 0.06, 0],
          [Math.cos(a) * w * 0.44, 0.025, Math.sin(a) * z * 0.44],
          0.045,
          rgb(p.base.color),
          material("base"),
        );
      }
      const data = new Float32Array(vertices.slice(first * 10)),
        b = bounds(data);
      for (let i = first * 10; i < vertices.length; i += 10) {
        const scales = [
          p.base.width / 100 / b.size[0],
          1,
          p.base.depth / 100 / b.size[2],
        ];
        vertices[i] *= scales[0];
        vertices[i + 2] *= scales[2];
        vertices[i + 1] -= b.min[1];
        const n = unit([
          vertices[i + 3] / scales[0],
          vertices[i + 4],
          vertices[i + 5] / scales[2],
        ]);
        for (let k = 0; k < 3; k++) vertices[i + 3 + k] = n[k];
      }
    });
  } else if (d.kind === "table") {
    if (d.shape === "round") cylinder(0, h - thick / 2, 0, w / 2, z / 2, thick);
    else box(0, h - thick / 2, 0, w, thick, z, primary, wood, 0.018);
    cylinder(
      0,
      (h - thick) / 2 + 0.025,
      0,
      Math.min(w, z) * 0.075,
      Math.min(w, z) * 0.075,
      h - thick - 0.05,
      accent,
      0,
      0.75,
    );
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      beam(
        [0, 0.06, 0],
        [Math.cos(a) * w * 0.44, 0.025, Math.sin(a) * z * 0.44],
        0.045,
      );
    }
  } else if (d.kind === "chair") {
    const seat = h * 0.48;
    box(0, seat, 0, w * 0.9, h * 0.105, z * 0.86, primary, wood, 0.035);
    if (d.variant === "slatted") {
      for (let i = 0; i < 5; i++)
        box(
          (i / 4 - 0.5) * w * 0.85,
          h * 0.78,
          -z * 0.425,
          w * 0.13,
          h * 0.44,
          z * 0.12,
          primary,
          wood,
          0.01,
        );
    } else
      box(0, h * 0.78, -z * 0.425, w, h * 0.44, z * 0.15, primary, wood, 0.035);
    for (const xx of [-1, 1])
      for (const zz of [-1, 1])
        beam(
          [xx * w * 0.39, 0.015, zz * z * 0.39],
          [xx * w * 0.34, seat, zz * z * 0.33],
          Math.min(w, z) * 0.068,
        );
    if (d.variant !== "armless")
      for (const xx of [-1, 1]) {
        box(
          xx * w * 0.465,
          h * 0.59,
          -z * 0.04,
          w * 0.07,
          h * 0.055,
          z * 0.78,
          accent,
          0,
          0.012,
        );
        beam(
          [xx * w * 0.465, seat, -z * 0.26],
          [xx * w * 0.465, h * 0.59, -z * 0.26],
          0.027,
        );
      }
  } else if (d.kind === "lamp") {
    cylinder(0, 0.018, 0, w * 0.32, z * 0.32, 0.036, accent, 0);
    cylinder(0, h * 0.42, 0, 0.014, 0.014, h * 0.82, accent, 0);
    cylinder(0, h * 0.88, 0, w * 0.5, z * 0.5, h * 0.24, primary, wood, 0.52);
    cylinder(0, h * 0.762, 0, w * 0.46, z * 0.46, 0.005, [0.92, 0.85, 0.68], 0);
  } else if (d.kind === "desk") {
    if (d.variant === "corner") {
      box(
        -w * 0.325,
        h - thick / 2,
        0,
        w * 0.35,
        thick,
        z,
        primary,
        wood,
        0.012,
      );
      box(
        w * 0.175,
        h - thick / 2,
        -z * 0.325,
        w * 0.65,
        thick,
        z * 0.35,
        primary,
        wood,
        0.012,
      );
      for (const [xx, zz] of [
        [-0.43, -0.43],
        [-0.43, 0.43],
        [-0.23, 0.43],
        [0.43, -0.43],
        [0.43, -0.23],
      ])
        box(xx * w, (h - thick) / 2, zz * z, 0.04, h - thick, 0.04, accent, 0);
    } else {
      if (d.shape === "round")
        cylinder(0, h - thick / 2, 0, w / 2, z / 2, thick);
      else if (d.variant === "slatted") {
        for (let i = 0; i < 7; i++)
          box(
            (i / 6 - 0.5) * w * 0.85,
            h - thick / 2,
            0,
            w * 0.135,
            thick,
            z,
            primary,
            wood,
            0.007,
          );
      } else box(0, h - thick / 2, 0, w, thick, z, primary, wood, 0.018);
      for (const xx of [-1, 1]) {
        if (d.variant === "standing")
          box(
            xx * w * 0.36,
            (h - thick) / 2,
            0,
            0.06,
            h - thick,
            0.09,
            accent,
            0,
          );
        else
          for (const zz of [-1, 1])
            box(
              xx * w * 0.43,
              (h - thick) / 2,
              zz * z * 0.39,
              0.04,
              h - thick,
              0.04,
              accent,
              0,
            );
        box(
          xx * w * (d.variant === "standing" ? 0.36 : 0.43),
          0.025,
          0,
          0.06,
          0.05,
          z * 0.83,
          accent,
          0,
        );
      }
      box(0, h * 0.85, -z * 0.39, w * 0.86, 0.045, 0.04, accent, 0);
    }
  } else if (["shelf", "rack"].includes(d.kind)) {
    const count = d.shelves || 4,
      t = 0.027;
    if (d.kind === "shelf") {
      for (const xx of [-1, 1]) box(xx * (w / 2 - t / 2), h / 2, 0, t, h, z);
      box(0, h / 2, -z / 2 + 0.008, w, h, 0.016, accent, 0);
    } else
      for (const xx of [-1, 1])
        for (const zz of [-1, 1])
          box(
            xx * (w / 2 - 0.017),
            h / 2,
            zz * (z / 2 - 0.017),
            0.034,
            h,
            0.034,
            accent,
            0,
          );
    for (let i = 0; i < count; i++) {
      const y = t / 2 + ((h - t) * i) / (count - 1);
      box(0, y, 0, w, t, z, primary, wood, 0.004);
    }
  } else if (d.kind === "stool") {
    if (d.shape === "round") cylinder(0, h - 0.025, 0, w / 2, z / 2, 0.05);
    else box(0, h - 0.025, 0, w, 0.05, z, primary, wood, 0.02);
    for (const xx of [-1, 1])
      for (const zz of [-1, 1])
        beam(
          [xx * w * 0.39, 0.012, zz * z * 0.39],
          [xx * w * 0.27, h - 0.05, zz * z * 0.27],
          0.032,
        );
    for (const xx of [-1, 1])
      beam(
        [xx * w * 0.35, h * 0.3, -z * 0.35],
        [xx * w * 0.35, h * 0.3, z * 0.35],
        0.022,
      );
    for (const zz of [-1, 1])
      beam(
        [-w * 0.35, h * 0.3, zz * z * 0.35],
        [w * 0.35, h * 0.3, zz * z * 0.35],
        0.022,
      );
  } else if (d.kind === "plinth") {
    if (d.shape === "round") cylinder(0, h / 2, 0, w / 2, z / 2, h);
    else box(0, h / 2, 0, w, h, z, primary, wood, 0.015);
  } else if (d.kind === "sofa") {
    const count = w > 1.9 ? 3 : 2;
    box(0, h * 0.3, 0, w * 0.95, h * 0.2, z * 0.88, primary, wood, 0.035);
    box(0, h * 0.73, -z * 0.39, w, h * 0.54, z * 0.22, primary, wood, 0.055);
    for (const xx of [-1, 1])
      box(
        xx * w * 0.46,
        h * 0.49,
        0,
        w * 0.08,
        h * 0.49,
        z,
        primary,
        wood,
        0.04,
      );
    for (let i = 0; i < count; i++)
      box(
        ((i - (count - 1) / 2) * w * 0.82) / count,
        h * 0.47,
        z * 0.025,
        (w * 0.8) / count,
        h * 0.16,
        z * 0.72,
        primary,
        wood,
        0.035,
      );
    legs(h * 0.25, 0.4, 0.01, 0.05);
  } else if (d.kind === "cabinet") {
    const t = Math.min(w, z) * 0.045;
    box(0, h * 0.05, 0, w * 0.94, h * 0.1, z * 0.91, accent, 0);
    for (const xx of [-1, 1])
      box(xx * (w / 2 - t / 2), h * 0.55, 0, t, h * 0.9, z);
    box(0, h - t / 2, 0, w, t, z);
    box(0, h * 0.12, 0, w, t, z);
    box(0, h * 0.55, -z / 2 + t / 2, w, h * 0.9, t, accent, 0);
    if (d.variant === "open") {
      const count = d.shelves || 4;
      for (let i = 1; i < count; i++)
        box(0, h * 0.12 + (h * 0.85 * i) / count, 0, w, t, z);
    } else {
      const count = d.panels || 2;
      for (let i = 0; i < count; i++) {
        if (d.variant === "drawers") {
          const dh = (h * 0.84) / count,
            y = h * 0.13 + dh * (i + 0.5);
          box(0, y, z * 0.48, w * 0.94, dh * 0.95, t);
          box(0, y, z * 0.51, w * 0.25, 0.012, 0.016, accent, 0, 0.002);
        } else {
          const dw = (w * 0.95) / count,
            x = (i - (count - 1) / 2) * dw;
          box(x, h * 0.55, z * 0.48, dw * 0.97, h * 0.85, t);
          box(
            x + dw * 0.3,
            h * 0.56,
            z * 0.515,
            0.012,
            h * 0.1,
            0.018,
            accent,
            0,
            0.002,
          );
          if (d.variant === "locker")
            for (let j = 0; j < 3; j++)
              box(
                x,
                h * 0.81 - j * h * 0.025,
                z * 0.505,
                dw * 0.4,
                0.006,
                0.008,
                accent,
                0,
                0.001,
              );
        }
      }
    }
  } else if (d.kind === "bed") {
    box(0, h * 0.25, z * 0.015, w, h * 0.24, z * 0.97, primary, wood, 0.02);
    box(0, h * 0.51, -z * 0.47, w, h * 0.98, z * 0.06, primary, wood, 0.012);
    box(0, h * 0.43, z * 0.03, w * 0.94, h * 0.18, z * 0.88, accent, 0, 0.04);
    for (const xx of [-1, 1])
      box(
        xx * w * 0.235,
        h * 0.55,
        -z * 0.27,
        w * 0.4,
        h * 0.09,
        z * 0.19,
        accent,
        0,
        0.045,
      );
    legs(h * 0.2, 0.42, 0.01, 0.06);
  } else if (d.kind === "vanity") {
    box(0, h * 0.48, z * 0.08, w, 0.035, z * 0.85);
    legs(h * 0.48, 0.42, 0.01, 0.035);
    box(0, h * 0.76, -z * 0.38, w * 0.65, h * 0.48, 0.025, accent, 0, 0.015);
    box(
      0,
      h * 0.76,
      -z * 0.36,
      w * 0.59,
      h * 0.43,
      0.018,
      [0.66, 0.73, 0.72],
      2,
      0.01,
    );
    box(-w * 0.29, h * 0.4, z * 0.07, w * 0.35, h * 0.12, z * 0.8);
  } else if (d.kind === "counter") {
    box(0, h * 0.46, -z * 0.04, w * 0.94, h * 0.88, z * 0.88);
    box(0, h - 0.025, 0, w, 0.05, z, accent, 0, 0.012);
    box(0, h * 0.035, z * 0.1, w * 0.92, h * 0.07, z * 0.88, accent, 0, 0.004);
    for (const xx of [-1, 0, 1])
      box(
        xx * w * 0.31,
        h * 0.46,
        z * 0.41,
        w * 0.3,
        h * 0.78,
        0.018,
        primary,
        wood,
        0.002,
      );
  } else if (d.kind === "bench") {
    const seat = d.variant === "backrest" ? h * 0.52 : h - 0.04;
    for (let i = 0; i < 4; i++)
      box(
        0,
        seat,
        (i / 3 - 0.5) * z * 0.75,
        w,
        0.04,
        z * 0.22,
        primary,
        wood,
        0.008,
      );
    legs(seat - 0.02, 0.4, 0.01, 0.05);
    if (d.variant === "backrest") {
      for (let i = 0; i < 3; i++)
        box(0, h * 0.67 + i * h * 0.13, -z * 0.45, w, h * 0.105, 0.025);
      for (const xx of [-1, 1])
        beam(
          [xx * w * 0.4, seat, -z * 0.45],
          [xx * w * 0.4, h, -z * 0.45],
          0.035,
        );
    }
  } else if (d.kind === "vase") {
    lathe([
      [0, 0],
      [0.02, 0.3],
      [0.12, 0.44],
      [0.38, 0.5],
      [0.66, 0.4],
      [0.87, 0.23],
      [1, 0.27],
      [1, 0.22],
      [0.87, 0.18],
      [0.66, 0.34],
      [0.15, 0.37],
      [0.07, 0],
    ]);
  } else if (d.kind === "planter" || d.kind === "hanging-planter") {
    const hanging = d.kind === "hanging-planter";
    const potH = h * (hanging ? 0.38 : 0.47),
      y = hanging ? h * 0.08 : 0;
    cylinder(0, y + potH / 2, 0, w * 0.37, z * 0.37, potH, primary, wood, 1.27);
    cylinder(
      0,
      y + potH * 0.97,
      0,
      w * 0.46,
      z * 0.46,
      potH * 0.04,
      [0.23, 0.2, 0.15],
      0,
    );
    foliage(0, y + potH, 0, h * 0.52);
    if (hanging)
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3;
        beam(
          [Math.cos(a) * w * 0.44, y + potH * 0.9, Math.sin(a) * z * 0.44],
          [0, h, 0],
          0.008,
          accent,
          0,
        );
      }
  } else if (d.kind === "mirror") {
    const bottom = d.variant === "standing" ? h * 0.12 : 0,
      mh = h - bottom;
    box(
      0,
      bottom + mh / 2,
      -z * 0.1,
      w,
      mh,
      Math.min(z * 0.16, 0.03),
      accent,
      0,
      0.012,
    );
    box(
      0,
      bottom + mh / 2,
      -z * 0.1 + 0.018,
      w * 0.88,
      mh * 0.94,
      0.012,
      primary,
      2,
      0.006,
    );
    if (d.variant === "standing") {
      for (const xx of [-1, 1])
        beam(
          [xx * w * 0.4, 0.01, z * 0.4],
          [xx * w * 0.4, h * 0.82, -z * 0.12],
          0.028,
          accent,
          0,
        );
      beam(
        [-w * 0.4, 0.01, -z * 0.4],
        [w * 0.4, 0.01, -z * 0.4],
        0.03,
        accent,
        0,
      );
    }
  } else if (d.kind === "wall-shelf") {
    box(0, h * 0.88, 0, w, h * 0.12, z);
    for (const xx of [-1, 1]) {
      beam(
        [xx * w * 0.34, h * 0.02, -z * 0.4],
        [xx * w * 0.34, h * 0.83, z * 0.4],
        0.025,
      );
      box(xx * w * 0.34, h * 0.45, -z * 0.45, 0.03, h * 0.9, 0.03, accent, 0);
    }
  } else if (d.kind === "sculpture") {
    cylinder(0, h * 0.07, 0, w * 0.5, z * 0.5, h * 0.14, accent, 0);
    ellipsoid(0, h * 0.35, 0, w * 0.4, h * 0.23, z * 0.4);
    ellipsoid(
      w * 0.08,
      h * 0.72,
      0,
      w * 0.31,
      h * 0.29,
      z * 0.31,
      primary,
      wood,
    );
  } else if (d.kind === "plant-stand") {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * w * 0.3,
        y = h * (0.4 + i * 0.25);
      box(x, y, 0, w * 0.35, 0.025, z);
      for (const zz of [-1, 1])
        beam([x, 0.01, zz * z * 0.38], [x, y, zz * z * 0.38], 0.025);
    }
  } else if (d.kind === "partition") {
    if (d.variant === "slatted") {
      for (let i = 0; i < 9; i++)
        box(
          (i / 8 - 0.5) * w * 0.94,
          h * 0.51,
          0,
          w * 0.055,
          h * 0.98,
          z * 0.25,
        );
    } else
      box(
        0,
        h * 0.53,
        0,
        w,
        h * 0.94,
        Math.min(z * 0.15, 0.04),
        primary,
        wood,
        0.015,
      );
    if (d.variant === "corner")
      box(-w * 0.47, h * 0.53, z * 0.25, w * 0.06, h * 0.94, z * 0.5);
    for (const xx of [-1, 1])
      box(xx * w * 0.36, 0.025, 0, 0.06, 0.05, z, accent, 0);
  } else if (d.kind === "office-chair") {
    box(0, h * 0.42, 0, w * 0.84, h * 0.1, z * 0.8, primary, wood, 0.04);
    box(
      0,
      h * 0.75,
      -z * 0.36,
      w * 0.76,
      h * 0.5,
      z * 0.14,
      primary,
      wood,
      0.04,
    );
    cylinder(0, h * 0.2, 0, 0.025, 0.025, h * 0.4, accent, 2);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        x = Math.cos(a) * w * 0.45,
        zz = Math.sin(a) * z * 0.45;
      beam([0, 0.055, 0], [x, 0.025, zz], 0.035);
      ellipsoid(x, 0.02, zz, 0.027, 0.02, 0.027, accent, 0);
    }
    for (const xx of [-1, 1]) {
      box(xx * w * 0.45, h * 0.55, 0, 0.04, 0.035, z * 0.55, accent, 0);
      beam([xx * w * 0.4, h * 0.4, 0], [xx * w * 0.45, h * 0.55, 0], 0.025);
    }
  } else if (d.kind === "pendant") {
    cylinder(0, h * 0.98, 0, w * 0.16, z * 0.16, h * 0.04, accent, 0);
    beam([0, h * 0.98, 0], [0, h * 0.34, 0], 0.008, accent, 0);
    cylinder(0, h * 0.17, 0, w * 0.5, z * 0.5, h * 0.34, primary, wood, 0.28);
    cylinder(0, 0.006, 0, w * 0.47, z * 0.47, 0.012, [0.93, 0.88, 0.72], 0);
  } else if (d.kind === "chandelier") {
    cylinder(0, h * 0.93, 0, w * 0.12, z * 0.12, h * 0.14, accent, 0);
    beam([0, h * 0.9, 0], [0, h * 0.3, 0], 0.02);
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        x = Math.cos(a) * w * 0.36,
        zz = Math.sin(a) * z * 0.36;
      beam([0, h * 0.3, 0], [x, h * 0.42, zz], 0.025);
      ellipsoid(x, h * 0.29, zz, w * 0.12, h * 0.17, z * 0.12, primary, wood);
    }
  } else if (d.kind === "wall-light") {
    box(0, h * 0.57, -z * 0.4, w * 0.35, h * 0.55, 0.025, accent, 0);
    beam([0, h * 0.4, -z * 0.4], [0, h * 0.4, z * 0.15], 0.025);
    cylinder(
      0,
      h * 0.66,
      z * 0.12,
      w * 0.5,
      z * 0.35,
      h * 0.68,
      primary,
      wood,
      0.6,
    );
  } else if (d.kind === "board") {
    const bottom = h * 0.3;
    box(
      0,
      bottom + (h - bottom) / 2,
      -z * 0.05,
      w,
      h - bottom,
      0.035,
      accent,
      0,
      0.008,
    );
    box(
      0,
      bottom + (h - bottom) / 2,
      -z * 0.05 + 0.024,
      w * 0.92,
      (h - bottom) * 0.92,
      0.012,
      primary,
      wood,
      0.004,
    );
    if (d.variant === "a-frame") {
      for (const xx of [-1, 1])
        for (const zz of [-1, 1])
          beam(
            [xx * w * 0.43, 0, zz * z * 0.44],
            [xx * w * 0.43, h * 0.96, 0],
            0.025,
          );
    } else
      for (const xx of [-1, 1]) {
        box(xx * w * 0.38, bottom / 2, 0, 0.025, bottom, 0.025, accent, 0);
        box(xx * w * 0.38, 0.02, 0, 0.06, 0.04, z, accent, 0);
      }
  } else if (d.kind === "laptop-stand") {
    box(0, h * 0.07, 0, w * 0.8, h * 0.14, z * 0.9, accent, 0);
    beam([0, h * 0.12, -z * 0.2], [0, h * 0.75, z * 0.1], 0.05, accent, 0);
    box(0, h * 0.91, 0, w, h * 0.12, z, primary, wood, 0.01);
    box(0, h * 0.98, z * 0.45, w * 0.9, h * 0.04, 0.02, accent, 0);
  } else if (d.kind === "tier-stand") {
    const count = d.shelves || 3;
    for (const xx of [-1, 1])
      box(xx * w * 0.4, h / 2, -z * 0.25, 0.03, h, 0.03, accent, 0);
    for (let i = 0; i < count; i++)
      box(
        0,
        0.025 + ((h - 0.05) * i) / (count - 1),
        0,
        w * (1 - i * 0.12),
        0.04,
        z * (1 - i * 0.1),
      );
  } else if (d.kind === "rail") {
    for (const xx of [-1, 1]) {
      box(xx * w * 0.47, h / 2, 0, 0.035, h, 0.035, accent, 0);
      box(xx * w * 0.47, 0.025, 0, 0.07, 0.05, z, accent, 0);
    }
    beam(
      [-w * 0.47, h - 0.02, 0],
      [w * 0.47, h - 0.02, 0],
      0.03,
      primary,
      wood,
    );
    if (d.variant === "shelf") box(0, h * 0.12, 0, w, 0.025, z);
  } else if (d.kind === "accessory") {
    box(0, 0.02, 0, w, 0.04, z, accent, 0);
    box(0, h * 0.5, 0, 0.025, h, 0.025, primary, wood);
    for (const yy of [0.55, 0.95])
      beam([-w * 0.45, h * yy, 0], [w * 0.45, h * yy, 0], 0.025, primary, wood);
  } else if (d.kind === "brochure") {
    box(0, h * 0.025, 0, w, 0.05 * h, z, accent, 0);
    box(0, h * 0.48, -z * 0.22, 0.035, h * 0.9, 0.035, accent, 0);
    for (let i = 0; i < 3; i++) {
      const y = h * (0.33 + i * 0.25);
      box(0, y, -z * 0.1, w * 0.9, h * 0.22, 0.02, primary, wood, 0.003);
      box(0, y - h * 0.1, z * 0.12, w, 0.02, z * 0.55, primary, wood, 0.003);
      box(0, y - h * 0.04, z * 0.38, w, h * 0.12, 0.02, primary, wood, 0.003);
    }
  } else if (d.kind === "promo") {
    box(0, h * 0.08, 0, w, h * 0.16, z, accent, 0, 0.012);
    box(0, h * 0.58, -z * 0.2, w * 0.82, h * 0.84, 0.035, primary, wood, 0.01);
    box(0, h * 0.25, z * 0.1, w, 0.025, z * 0.75, accent, 0);
    box(0, h * 0.59, z * 0.1, w, 0.025, z * 0.75, accent, 0);
  } else if (d.kind === "logo") {
    box(0, h * 0.06, 0, w, h * 0.12, z, accent, 0, 0.01);
    box(0, h * 0.23, 0, w * 0.08, h * 0.3, z * 0.13, accent, 0);
    box(-w * 0.22, h * 0.65, 0, w * 0.18, h * 0.7, z * 0.28);
    box(w * 0.02, h * 0.93, 0, w * 0.66, h * 0.14, z * 0.28);
    box(-w * 0.03, h * 0.67, 0, w * 0.56, h * 0.14, z * 0.28);
  } else {
    throw Error("Unsupported catalog model: " + d.kind);
  }

  // Map the outer envelope to the requested dimensions, including frame ends.
  const data = new Float32Array(vertices),
    bb = bounds(data),
    desired = [w, h, z];
  const scale = desired.map((v, i) => v / (bb.size[i] || 1));
  for (let i = 0; !supportsParts(d) && i < data.length; i += 10) {
    for (let k = 0; k < 3; k++)
      data[i + k] =
        (data[i + k] - bb.min[k]) * scale[k] - (k === 1 ? 0 : desired[k] / 2);
    const n = [
        data[i + 3] / scale[0],
        data[i + 4] / scale[1],
        data[i + 5] / scale[2],
      ],
      len = Math.hypot(...n) || 1;
    for (let k = 0; k < 3; k++) data[i + 3 + k] = n[k] / len;
  }
  for (const part of parts)
    part.bounds = bounds(
      data.subarray(
        part.firstVertex * 10,
        (part.firstVertex + part.vertexCount) * 10,
      ),
    );
  return { data, bounds: bounds(data), parts };
}
export function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
export function unit(a) {
  const l = Math.hypot(...a) || 1;
  return a.map((x) => x / l);
}
function normal(a, b, c) {
  return unit(
    cross(
      b.map((x, i) => x - a[i]),
      c.map((x, i) => x - a[i]),
    ),
  );
}
export function bounds(data) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < data.length; i += 10)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], data[i + k]);
      max[k] = Math.max(max[k], data[i + k]);
    }
  return { min, max, size: max.map((v, i) => v - min[i]) };
}
