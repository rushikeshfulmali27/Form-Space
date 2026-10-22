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
  SEATING_LEGS,
  STRETCHERS,
  solveSeating,
} from "../public/studio/parts-seating.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
const IDS = [
  "lounge-chair",
  "meeting-chair",
  "dining-chair",
  "visitor-chair",
  "outdoor-chair",
  "bar-stool",
  "breakfast-stool",
];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const part = (m, id) => m.parts.find((p) => p.id === id);
const dims = [
  [20, 20, 4],
  [240, 240, 240],
  [240, 20, 4],
  [20, 240, 240],
  [53, 87, 47],
];

test("seating models own every triangle, preserve their envelope and have feasible controls at combined limits", () => {
  for (const id of IDS)
    for (const size of dims)
      for (const bound of [null, 0, 1])
        for (const low of [false, true])
          for (const shape of fresh(id).shape
            ? ["round", "square"]
            : [undefined]) {
            let d = normalize({
              ...fresh(id),
              width: size[0],
              height: size[1],
              depth: size[2],
              ...(shape ? { shape } : {}),
            });
            if (bound !== null)
              for (const [id, def] of Object.entries(partDefinitions(d)))
                for (const key of def.fields) {
                  const limits = partLimits(d, id, key);
                  assert.ok(limits[0] <= limits[1]);
                  d = edit(d, id, key, limits[bound]);
                }
            const p = resolveParts(d);
            for (const [id, def] of Object.entries(partDefinitions(d)))
              for (const key of def.fields) {
                const [min, max] = partLimits(d, id, key);
                assert.ok(
                  p[id][key] >= min && p[id][key] <= max,
                  `${d.id} ${id}.${key}: ${p[id][key]} outside ${min}–${max}`,
                );
              }
            const m = buildAssemblyModel(d, low);
            assert.ok(m.data.every(Number.isFinite));
            let end = 0;
            for (const leaf of m.parts) {
              assert.equal(leaf.firstVertex, end);
              assert.ok(leaf.vertexCount > 0);
              assert.ok(leaf.bounds.size.every((n) => n > 0));
              end += leaf.vertexCount;
            }
            assert.equal(end * 10, m.data.length);
            size.forEach((n, k) => close(m.bounds.size[k], n / 100));
            close(m.bounds.min[1], 0);
            for (let i = 0; i < m.data.length; i += 10)
              close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
            for (const group of m.groups)
              assert.deepEqual(
                group.members,
                m.parts.filter((p) => p.parent === group.id).map((p) => p.id),
              );
            assert.deepEqual(deserialize(serialize(d)), d);
          }
});

test("chair seat edits move leg ends, backs stay attached, and each arm support follows its member", () => {
  for (const id of IDS.filter((id) => !id.includes("stool"))) {
    let d = edit(fresh(id), "seat", "height", fresh(id).height * 0.5);
    d = edit(d, "seat", "thickness", 4);
    if (partDefinitions(d).armrests) {
      d = edit(d, "armrests.left", "height", d.height * 0.75);
      d = edit(d, "armrests.right", "section", 2);
    }
    const p = resolveParts(d),
      m = buildAssemblyModel(d),
      seat = part(m, "seat");
    close(seat.bounds.max[1], p.seat.height / 100);
    for (const name of SEATING_LEGS) {
      const leg = part(m, `legs.${name}`);
      close(leg.bounds.min[1], 0);
      close(leg.bounds.max[1], seat.bounds.min[1]);
    }
    for (const b of m.parts.filter(
      (p) => p.id === "back" || p.parent === "back-slats",
    )) {
      close(b.bounds.max[1], d.height / 100);
      close(b.bounds.min[1], seat.bounds.min[1]);
      assert.ok(b.bounds.max[2] > seat.bounds.min[2]);
    }
    if (p.armrests)
      for (const side of ["left", "right"]) {
        const arm = part(m, `armrests.${side}`),
          support = part(m, `arm-supports.${side}`);
        close(arm.bounds.max[1], p[`armrests.${side}`].height / 100);
        assert.ok(support.bounds.min[1] < seat.bounds.max[1]);
        assert.ok(support.bounds.max[1] > arm.bounds.min[1]);
        assert.ok(support.bounds.max[1] < arm.bounds.max[1]);
      }
  }
});

test("stool stretchers intersect their slanted legs at the shared height and round seats cover leg anchors", () => {
  for (const id of ["bar-stool", "breakfast-stool"])
    for (const shape of ["round", "square"]) {
      let d = normalize({ ...fresh(id), shape });
      d = edit(d, "stretchers", "height", d.height * 0.4);
      d = edit(d, "legs.front-left", "section", 3);
      const p = resolveParts(d),
        s = solveSeating(d, p),
        m = buildAssemblyModel(d),
        y = p.stretchers.height / 100;
      for (const name of STRETCHERS) {
        const b = part(m, `stretchers.${name}`).bounds;
        close((b.min[1] + b.max[1]) / 2, y);
      }
      const pairs = {
        front: ["front-left", "front-right"],
        rear: ["rear-left", "rear-right"],
        left: ["front-left", "rear-left"],
        right: ["front-right", "rear-right"],
      };
      for (const [name, names] of Object.entries(pairs))
        for (const leg of names) {
          const a = s.legs[leg],
            ratio = y / s.seatBottom,
            x = a.bottom[0] + (a.top[0] - a.bottom[0]) * ratio,
            z = a.bottom[2] + (a.top[2] - a.bottom[2]) * ratio,
            b = part(m, `stretchers.${name}`).bounds;
          assert.ok(x >= b.min[0] && x <= b.max[0]);
          assert.ok(z >= b.min[2] && z <= b.max[2]);
        }
      if (shape === "round")
        for (const leg of Object.values(s.legs))
          for (const x of [-1, 1])
            for (const z of [-1, 1])
              assert.ok(
                ((leg.top[0] + (x * leg.section) / 2) / (d.width / 200)) ** 2 +
                  ((leg.top[2] + (z * leg.section) / 2) / (d.depth / 200)) **
                    2 <=
                  1,
              );
    }
});

test("outdoor back keeps five stable slats and armless chairs cannot acquire arm controls", () => {
  let d = edit(fresh("outdoor-chair"), "back-slats", "gap", 1);
  d = edit(d, "back-slats.03", "material", "metal");
  const m = buildAssemblyModel(d),
    a = part(m, "back-slats.01"),
    b = part(m, "back-slats.02");
  close(b.bounds.min[0] - a.bounds.max[0], 0.01);
  assert.equal(m.parts.filter((p) => p.parent === "back-slats").length, 5);
  assert.equal(resolveParts(d)["back-slats.03"].material, "metal");
  assert.ok(partDefinitions(d).armrests);
  for (const id of ["dining-chair", "visitor-chair"]) {
    assert.ok(!partDefinitions(fresh(id)).armrests);
    assert.ok(
      !buildAssemblyModel(fresh(id)).parts.some((p) => p.id.startsWith("arm")),
    );
    const file = JSON.parse(serialize(fresh(id)));
    file.design.parts = { "armrests.left": { height: 50 } };
    assert.throws(() => deserialize(JSON.stringify(file)), /Invalid part/);
  }
});

test("seating groups preserve custom members, apply/reset and semantic history round-trip", () => {
  for (const id of IDS) {
    let d = edit(fresh(id), "legs", "section", 2);
    d = edit(d, "legs.front-left", "section", 1);
    d = edit(d, "legs.front-left", "material", "metal");
    d = edit(d, "legs", "section", 3);
    assert.equal(resolveParts(d)["legs.front-left"].section, 1);
    assert.equal(resolveParts(d)["legs.rear-left"].section, 3);
    const h = new History(d);
    h.push(normalize(applyGroup(d, "legs")));
    assert.equal(resolveParts(h.current)["legs.front-left"].section, 3);
    assert.deepEqual(h.undo(), d);
    assert.deepEqual(deserialize(serialize(d)), d);
    assert.equal(normalize(resetPart(d, "legs")).parts, undefined);
  }
});

test("legacy seating exports migrate and malformed revisions or member settings never import", () => {
  const fixtures = JSON.parse(
    readFileSync(
      new URL("./fixtures/seating-whole-object-legacy.json", import.meta.url),
    ),
  );
  assert.equal(fixtures.length, 21);
  for (const file of fixtures) {
    const migrated = deserialize(JSON.stringify(file));
    assert.equal(migrated.partsRevision, 1);
    for (const key of [
      "id",
      "width",
      "height",
      "depth",
      "shape",
      "color",
      "accent",
      "material",
    ])
      assert.equal(migrated[key], file.design[key]);
  }
  for (const id of IDS) {
    for (const patch of [
      { partsRevision: 2 },
      { partsRevision: null },
      { parts: { "legs.unknown": { section: 1 } } },
      { parts: { seat: { thickness: 999 } } },
      { parts: { legs: { section: "3" } } },
      { parts: { legs: { section: null } } },
      { partsRevision: undefined, parts: { legs: { section: 2 } } },
    ]) {
      const valid = JSON.parse(serialize(fresh(id)));
      Object.assign(valid.design, patch);
      assert.throws(() => deserialize(JSON.stringify(valid)));
    }
  }
});

test("all twelve released v1.4 meshes remain unchanged", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/released-v14-hashes.json", import.meta.url),
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
test("component dimension language directs seating users to the parts inspector", () => {
  for (const prompt of [
    "seat height 40 cm",
    "armrest height 60 cm",
    "stretcher height 20 cm",
  ]) {
    const d = fresh("lounge-chair"),
      result = parsePrompt(prompt, d);
    assert.deepEqual(result.design, d);
    assert.match(result.warnings.join(" "), /Individual parts/);
  }
});
