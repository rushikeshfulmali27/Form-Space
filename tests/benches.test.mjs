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
} from "../public/studio/design.js";
import {
  partDefinitions,
  partLimits,
  editPart,
  resolveParts,
  applyGroup,
  resetPart,
} from "../public/studio/parts.js";
import {
  BENCH_SEAT_SLATS,
  BENCH_BACK_SLATS,
  solveBench,
} from "../public/studio/parts-benches.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
const IDS = ["garden-bench", "cafe-bench"];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const part = (m, id) => m.parts.find((p) => p.id === id);
const overlap = (a, b) =>
  [0, 1, 2].every(
    (k) => a.min[k] <= b.max[k] + 1e-6 && a.max[k] >= b.min[k] - 1e-6,
  );

test("bench limits, ownership, unit normals, exact envelopes and attachments hold at combined and mixed extremes", () => {
  for (const id of IDS)
    for (const dims of [
      [20, 20, 4],
      [240, 240, 240],
      [240, 20, 4],
      [20, 240, 240],
      [153, 87, 53],
    ])
      for (const extreme of [null, 0, 1, "mixed"])
        for (const low of [false, true]) {
          let d = normalize({
            ...fresh(id),
            width: dims[0],
            height: dims[1],
            depth: dims[2],
          });
          let index = 0;
          if (extreme !== null)
            for (const [pid, def] of Object.entries(partDefinitions(d)))
              for (const key of def.fields) {
                const limits = partLimits(d, pid, key);
                assert.ok(limits[0] <= limits[1]);
                d = edit(
                  d,
                  pid,
                  key,
                  limits[extreme === "mixed" ? index++ % 2 : extreme],
                );
              }
          const p = resolveParts(d),
            layout = solveBench(d, p),
            m = buildAssemblyModel(d, low);
          assert.ok(m.data.every(Number.isFinite));
          let end = 0;
          for (const leaf of m.parts) {
            assert.equal(leaf.firstVertex, end);
            assert.ok(leaf.vertexCount > 0);
            assert.ok(leaf.bounds.size.every((n) => n > 0));
            end += leaf.vertexCount;
          }
          assert.equal(end * 10, m.data.length);
          assert.equal(m.parts.length, id === "garden-bench" ? 15 : 10);
          dims.forEach((n, k) => close(m.bounds.size[k], n / 100));
          close(m.bounds.min[1], 0);
          for (let i = 0; i < m.data.length; i += 10)
            close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
          for (const [pid, def] of Object.entries(partDefinitions(d)))
            for (const key of def.fields) {
              const [min, max] = partLimits(d, pid, key);
              assert.ok(p[pid][key] >= min && p[pid][key] <= max);
            }
          for (const sid of BENCH_SEAT_SLATS) {
            const slat = part(m, `seat-slats.${sid}`);
            close(slat.bounds.max[1], layout.seatTop);
            close(slat.bounds.size[1], p[`seat-slats.${sid}`].thickness / 100);
            for (const side of ["left", "right"])
              assert.ok(
                overlap(slat.bounds, part(m, `bearers.${side}`).bounds),
              );
          }
          for (const [legId, leg] of Object.entries(layout.legs)) {
            const b = part(m, `legs.${legId}`).bounds,
              side = legId.endsWith("left") ? "left" : "right";
            close(b.min[1], 0);
            close(b.max[1], leg.top[1]);
            assert.ok(overlap(b, part(m, `bearers.${side}`).bounds));
          }
          if (layout.back) {
            assert.ok(layout.back.spacing >= 0);
            close(part(m, "back-slats.03").bounds.max[1], d.height / 100);
            for (const side of ["left", "right"]) {
              const support = part(m, `back-supports.${side}`);
              assert.ok(
                overlap(support.bounds, part(m, "seat-slats.01").bounds),
              );
              for (const sid of BENCH_BACK_SLATS)
                assert.ok(
                  overlap(support.bounds, part(m, `back-slats.${sid}`).bounds),
                );
            }
          }
          for (const group of m.groups)
            assert.deepEqual(
              group.members,
              m.parts.filter((p) => p.parent === group.id).map((p) => p.id),
            );
          assert.deepEqual(deserialize(serialize(d)), d);
        }
});

test("individual boards, bearers and back members retain final measurements and shared gaps", () => {
  let d = edit(fresh("garden-bench"), "seat-slats", "height", 44);
  d = edit(d, "seat-slats", "gap", 1);
  d = edit(d, "seat-slats.02", "thickness", 6);
  d = edit(d, "bearers.left", "section", 3);
  d = edit(d, "back-slats.02", "height", 7);
  d = edit(d, "back-slats.03", "thickness", 3);
  d = edit(d, "back-supports.right", "section", 4);
  const m = buildAssemblyModel(d);
  close(part(m, "seat-slats.02").bounds.size[1], 0.06);
  close(part(m, "bearers.left").bounds.size[0], 0.03);
  close(part(m, "back-slats.02").bounds.size[1], 0.07);
  close(part(m, "back-slats.03").bounds.size[2], 0.03);
  close(part(m, "back-supports.right").bounds.size[0], 0.04);
  close(
    part(m, "seat-slats.02").bounds.min[2] -
      part(m, "seat-slats.01").bounds.max[2],
    0.01,
  );
  close(part(m, "seat-slats.01").bounds.max[1], 0.44);
  const cafe = buildAssemblyModel(fresh("cafe-bench"));
  assert.ok(!cafe.parts.some((p) => p.id.startsWith("back")));
  assert.ok(
    !partDefinitions(fresh("cafe-bench"))["seat-slats"].fields.includes(
      "height",
    ),
  );
});

test("bench groups preserve member overrides and apply/reset/undo have exact save semantics", () => {
  for (const id of IDS) {
    let d = edit(fresh(id), "seat-slats", "thickness", 3);
    d = edit(d, "seat-slats.02", "thickness", 5);
    d = edit(d, "seat-slats.02", "material", "metal");
    d = edit(d, "seat-slats", "thickness", 4);
    assert.equal(resolveParts(d)["seat-slats.02"].thickness, 5);
    assert.equal(resolveParts(d)["seat-slats.01"].thickness, 4);
    const h = new History(d);
    h.push(normalize(applyGroup(d, "seat-slats")));
    assert.equal(resolveParts(h.current)["seat-slats.02"].thickness, 4);
    assert.deepEqual(h.undo(), d);
    assert.deepEqual(deserialize(serialize(d)), d);
    assert.equal(normalize(resetPart(d, "seat-slats")).parts, undefined);
  }
});

test("legacy bench files migrate; invalid revisions, topology and unsupported café-back settings fail", () => {
  const fixtures = JSON.parse(
    readFileSync(
      new URL("./fixtures/benches-whole-object-legacy.json", import.meta.url),
    ),
  );
  assert.equal(fixtures.length, 6);
  for (const file of fixtures) {
    const d = deserialize(JSON.stringify(file));
    assert.equal(d.partsRevision, 1);
    for (const key of [
      "id",
      "width",
      "height",
      "depth",
      "color",
      "accent",
      "material",
    ])
      assert.equal(d[key], file.design[key]);
  }
  for (const id of IDS)
    for (const patch of [
      { partsRevision: 2 },
      { partsRevision: null },
      { parts: { "seat-slats.05": { thickness: 3 } } },
      { parts: { "seat-slats.01": { gap: 1 } } },
      { parts: { "seat-slats": { thickness: 999 } } },
      { parts: { legs: { section: "3" } } },
      { partsRevision: undefined, parts: { legs: { section: 3 } } },
    ]) {
      const file = JSON.parse(serialize(fresh(id)));
      Object.assign(file.design, patch);
      assert.throws(() => deserialize(JSON.stringify(file)));
    }
  const cafe = JSON.parse(serialize(fresh("cafe-bench")));
  cafe.design.parts = { "back-slats.01": { height: 4 } };
  assert.throws(() => deserialize(JSON.stringify(cafe)), /Invalid part/);
});

test("shared post extraction preserves all nineteen released v1.5 meshes byte-for-byte", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/released-v15-hashes.json", import.meta.url),
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
