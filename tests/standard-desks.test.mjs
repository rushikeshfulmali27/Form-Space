import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  fresh,
  normalize,
  serialize,
  deserialize,
  History,
  CATALOG,
} from "../public/studio/design.js";
import {
  editPart,
  resolveParts,
  resetPart,
  applyGroup,
  partDescendants,
  partLimits,
} from "../public/studio/parts.js";
import { DESK_LEGS, solveDesk } from "../public/studio/parts-desks.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
import { Viewer } from "../public/studio/viewer.js";
import { pickPart } from "../public/studio/picking.js";
const IDS = [
  "work-desk",
  "coffee-table",
  "dining-table",
  "conference-table",
  "communal-table",
];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const part = (m, id) => m.parts.find((p) => p.id === id);

test("all standard desks own every triangle exactly once and groups contain only member references", () => {
  for (const id of IDS)
    for (const low of [false, true]) {
      const d = fresh(id),
        m = buildAssemblyModel(d, low);
      assert.equal(m.parts.length, 8);
      assert.deepEqual(
        m.groups.map((g) => g.id),
        ["legs", "feet"],
      );
      assert.equal(m.groups[0].members.length, 4);
      assert.equal(m.groups[1].members.length, 2);
      let end = 0;
      for (const p of m.parts) {
        assert.equal(p.firstVertex, end);
        end += p.vertexCount;
        assert.ok(p.bounds.size.every((n) => n > 0));
      }
      assert.equal(end * 10, m.data.length);
      [d.width, d.height, d.depth].forEach((n, k) =>
        close(m.bounds.size[k], n / 100),
      );
      const feet = m.groups.find((g) => g.id === "feet");
      close(feet.bounds.min[1], 0);
    }
});

test("group edits inherit, individual overrides survive and apply/reset have distinct history semantics", () => {
  let d = edit(fresh("work-desk"), "legs", "section", 5);
  d = edit(d, "legs.front-left", "section", 3);
  d = edit(d, "legs.front-left", "color", "#ff0000");
  d = edit(d, "legs", "section", 6);
  let p = resolveParts(d);
  assert.equal(p["legs.front-left"].section, 3);
  assert.equal(p["legs.rear-left"].section, 6);
  assert.deepEqual(
    partDescendants(d, "legs").sort(),
    DESK_LEGS.map((id) => `legs.${id}`).sort(),
  );
  const h = new History(d),
    applied = normalize(applyGroup(d, "legs"));
  h.push(applied);
  p = resolveParts(applied);
  assert.equal(p["legs.front-left"].section, 6);
  assert.equal(p["legs.front-left"].color, d.accent);
  assert.deepEqual(h.undo(), d);
  assert.deepEqual(h.redo(), applied);
  const reset = normalize(resetPart(d, "legs"));
  assert.equal(reset.parts, undefined);
});

test("measured leg sections and top thickness are independent while supports follow their feet", () => {
  let d = edit(fresh("work-desk"), "legs.front-left", "section", 3);
  d = edit(d, "legs.rear-right", "section", 6);
  d = edit(d, "feet.left", "thickness", 6);
  d = edit(d, "feet.left", "depth", 40);
  d = edit(d, "tabletop", "thickness", 8);
  const m = buildAssemblyModel(d),
    top = part(m, "tabletop");
  close(top.bounds.size[1], 0.08);
  close(part(m, "legs.front-left").bounds.size[0], 0.03);
  close(part(m, "legs.rear-right").bounds.size[2], 0.06);
  for (const id of DESK_LEGS) {
    const leg = part(m, `legs.${id}`),
      foot = part(m, id.endsWith("left") ? "feet.left" : "feet.right");
    close(leg.bounds.max[1], top.bounds.min[1]);
    assert.ok(leg.bounds.min[1] < foot.bounds.max[1]);
    assert.ok(leg.bounds.min[2] >= foot.bounds.min[2] - 1e-6);
    assert.ok(leg.bounds.max[2] <= foot.bounds.max[2] + 1e-6);
  }
  assert.deepEqual(deserialize(serialize(d)), d);
});

test("all standard desk variants remain finite and bounded at combined component and envelope extremes", () => {
  for (const id of IDS)
    for (const low of [false, true])
      for (const shape of ["round", "square"])
        for (const dims of [
          [20, 20, 4],
          [240, 240, 240],
        ]) {
          let d = normalize({
            ...fresh(id),
            width: dims[0],
            height: dims[1],
            depth: dims[2],
            shape,
          });
          for (const [part, key] of [
            ["tabletop", "thickness"],
            ["legs", "section"],
            ["legs", "inset"],
            ["feet", "width"],
            ["feet", "depth"],
            ["feet", "thickness"],
            ["rear-brace", "section"],
          ])
            d = edit(d, part, key, partLimits(d, part, key)[1]);
          const m = buildAssemblyModel(d, low);
          assert.ok(m.data.every(Number.isFinite));
          for (let i = 0; i < m.data.length; i += 10)
            close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
          [d.width, d.height, d.depth].forEach((n, k) =>
            close(m.bounds.size[k], n / 100),
          );
          if (shape === "round")
            for (const name of DESK_LEGS) {
              const b = part(m, `legs.${name}`).bounds;
              for (const x of [b.min[0], b.max[0]])
                for (const z of [b.min[2], b.max[2]])
                  assert.ok(
                    (x / (d.width / 200)) ** 2 + (z / (d.depth / 200)) ** 2 <=
                      1 + 1e-5,
                  );
            }
        }
});

test("old v1/v2/v3 desk saves without parts still open; new member schemas require a revision", () => {
  for (const id of IDS)
    for (const version of [1, 2, 3]) {
      const d = structuredClone(CATALOG.find((d) => d.id === id));
      const migrated = deserialize(
        JSON.stringify({ format: "form-studio", version, design: d }),
      );
      assert.equal(migrated.partsRevision, 1);
      assert.equal(migrated.width, d.width);
    }
  const valid = JSON.parse(serialize(fresh("work-desk")));
  for (const revision of [null, 0, 2, "1"]) {
    assert.throws(
      () =>
        deserialize(
          JSON.stringify({
            ...valid,
            design: { ...valid.design, partsRevision: revision },
          }),
        ),
      /revision/,
    );
  }
  const d = { ...valid.design, parts: { "legs.front-left": { section: 3 } } };
  delete d.partsRevision;
  assert.throws(
    () => deserialize(JSON.stringify({ ...valid, design: d })),
    /revision/,
  );
  for (const parts of [
    { "legs.unknown": { section: 3 } },
    { "legs.front-left": { inset: 2 } },
    { legs: { section: Infinity } },
    { feet: { depth: 999 } },
  ])
    assert.throws(() =>
      deserialize(
        JSON.stringify({ ...valid, design: { ...valid.design, parts } }),
      ),
    );
});

test("group highlight includes all members without altering mesh cache or unrelated geometry", () => {
  const d = fresh("work-desk"),
    m = buildAssemblyModel(d),
    v = Object.create(Viewer.prototype);
  v.selectedPart = "legs";
  const tinted = v.highlighted(m);
  assert.equal(v.highlighted(m), tinted);
  assert.notEqual(tinted, m.data);
  for (const p of m.parts) {
    const i = p.firstVertex * 10;
    assert.equal(tinted[i], m.data[i]);
    if (p.parent === "legs") assert.notEqual(tinted[i + 7], m.data[i + 7]);
    else assert.equal(tinted[i + 7], m.data[i + 7]);
  }
});

test("picking resolves an individual leg while top geometry occludes legs from above", () => {
  const d = fresh("work-desk"),
    p = resolveParts(d),
    layout = solveDesk(d, p),
    m = buildAssemblyModel(d),
    v = Object.create(Viewer.prototype);
  Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 0.06 });
  const project = (point, cam) => {
    const delta = point.map((n, i) => n - cam.target[i]),
      dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
    return [
      450 + (dot(delta, cam.x) * 600) / cam.size,
      300 - (dot(delta, cam.y) * 600) / cam.size,
    ];
  };
  let cam = v.camera(900, 600),
    xy = project([layout.sides.left.x, 0.35, layout.sides.left.z], cam);
  assert.equal(pickPart(m, cam, ...xy, 900, 600), "legs.front-left");
  v.pitch = 1.56;
  cam = v.camera(900, 600);
  xy = project([layout.sides.left.x, 0.35, layout.sides.left.z], cam);
  assert.equal(pickPart(m, cam, ...xy, 900, 600), "tabletop");
});

test("primitive extraction preserves released pedestal meshes exactly", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/pedestal-v12-hashes.json", import.meta.url),
      "utf8",
    ),
  );
  for (const [id, expected] of Object.entries(hashes))
    for (const low of [false, true])
      assert.equal(
        createHash("sha256")
          .update(Buffer.from(buildAssemblyModel(fresh(id), low).data.buffer))
          .digest("hex"),
        expected[low ? "low" : "high"],
      );
});
