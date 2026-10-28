import { solveRetailLighting } from "./parts-retail-lighting.js";
export function buildRetailLighting(d, p, writer, component) {
  for (const shape of solveRetailLighting(d, p))
    component(shape.id, () => {
      const part = p[shape.id],
        color = part.color
          .slice(1)
          .match(/../g)
          .map((v) => parseInt(v, 16) / 255),
        material = ["oak", "walnut", "birch"].includes(part.material)
          ? 1
          : part.material === "metal"
            ? 2
            : 0;
      const [x, y, z] = shape.center.map((n) => n / 100),
        [w, h, depth] = shape.size.map((n) => n / 100);
      if (shape.kind === "cylinder")
        writer.cylinder(
          x,
          y,
          z,
          w / 2,
          depth / 2,
          h,
          color,
          material,
          shape.taper,
        );
      else writer.box(x, y, z, w, h, depth, color, material, 0);
    });
}
