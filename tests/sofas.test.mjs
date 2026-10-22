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
  diff,
  parsePrompt,
} from "../public/studio/design.js";
import {
  partDefinitions,
  partLimits,
  editPart,
  resolveParts,
  applyGroup,
  resetPart,
  reconcilePartSelection,
} from "../public/studio/parts.js";
import { setConstruction } from "../public/studio/construction.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
const IDS = ["sofa", "reception-sofa"];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const part = (m, id) => m.parts.find((p) => p.id === id);
const overlap = (a, b) =>
  [0, 1, 2].every(
    (k) => a.min[k] <= b.max[k] + 1e-6 && a.max[k] >= b.min[k] - 1e-6,
  );

test("sofas have exact bounds, finite unit normals, complete ownership and attached members at count/dimension extremes", () => {
  for (const id of IDS)
    for (const size of [
      [20, 20, 4],
      [240, 240, 240],
      [240, 20, 4],
      [20, 240, 240],
      [191, 83, 77],
    ])
      for (const count of [1, 2, 3, 4])
        for (const extreme of [null, 0, 1, "mixed"])
          for (const low of [false, true]) {
            let d = normalize(
              setConstruction(
                {
                  ...fresh(id),
                  width: size[0],
                  height: size[1],
                  depth: size[2],
                },
                "cushionCount",
                count,
              ),
            );
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
              m = buildAssemblyModel(d, low);
            assert.ok(m.data.every(Number.isFinite));
            size.forEach((n, k) => close(m.bounds.size[k], n / 100));
            close(m.bounds.min[1], 0);
            assert.equal(
              m.parts.filter((p) => p.parent === "cushions").length,
              count,
            );
            let end = 0;
            for (const leaf of m.parts) {
              assert.equal(leaf.firstVertex, end);
              assert.ok(leaf.vertexCount > 0);
              assert.ok(leaf.bounds.size.every((n) => n > 0));
              end += leaf.vertexCount;
            }
            assert.equal(end * 10, m.data.length);
            for (let i = 0; i < m.data.length; i += 10)
              close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
            for (const [pid, def] of Object.entries(partDefinitions(d)))
              for (const key of def.fields) {
                const [min, max] = partLimits(d, pid, key);
                assert.ok(p[pid][key] >= min && p[pid][key] <= max);
              }
            const base = part(m, "base");
            for (const leaf of m.parts.filter((p) => p.parent === "cushions")) {
              close(leaf.bounds.min[1], base.bounds.max[1]);
              close(leaf.bounds.size[1], p[leaf.id].thickness / 100);
              assert.ok(overlap(leaf.bounds, part(m, "back").bounds));
            }
            for (const leaf of m.parts.filter((p) => p.parent === "legs")) {
              close(leaf.bounds.min[1], 0);
              assert.ok(overlap(leaf.bounds, base.bounds));
            }
            for (const side of ["left", "right"])
              assert.ok(overlap(part(m, `arms.${side}`).bounds, base.bounds));
            assert.deepEqual(deserialize(serialize(d)), d);
          }
});

test("count changes preserve surviving slots, prune removed overrides, re-add defaults and undo exact snapshots", () => {
  let d = normalize(setConstruction(fresh("sofa"), "cushionCount", 4));
  d = edit(d, "cushions.01", "color", "#ff0000");
  d = edit(d, "cushions.04", "thickness", 10);
  d = edit(d, "cushions.04", "material", "metal");
  const old = structuredClone(d),
    h = new History(d),
    reduced = normalize(setConstruction(d, "cushionCount", 2));
  assert.ok(!Object.hasOwn(partDefinitions(reduced), "cushions.04"));
  assert.equal(reduced.parts["cushions.04"], undefined);
  assert.equal(reduced.parts["cushions.01"].color, "#ff0000");
  h.push(reduced);
  assert.equal(h.index, 1);
  assert.deepEqual(h.undo(), old);
  assert.deepEqual(h.redo(), reduced);
  const added = normalize(setConstruction(reduced, "cushionCount", 4));
  assert.equal(added.parts["cushions.04"], undefined);
  assert.equal(resolveParts(added)["cushions.04"].material, added.material);
  assert.equal(added.parts["cushions.01"].color, "#ff0000");
  h.undo();
  h.push(added);
  assert.equal(h.canRedo, false);
  assert.ok(diff(old, reduced).some((c) => c.key === "Cushion count"));
  assert.ok(
    diff(old, reduced).some(
      (c) => c.key === "Cushion 04 material" && c.after === "Removed",
    ),
  );
});

test("selection keeps surviving leaves, falls back from removed slots and clears between objects", () => {
  const old = normalize(setConstruction(fresh("sofa"), "cushionCount", 4)),
    next = normalize(setConstruction(old, "cushionCount", 2)),
    a = partDefinitions(old),
    b = partDefinitions(next);
  assert.equal(reconcilePartSelection("cushions.01", a, b), "cushions.01");
  assert.equal(reconcilePartSelection("cushions.04", a, b), "cushions");
  assert.equal(reconcilePartSelection("cushions", a, b), "cushions");
  assert.equal(reconcilePartSelection("cushions.01", a, b, false), null);
});

test("width edits preserve explicit count across the legacy threshold, while original legacy layouts migrate", () => {
  const fixtures = JSON.parse(
    readFileSync(
      new URL("./fixtures/sofas-whole-object-legacy.json", import.meta.url),
    ),
  );
  assert.equal(fixtures.length, 6);
  for (const file of fixtures) {
    const migrated = deserialize(JSON.stringify(file));
    assert.equal(
      migrated.construction.cushionCount,
      file.design.width > 190 ? 3 : 2,
    );
    for (const key of [
      "width",
      "height",
      "depth",
      "color",
      "accent",
      "material",
    ])
      assert.equal(migrated[key], file.design[key]);
  }
  for (const width of [190, 190.4, 191])
    for (const version of [1, 2, 3]) {
      const d = deserialize(
        JSON.stringify({
          format: "form-studio",
          version,
          design: { id: "sofa", width },
        }),
      );
      assert.equal(d.construction.cushionCount, width > 190 ? 3 : 2);
      assert.equal(
        normalize({ ...d, width: width > 190 ? 180 : 220 }).construction
          .cushionCount,
        width > 190 ? 3 : 2,
      );
    }
});

test("construction imports reject malformed, future, unsupported and inactive member data", () => {
  const valid = JSON.parse(serialize(fresh("sofa")));
  for (const construction of [
    null,
    [],
    {},
    3,
    { cushionCount: 0 },
    { cushionCount: 5 },
    { cushionCount: 2.5 },
    { cushionCount: "2" },
    { cushionCount: 2, future: 1 },
  ])
    assert.throws(
      () =>
        deserialize(
          JSON.stringify({
            ...valid,
            design: { ...valid.design, construction },
          }),
        ),
      /construction/i,
    );
  for (const revision of [undefined, null, 2])
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
  const absent = structuredClone(valid);
  delete absent.design.construction;
  assert.throws(() => deserialize(JSON.stringify(absent)), /construction/i);
  const inactive = structuredClone(valid);
  inactive.design.construction.cushionCount = 1;
  inactive.design.parts = { "cushions.04": { thickness: 5 } };
  assert.throws(() => deserialize(JSON.stringify(inactive)), /Invalid part/);
  for (const id of ["bookshelf", "work-desk"])
    assert.throws(
      () =>
        deserialize(
          JSON.stringify({
            format: "form-studio",
            version: 3,
            design: { ...fresh(id), construction: { cushionCount: 2 } },
          }),
        ),
      /construction/i,
    );
  for (const version of [1, 2])
    assert.throws(
      () => deserialize(JSON.stringify({ ...valid, version })),
      /version-3/,
    );
  assert.throws(
    () => setConstruction(fresh("sofa"), "constructor", 2),
    /Unsupported/,
  );
});

test("cushion groups inherit, reset and apply without changing active membership", () => {
  let d = edit(fresh("sofa"), "cushions", "thickness", 8);
  d = edit(d, "cushions.02", "thickness", 10);
  d = edit(d, "cushions", "thickness", 9);
  assert.equal(resolveParts(d)["cushions.02"].thickness, 10);
  assert.equal(resolveParts(d)["cushions.01"].thickness, 9);
  assert.equal(
    resolveParts(normalize(applyGroup(d, "cushions")))["cushions.02"].thickness,
    9,
  );
  const reset = normalize(resetPart(d, "cushions"));
  assert.equal(reset.parts, undefined);
  assert.deepEqual(reset.construction, d.construction);
});

test("T0 leaves all twenty-one released v1.6 meshes unchanged", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/released-v16-hashes.json", import.meta.url),
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
test("cushion count and dimension prompts use the inspector instead of changing whole-object values", () => {
  for (const prompt of [
    "cushion count 4",
    "cushion height 10 cm",
    "arm width 6 cm",
  ]) {
    const d = fresh("sofa"),
      result = parsePrompt(prompt, d);
    assert.deepEqual(result.design, d);
    assert.match(result.warnings.join(" "), /Individual parts/);
  }
});
