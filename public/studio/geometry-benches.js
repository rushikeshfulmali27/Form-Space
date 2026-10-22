import {
  BENCH_SEAT_SLATS,
  BENCH_BACK_SLATS,
  solveBench,
} from "./parts-benches.js";
export function buildBench(d, p, writer, component) {
  const { box, post } = writer,
    { w, h, z, seatTop, gap, slatDepth, bearers, legs, back } = solveBench(
      d,
      p,
    );
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
  BENCH_SEAT_SLATS.forEach((id, i) =>
    draw(`seat-slats.${id}`, (c, m) => {
      const t = p[`seat-slats.${id}`].thickness / 100;
      box(
        0,
        seatTop - t / 2,
        -z / 2 + slatDepth / 2 + i * (slatDepth + gap),
        w,
        t,
        slatDepth,
        c,
        m,
        0,
      );
    }),
  );
  for (const [side, b] of Object.entries(bearers))
    draw(`bearers.${side}`, (c, m) => {
      const s = p[`bearers.${side}`].section / 100;
      box(b.x, (b.top + b.bottom) / 2, 0, s, s, z, c, m, 0);
    });
  for (const [id, leg] of Object.entries(legs))
    draw(`legs.${id}`, (c, m) => post(leg.bottom, leg.top, leg.section, c, m));
  if (back) {
    for (const side of ["left", "right"])
      draw(`back-supports.${side}`, (c, m) => {
        const s = p[`back-supports.${side}`].section / 100;
        box(
          bearers[side].x,
          (back.bottom + h) / 2,
          back.z,
          s,
          h - back.bottom,
          s,
          c,
          m,
          0,
        );
      });
    BENCH_BACK_SLATS.forEach((id, i) =>
      draw(`back-slats.${id}`, (c, m) => {
        const b = back.slats[i];
        box(
          0,
          (b.top + b.bottom) / 2,
          back.z,
          w,
          b.top - b.bottom,
          p[`back-slats.${id}`].thickness / 100,
          c,
          m,
          0,
        );
      }),
    );
  }
}
