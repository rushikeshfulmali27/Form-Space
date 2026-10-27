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
  parsePrompt,
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
  OFFICE_SLOTS,
  solveOfficeChair,
} from "../public/studio/parts-office-chair.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const part = (m, id) => m.parts.find((p) => p.id === id);
const overlap = (a, b) =>
  [0, 1, 2].every(
    (k) => a.min[k] <= b.max[k] + 1e-6 && a.max[k] >= b.min[k] - 1e-6,
  );

test("office-chair controls, exact bounds, ownership, normals and connections hold at combined/mixed limits", () => {
  for (const size of [
    [20, 20, 4],
    [240, 240, 240],
    [240, 20, 4],
    [20, 240, 240],
    [67, 117, 53],
  ])
    for (const extreme of [null, 0, 1, "mixed"])
      for (const low of [false, true]) {
        let d = normalize({
            ...fresh("office-chair"),
            width: size[0],
            height: size[1],
            depth: size[2],
          }),
          index = 0;
        if (extreme !== null)
          for (const [id, def] of Object.entries(partDefinitions(d)))
            for (const key of def.fields) {
              const limits = partLimits(d, id, key);
              assert.ok(limits[0] <= limits[1]);
              d = edit(
                d,
                id,
                key,
                limits[extreme === "mixed" ? index++ % 2 : extreme],
              );
            }
        const p = resolveParts(d),
          s = solveOfficeChair(d, p),
          m = buildAssemblyModel(d, low);
        assert.ok(m.data.every(Number.isFinite));
        assert.equal(m.parts.length, 17);
        assert.equal(m.groups.length, 4);
        size.forEach((n, k) => close(m.bounds.size[k], n / 100));
        close(m.bounds.min[1], 0);
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
        for (const [id, def] of Object.entries(partDefinitions(d)))
          for (const key of def.fields) {
            const [min, max] = partLimits(d, id, key);
            assert.ok(p[id][key] >= min && p[id][key] <= max);
          }
        const seat = part(m, "seat"),
          back = part(m, "back"),
          column = part(m, "column");
        close(seat.bounds.max[1], s.seatTop);
        close(column.bounds.max[1], seat.bounds.min[1]);
        close(column.bounds.size[0], p.column.diameter / 100);
        assert.ok(overlap(seat.bounds, back.bounds));
        close(back.bounds.max[1], d.height / 100);
        for (const slot of s.slots) {
          const caster = part(m, `casters.${slot.id}`),
            spoke = part(m, `star-base.${slot.id}`);
          close(caster.bounds.min[1], 0);
          close(caster.bounds.size[0], slot.r * 2);
          close(caster.bounds.size[1], slot.height);
          assert.ok(spoke.bounds.min[1] >= 0);
          assert.ok(overlap(spoke.bounds, caster.bounds));
          assert.ok(overlap(spoke.bounds, column.bounds));
          // Measure each vertical end section, independently of the sloped mesh bounds.
          for (const offset of [0, 6]) {
            const points = Array.from({ length: 6 }, (_, i) =>
              Array.from(
                m.data.slice(
                  (spoke.firstVertex + offset + i) * 10,
                  (spoke.firstVertex + offset + i) * 10 + 3,
                ),
              ),
            );
            close(
              Math.max(...points.map((v) => v[1])) -
                Math.min(...points.map((v) => v[1])),
              slot.section,
            );
            const nx = -slot.z / Math.hypot(slot.x, slot.z),
              nz = slot.x / Math.hypot(slot.x, slot.z),
              across = points.map((v) => v[0] * nx + v[2] * nz);
            close(Math.max(...across) - Math.min(...across), slot.section);
          }
        }
        for (const side of ["left", "right"]) {
          const arm = part(m, `armrests.${side}`),
            support = part(m, `arm-supports.${side}`);
          assert.ok(overlap(arm.bounds, support.bounds));
          assert.ok(overlap(support.bounds, seat.bounds));
          close(arm.bounds.max[1], p[`armrests.${side}`].height / 100);
        }
        for (const group of m.groups)
          assert.deepEqual(
            group.members,
            m.parts.filter((p) => p.parent === group.id).map((p) => p.id),
          );
        assert.deepEqual(deserialize(serialize(d)), d);
      }
});

test("five angular slots retain identity through caster, spoke, inset and seat edits", () => {
  let d = edit(fresh("office-chair"), "casters.03", "diameter", 7);
  d = edit(d, "star-base.02", "section", 4);
  d = edit(d, "star-base", "inset", 3);
  d = edit(d, "seat", "height", 55);
  d = edit(d, "seat", "thickness", 8);
  const s = solveOfficeChair(d, resolveParts(d)),
    m = buildAssemblyModel(d);
  assert.deepEqual(
    s.slots.map((x) => x.id),
    OFFICE_SLOTS,
  );
  s.slots.forEach((slot, i) => close(slot.angle, (i * Math.PI * 2) / 5));
  close(part(m, "casters.03").bounds.size[0], 0.07);
  close(part(m, "seat").bounds.size[1], 0.08);
  close(part(m, "column").bounds.max[1], 0.47);
  assert.equal(resolveParts(d)["star-base.02"].section, 4);
  const before = solveOfficeChair(
    fresh("office-chair"),
    resolveParts(fresh("office-chair")),
  );
  assert.ok(s.slots[0].x < before.slots[0].x);
});

test("office-chair group/member apply, reset, history and export preserve independent settings", () => {
  for (const [group, member, key, a, b] of [
    ["casters", "casters.04", "diameter", 4, 6],
    ["star-base", "star-base.02", "section", 2, 3],
    ["armrests", "armrests.left", "height", 72, 80],
  ]) {
    let d = edit(fresh("office-chair"), group, key, a);
    d = edit(d, member, key, b);
    d = edit(d, member, "material", "walnut");
    assert.equal(resolveParts(d)[member][key], b);
    const h = new History(d);
    h.push(normalize(applyGroup(d, group)));
    assert.equal(resolveParts(h.current)[member][key], a);
    assert.deepEqual(h.undo(), d);
    assert.deepEqual(deserialize(serialize(d)), d);
    assert.equal(normalize(resetPart(d, group)).parts, undefined);
  }
});

test("historical office-chair files migrate, invalid member/revision/construction data does not", () => {
  const fixtures = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/office-chair-whole-object-legacy.json",
        import.meta.url,
      ),
    ),
  );
  assert.equal(fixtures.length, 3);
  for (const file of fixtures) {
    const d = deserialize(JSON.stringify(file));
    assert.equal(d.partsRevision, 1);
    for (const key of [
      "id",
      "width",
      "height",
      "depth",
      "material",
      "color",
      "accent",
    ])
      assert.equal(d[key], file.design[key]);
  }
  for (const patch of [
    { partsRevision: 2 },
    { partsRevision: null },
    { partsRevision: undefined, parts: { column: { diameter: 4 } } },
    { parts: { "casters.06": { diameter: 4 } } },
    { parts: { "star-base.01": { inset: 2 } } },
    { parts: { casters: { diameter: 999 } } },
    { parts: { column: { diameter: "3" } } },
    { construction: { casterCount: 6 } },
  ]) {
    const file = JSON.parse(serialize(fresh("office-chair")));
    Object.assign(file.design, patch);
    assert.throws(() => deserialize(JSON.stringify(file)));
  }
});

test("R5 preserves all twenty-three released v1.7 meshes byte-for-byte", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/released-v17-hashes.json", import.meta.url),
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
test("caster and spoke dimension language directs users to parts instead of changing the whole chair", () => {
  for (const prompt of [
    "caster width 4 cm",
    "wheel height 4 cm",
    "spoke section 2 cm",
  ]) {
    const d = fresh("office-chair"),
      result = parsePrompt(prompt, d);
    assert.deepEqual(result.design, d);
    assert.match(result.warnings.join(" "), /Individual parts/);
  }
});
