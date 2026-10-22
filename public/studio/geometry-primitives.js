// Shared ten-float primitive writer; preserves the original tessellation.
export function createPrimitiveWriter({
  vertices,
  primary,
  accent,
  wood,
  low,
}) {
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
      if (r === 0) {
        const n = [0, 0, 0];
        n[axis] = sign;
        return { p: p.map((x, i) => center[i] + x), n };
      }
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

  function post(a, b, section, c, m) {
    const r = section / 2,
      points = [a, b].flatMap(([x, y, z]) => [
        [x - r, y, z - r],
        [x + r, y, z - r],
        [x + r, y, z + r],
        [x - r, y, z + r],
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
  }

  return { tri, box, cylinder, beam, ellipsoid, post };
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
