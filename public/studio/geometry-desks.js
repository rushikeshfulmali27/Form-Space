import { DESK_LEGS, solveDesk } from "./parts-desks.js";
export function buildStandardDesk(d, p, writer, component, drawTop) {
  const { box, cylinder, beam } = writer,
    { h, t, sides, braceY } = solveDesk(d, p);
  const color = (id) =>
    p[id].color
      .slice(1)
      .match(/../g)
      .map((n) => parseInt(n, 16) / 255);
  const material = (id) =>
    ["oak", "walnut", "birch"].includes(p[id].material)
      ? 1
      : p[id].material === "metal"
        ? 2
        : 0;
  const draw = (id, fn) => component(id, () => fn(color(id), material(id)));
  if (drawTop) drawTop();
  else
    draw("tabletop", (c, m) => {
      if (d.shape === "round")
        cylinder(0, h - t / 2, 0, d.width / 200, d.depth / 200, t, c, m);
      else box(0, h - t / 2, 0, d.width / 100, t, d.depth / 100, c, m, 0.018);
    });
  for (const id of DESK_LEGS) {
    const key = `legs.${id}`,
      side = id.endsWith("left") ? sides.left : sides.right,
      front = id.startsWith("front"),
      bottom = side.footTop * 0.75;
    draw(key, (c, m) =>
      box(
        side.x,
        (h - t + bottom) / 2,
        (front ? 1 : -1) * side.z,
        p[key].section / 100,
        h - t - bottom,
        p[key].section / 100,
        c,
        m,
      ),
    );
  }
  for (const side of ["left", "right"]) {
    const id = `feet.${side}`,
      f = p[id];
    draw(id, (c, m) =>
      box(
        sides[side].x,
        f.thickness / 200,
        0,
        f.width / 100,
        f.thickness / 100,
        f.depth / 100,
        c,
        m,
      ),
    );
  }
  draw("rear-brace", (c, m) =>
    beam(
      [sides.left.x, braceY, -sides.left.z],
      [sides.right.x, braceY, -sides.right.z],
      p["rear-brace"].section / 100,
      c,
      m,
    ),
  );
}
