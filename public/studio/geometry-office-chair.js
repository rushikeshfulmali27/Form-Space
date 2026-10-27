import { solveOfficeChair } from "./parts-office-chair.js";
export function buildOfficeChair(d, p, writer, component) {
  const { box, cylinder, ellipsoid, post, tri } = writer,
    { w, h, z, seatTop, seatBottom, backThickness, slots, hubY, columnBottom } =
      solveOfficeChair(d, p);
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
  const rear = -z / 2 + backThickness / 2;
  draw("seat", (c, m) =>
    box(
      0,
      (seatTop + seatBottom) / 2,
      (rear + z / 2) / 2,
      w * 0.84,
      seatTop - seatBottom,
      z / 2 - rear,
      c,
      m,
      Math.min(0.04, (seatTop - seatBottom) * 0.25),
    ),
  );
  draw("back", (c, m) =>
    box(
      0,
      (seatBottom + h) / 2,
      rear,
      w * 0.76,
      h - seatBottom,
      backThickness,
      c,
      m,
      0.04,
    ),
  );
  draw("column", (c, m) =>
    cylinder(
      0,
      (columnBottom + seatBottom) / 2,
      0,
      p.column.diameter / 200,
      p.column.diameter / 200,
      seatBottom - columnBottom,
      c,
      m,
    ),
  );
  for (const [side, sign] of [
    ["left", -1],
    ["right", 1],
  ]) {
    const arm = p[`armrests.${side}`],
      s = arm.section / 100,
      top = arm.height / 100,
      x = sign * (w / 2 - s / 2);
    draw(`armrests.${side}`, (c, m) =>
      box(x, top - s / 2, 0, s, s, z * 0.55, c, m, 0),
    );
    draw(`arm-supports.${side}`, (c, m) =>
      post(
        [sign * w * 0.38, seatTop - (seatTop - seatBottom) * 0.25, 0],
        [x, top - s * 0.75, 0],
        Math.min(s * 0.6, Math.min(w, z) * 0.05),
        c,
        m,
      ),
    );
  }
  for (const slot of slots) {
    draw(`star-base.${slot.id}`, (c, m) => {
      // Vertical end sections keep the lower caster attachment above the floor,
      // regardless of slope or the independently chosen spoke/caster sizes.
      const length = Math.hypot(slot.x, slot.z),
        nx = -slot.z / length,
        nz = slot.x / length,
        r = slot.section / 2;
      const points = [
        [0, hubY, 0],
        [slot.x, slot.endY, slot.z],
      ].flatMap(([x, y, z]) => [
        [x - nx * r, y - r, z - nz * r],
        [x + nx * r, y - r, z + nz * r],
        [x + nx * r, y + r, z + nz * r],
        [x - nx * r, y + r, z - nz * r],
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
    draw(`casters.${slot.id}`, (c, m) =>
      ellipsoid(
        slot.x,
        slot.height / 2,
        slot.z,
        slot.r,
        slot.height / 2,
        slot.r,
        c,
        m,
      ),
    );
  }
}
