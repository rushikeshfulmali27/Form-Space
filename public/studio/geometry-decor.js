import { solveDecor } from "./parts-decor.js";
function lathe(writer, shape, c, m, low) {
  const [w, h, d] = shape.size.map((n) => n / 100),
    profile = shape.profile,
    count = low ? 24 : 64;
  const point = (angle, p) => [
    (Math.cos(angle) * w * p[1]) / 2,
    h * p[0],
    (Math.sin(angle) * d * p[1]) / 2,
  ];
  for (let i = 0; i < profile.length - 1; i++)
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2,
        b = ((j + 1) / count) * Math.PI * 2,
        A = point(a, profile[i]),
        B = point(a, profile[i + 1]),
        C = point(b, profile[i + 1]),
        D = point(b, profile[i]);
      writer.tri(A, B, C, null, c, m);
      writer.tri(A, C, D, null, c, m);
    }
}
export function buildDecor(d, p, writer, component, low) {
  // Multi-primitive rims have one contiguous triangle range and one leaf owner.
  const groups = new Map();
  for (const shape of solveDecor(d, p)) {
    if (!groups.has(shape.id)) groups.set(shape.id, []);
    groups.get(shape.id).push(shape);
  }
  for (const [id, shapes] of groups)
    component(id, () => {
      const part = p[id],
        c = part.color
          .slice(1)
          .match(/../g)
          .map((v) => parseInt(v, 16) / 255),
        m = ["oak", "walnut", "birch"].includes(part.material)
          ? 1
          : part.material === "metal"
            ? 2
            : 0;
      for (const shape of shapes) {
        if (shape.kind === "post") {
          writer.post(
            shape.from.map((n) => n / 100),
            shape.to.map((n) => n / 100),
            shape.section / 100,
            c,
            m,
          );
          continue;
        }
        if (shape.kind === "lathe") {
          lathe(writer, shape, c, m, low);
          continue;
        }
        const [x, y, z] = shape.center.map((n) => n / 100),
          [w, h, depth] = shape.size.map((n) => n / 100);
        if (shape.kind === "box") writer.box(x, y, z, w, h, depth, c, m, 0);
        else if (shape.kind === "cylinder")
          writer.cylinder(x, y, z, w / 2, depth / 2, h, c, m, shape.taper);
        else writer.ellipsoid(x, y, z, w / 2, h / 2, depth / 2, c, m);
      }
    });
}
