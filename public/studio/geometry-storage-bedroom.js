import { solveStorageBedroom } from "./parts-storage-bedroom.js";
export function buildStorageBedroom(d, p, writer, component) {
  const { boxes, posts } = solveStorageBedroom(d, p);
  const draw = (id, fn) =>
    component(id, () => {
      const part = p[id],
        color = part.color
          .slice(1)
          .match(/../g)
          .map((v) => parseInt(v, 16) / 255);
      const material = ["oak", "walnut", "birch"].includes(part.material)
        ? 1
        : part.material === "metal"
          ? 2
          : 0;
      fn(color, material);
    });
  for (const b of boxes)
    draw(b.id, (c, m) =>
      writer.box(
        ...b.center.map((n) => n / 100),
        ...b.size.map((n) => n / 100),
        c,
        m,
        /^(mattress|pillows\.)/.test(b.id)
          ? Math.min(...b.size.map((n) => n / 400), 0.045)
          : 0,
      ),
    );
  for (const p of posts)
    draw(p.id, (c, m) =>
      writer.post(
        p.from.map((n) => n / 100),
        p.to.map((n) => n / 100),
        p.section / 100,
        c,
        m,
      ),
    );
}
