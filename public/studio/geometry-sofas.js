import { solveSofa } from "./parts-sofas.js";
import { SEATING_LEGS } from "./parts-seating.js";
export function buildSofa(d, p, writer, component) {
  const { box, post } = writer,
    { w, h, z, baseTop, baseBottom, left, gap, width, ids, rear, front } =
      solveSofa(d, p);
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
  draw("base", (c, m) =>
    box(
      0,
      (baseTop + baseBottom) / 2,
      0,
      w,
      baseTop - baseBottom,
      z,
      c,
      m,
      0.035,
    ),
  );
  const bottom = baseTop - (baseTop - baseBottom) * 0.5;
  draw("back", (c, m) =>
    box(
      0,
      (bottom + h) / 2,
      -z / 2 + p.back.thickness / 200,
      w,
      h - bottom,
      p.back.thickness / 100,
      c,
      m,
      0.055,
    ),
  );
  for (const [side, sign] of [
    ["left", -1],
    ["right", 1],
  ]) {
    const a = p[`arms.${side}`],
      t = a.thickness / 100,
      top = a.height / 100;
    draw(`arms.${side}`, (c, m) =>
      box(
        sign * (w / 2 - t / 2),
        (bottom + top) / 2,
        0,
        t,
        top - bottom,
        z,
        c,
        m,
        0.04,
      ),
    );
  }
  ids.forEach((id, i) =>
    draw(`cushions.${id}`, (c, m) => {
      const t = p[`cushions.${id}`].thickness / 100;
      box(
        left + width / 2 + i * (width + gap),
        baseTop + t / 2,
        (rear + front) / 2,
        width,
        t,
        front - rear,
        c,
        m,
        0.035,
      );
    }),
  );
  for (const id of SEATING_LEGS) {
    const x = (id.endsWith("left") ? -1 : 1) * w * 0.4,
      zz = (id.startsWith("front") ? 1 : -1) * z * 0.4;
    draw(`legs.${id}`, (c, m) =>
      post(
        [x, 0, zz],
        [x, baseBottom + (baseTop - baseBottom) * 0.25, zz],
        p[`legs.${id}`].section / 100,
        c,
        m,
      ),
    );
  }
}
