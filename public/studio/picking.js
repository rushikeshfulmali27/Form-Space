// Orthographic picking shared by WebGL and software rendering.
const dot = (a, b) => a.reduce((v, n, i) => v + n * b[i], 0);
const sub = (a, b) => a.map((n, i) => n - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export function pickPart(model, cam, x, y, width, height) {
  const origin = cam.target.map(
    (n, i) =>
      n +
      (cam.x[i] * (x - width / 2) * cam.size) / height -
      (cam.y[i] * (y - height / 2) * cam.size) / height +
      cam.z[i] * 15,
  );
  const dir = cam.z.map((n) => -n);
  let nearest = Infinity,
    hit = null;
  for (const part of model.parts) {
    // Slab test rejects parts away from the ray, but never selects empty gaps.
    let lo = 0,
      hi = Infinity;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(dir[k]) < 1e-10) {
        if (origin[k] < part.bounds.min[k] || origin[k] > part.bounds.max[k])
          hi = -1;
      } else {
        const a = (part.bounds.min[k] - origin[k]) / dir[k],
          b = (part.bounds.max[k] - origin[k]) / dir[k];
        lo = Math.max(lo, Math.min(a, b));
        hi = Math.min(hi, Math.max(a, b));
      }
    }
    if (hi < lo) continue;
    for (
      let i = part.firstVertex * 10;
      i < (part.firstVertex + part.vertexCount) * 10;
      i += 30
    ) {
      const a = [...model.data.slice(i, i + 3)],
        b = [...model.data.slice(i + 10, i + 13)],
        c = [...model.data.slice(i + 20, i + 23)];
      const e1 = sub(b, a),
        e2 = sub(c, a),
        p = cross(dir, e2),
        det = dot(e1, p);
      if (Math.abs(det) < 1e-10) continue;
      const t = sub(origin, a),
        u = dot(t, p) / det;
      if (u < 0 || u > 1) continue;
      const q = cross(t, e1),
        v = dot(dir, q) / det,
        distance = dot(e2, q) / det;
      if (v >= 0 && u + v <= 1 && distance >= 0 && distance < nearest) {
        nearest = distance;
        hit = part.id;
      }
    }
  }
  return hit;
}
