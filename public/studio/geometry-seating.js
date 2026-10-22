import {
  SEATING_LEGS,
  BACK_SLATS,
  STRETCHERS,
  solveSeating,
} from "./parts-seating.js";

export function buildSeating(d, p, writer, component) {
  const { box, cylinder, post } = writer,
    { w, h, z, stool, seatTop, seatBottom, backThickness, legs } = solveSeating(
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
  draw("seat", (c, m) => {
    const t = p.seat.thickness / 100;
    if (stool && d.shape === "round")
      cylinder(0, seatTop - t / 2, 0, w / 2, z / 2, t, c, m);
    else {
      const rear = stool ? -z / 2 : -z / 2 + backThickness / 2;
      box(
        0,
        seatTop - t / 2,
        (rear + z / 2) / 2,
        stool ? w : w * 0.9,
        t,
        z / 2 - rear,
        c,
        m,
        Math.min(0.035, t * 0.25),
      );
    }
  });
  if (!stool) {
    const height = h - seatBottom;
    if (p["back-slats"]) {
      const gap = p["back-slats"].gap / 100,
        sw = (w - 4 * gap) / 5;
      BACK_SLATS.forEach((id, i) =>
        draw(`back-slats.${id}`, (c, m) =>
          box(
            -w / 2 + sw / 2 + i * (sw + gap),
            seatBottom + height / 2,
            -z / 2 + backThickness / 2,
            sw,
            height,
            backThickness,
            c,
            m,
            0,
          ),
        ),
      );
    } else
      draw("back", (c, m) =>
        box(
          0,
          seatBottom + height / 2,
          -z / 2 + backThickness / 2,
          w,
          height,
          backThickness,
          c,
          m,
          0.025,
        ),
      );
  }
  for (const id of SEATING_LEGS) {
    const leg = legs[id];
    draw(`legs.${id}`, (c, m) => post(leg.bottom, leg.top, leg.section, c, m));
  }
  if (p.armrests)
    for (const [side, sign] of [
      ["left", -1],
      ["right", 1],
    ]) {
      const arm = p[`armrests.${side}`],
        section = arm.section / 100,
        top = arm.height / 100,
        x = sign * (w / 2 - section / 2),
        rear = -z / 2 + backThickness / 2,
        front = z * 0.36;
      draw(`armrests.${side}`, (c, m) =>
        box(
          x,
          top - section / 2,
          (rear + front) / 2,
          section,
          section,
          front - rear,
          c,
          m,
          0,
        ),
      );
      draw(`arm-supports.${side}`, (c, m) =>
        post(
          [sign * w * 0.4, seatTop - p.seat.thickness / 400, -z * 0.26],
          [x, top - section * 0.75, -z * 0.26],
          Math.min(section * 0.6, Math.min(w, z) * 0.05),
          c,
          m,
        ),
      );
    }
  if (stool) {
    const y = p.stretchers.height / 100,
      ratio = y / seatBottom;
    const at = (id) =>
      legs[id].bottom.map((n, i) => n + (legs[id].top[i] - n) * ratio);
    const pairs = {
      front: ["front-left", "front-right"],
      rear: ["rear-left", "rear-right"],
      left: ["front-left", "rear-left"],
      right: ["front-right", "rear-right"],
    };
    for (const id of STRETCHERS) {
      const [a, b] = pairs[id].map(at),
        s = p[`stretchers.${id}`].section / 100;
      draw(`stretchers.${id}`, (c, m) =>
        box(
          (a[0] + b[0]) / 2,
          y,
          (a[2] + b[2]) / 2,
          Math.abs(a[0] - b[0]) + s,
          s,
          Math.abs(a[2] - b[2]) + s,
          c,
          m,
          0,
        ),
      );
    }
  }
}
