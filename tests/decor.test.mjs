import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  CATALOG,
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
  resolveParts,
  editPart,
  resetPart,
  applyGroup,
} from "../public/studio/parts.js";
import { supportedPartObjects } from "../public/studio/parts-registry.js";
import {
  FINAL_OBJECTS,
  solveDecor,
  decorDefinitions,
  VASE_PROFILE,
} from "../public/studio/parts-decor.js";
import { buildModel, buildAssemblyModel } from "../public/studio/geometry.js";
import { pickPart } from "../public/studio/picking.js";
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"),
  );
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const overlap = (a, b) =>
  [0, 1, 2].every(
    (k) => a.min[k] <= b.max[k] + 1e-6 && a.max[k] >= b.min[k] - 1e-6,
  );
const leaf = (m, id) => m.parts.find((p) => p.id === id).bounds;
for (const object of FINAL_OBJECTS)
  test(`${object}: final fields, bounds, ownership and attachments at mixed/combined limits`, () => {
    for (const size of [
      null,
      [20, 20, 4],
      [240, 240, 240],
      [240, 20, 4],
      [20, 240, 240],
    ])
      for (const extreme of [null, 0, 1, "mixed"])
        for (const low of [false, true]) {
          let d = size
              ? normalize({
                  ...fresh(object),
                  width: size[0],
                  height: size[1],
                  depth: size[2],
                })
              : fresh(object),
            i = 0;
          if (extreme !== null)
            for (const [id, definition] of Object.entries(partDefinitions(d)))
              for (const key of definition.fields) {
                const limits = partLimits(d, id, key);
                assert.ok(limits[0] <= limits[1]);
                d = edit(
                  d,
                  id,
                  key,
                  limits[extreme === "mixed" ? i++ % 2 : extreme],
                );
              }
          const p = resolveParts(d),
            defs = partDefinitions(d),
            m = buildAssemblyModel(d, low);
          assert.ok(m.data.every(Number.isFinite));
          [d.width, d.height, d.depth].forEach((n, k) =>
            close(m.bounds.size[k], n / 100),
          );
          close(m.bounds.min[1], 0);
          assert.deepEqual(
            m.parts.map((p) => p.id).sort(),
            Object.keys(defs)
              .filter((id) => !defs[id].group)
              .sort(),
          );
          let end = 0;
          for (const part of m.parts) {
            assert.equal(part.firstVertex, end);
            end += part.vertexCount;
            assert.ok(part.vertexCount > 0 && part.vertexCount % 3 === 0);
            assert.ok(part.bounds.size.every((n) => n > 0));
            for (const key of defs[part.id].fields) {
              const [min, max] = partLimits(d, part.id, key);
              assert.ok(p[part.id][key] >= min && p[part.id][key] <= max);
              if (["width", "depth", "height", "diameter"].includes(key)) {
                const axis = key === "height" ? 1 : key === "depth" ? 2 : 0;
                close(part.bounds.size[axis], p[part.id][key] / 100);
              }
              if (key === "thickness") {
                const axis =
                  (["mount", "frame", "surface", "panel"].includes(part.id) ||
                    part.id.startsWith("slats.")) &&
                  object !== "pendant-lamp"
                    ? 2
                    : part.id === "return"
                      ? 0
                      : 1;
                if (part.id !== "mount" || object !== "chandelier")
                  close(part.bounds.size[axis], p[part.id][key] / 100);
                else close(part.bounds.size[1], p[part.id][key] / 100);
              }
              if (key === "section" && part.id !== "frame") {
                const shape =
                  object !== "pendant-lamp"
                    ? solveDecor(d, p).find((s) => s.id === part.id)
                    : null;
                if (shape?.kind === "post") {
                  for (const offset of [0, 6])
                    for (const axis of [0, 2]) {
                      const values = Array.from(
                        { length: 6 },
                        (_, i) =>
                          m.data[(part.firstVertex + offset + i) * 10 + axis],
                      );
                      close(
                        Math.max(...values) - Math.min(...values),
                        p[part.id][key] / 100,
                      );
                    }
                } else
                  close(
                    part.bounds.size[part.id === "brace" ? 1 : 0],
                    p[part.id][key] / 100,
                  );
              }
            }
          }
          assert.equal(end * 10, m.data.length);
          for (let v = 0; v < m.data.length; v += 10)
            close(Math.hypot(...m.data.slice(v + 3, v + 6)), 1);
          const reached = new Set(
            m.parts.filter((p) => p.bounds.min[1] < 1e-6).map((p) => p.id),
          );
          let changed = true;
          while (changed) {
            changed = false;
            for (const part of m.parts)
              if (
                !reached.has(part.id) &&
                m.parts.some(
                  (other) =>
                    reached.has(other.id) && overlap(part.bounds, other.bounds),
                )
              ) {
                reached.add(part.id);
                changed = true;
              }
          }
          assert.equal(
            reached.size,
            m.parts.length,
            `${object}: disconnected ${m.parts.filter((p) => !reached.has(p.id)).map((p) => p.id)}`,
          );
          if (defs.surface) {
            const f = leaf(m, "frame"),
              s = leaf(m, "surface"),
              b = p.frame.section / 100;
            close(s.size[0], f.size[0] - 2 * b);
            close(s.size[1], f.size[1] - 2 * b);
            assert.ok(s.min[2] >= f.min[2] - 1e-6);
            close(s.max[2], f.max[2]);
          }
          if (object === "decorative-partition") {
            const slats = m.parts.filter((p) => p.parent === "slats");
            assert.equal(slats.length, 9);
            for (let n = 1; n < 9; n++)
              close(
                slats[n].bounds.min[0] - slats[n - 1].bounds.max[0],
                p.slats.gap / 100,
              );
            for (const slat of slats) {
              assert.ok(overlap(slat.bounds, leaf(m, "base-rail")));
              close(slat.bounds.min[1], leaf(m, "base-rail").max[1]);
            }
          }
          if (object === "fitting-room-partition")
            close(leaf(m, "panel").min[0], leaf(m, "return").max[0]);
          if (["planter", "hanging-planter"].includes(object)) {
            assert.ok(leaf(m, "soil").max[1] < leaf(m, "pot").max[1]);
            for (const slot of ["01", "02", "03", "04", "05"]) {
              assert.ok(overlap(leaf(m, `stems.${slot}`), leaf(m, "soil")));
              assert.ok(
                overlap(leaf(m, `stems.${slot}`), leaf(m, `leaves.${slot}`)),
              );
            }
            if (object === "hanging-planter")
              for (const slot of ["01", "02", "03"]) {
                close(leaf(m, `suspension.${slot}`).max[1], d.height / 100);
                assert.ok(
                  overlap(leaf(m, `suspension.${slot}`), leaf(m, "pot")),
                );
              }
          }
          if (object === "decorative-sculpture") {
            assert.ok(overlap(leaf(m, "lower"), leaf(m, "base")));
            assert.ok(overlap(leaf(m, "upper"), leaf(m, "lower")));
            const a = leaf(m, "lower"),
              b = leaf(m, "upper"),
              point = [
                (d.width * 0.04) / 100,
                (Math.max(a.min[1], b.min[1]) + Math.min(a.max[1], b.max[1])) /
                  2,
                0,
              ];
            for (const bounds of [a, b])
              assert.ok(
                point.reduce(
                  (sum, n, k) =>
                    sum +
                    ((n - (bounds.min[k] + bounds.max[k]) / 2) /
                      (bounds.size[k] / 2)) **
                      2,
                  0,
                ) < 1,
              );
          }
          assert.deepEqual(deserialize(serialize(d)), d);
        }
  });
test("all 72 catalog IDs are enabled once; only unknown IDs remain unsupported", () => {
  assert.equal(supportedPartObjects.length, 72);
  assert.deepEqual(
    [...supportedPartObjects].sort(),
    CATALOG.map((d) => d.id).sort(),
  );
  for (const id of FINAL_OBJECTS) {
    const d = fresh(id);
    assert.equal(d.partsRevision, 1);
    assert.ok(Object.keys(partDefinitions(d)).length);
  }
});
test("frames have open centers; soil fits an open pot and slat gaps stay unselectable", () => {
  for (const id of [
    "mirror",
    "mirror-stand",
    "whiteboard-stand",
    "menu-stand",
    "signboard",
  ]) {
    const d = fresh(id),
      p = resolveParts(d),
      shapes = solveDecor(d, p).filter((s) => s.id === "frame");
    assert.equal(shapes.length, 4);
    for (const s of shapes)
      assert.ok(s.size[0] === p.frame.section || s.size[1] === p.frame.section);
  }
  for (const id of ["planter", "hanging-planter"]) {
    const d = fresh(id),
      p = resolveParts(d),
      shapes = solveDecor(d, p),
      pot = shapes.find((s) => s.id === "pot"),
      soil = shapes.find((s) => s.id === "soil");
    assert.equal(pot.kind, "lathe");
    assert.ok(pot.profile.some((q) => q[0] === 1 && q[1] < 1));
    assert.ok(soil.size[0] < p.pot.width);
    assert.ok(soil.size[2] < p.pot.depth);
  }
  for (const low of [false, true])
    for (const boundary of [0, 1]) {
      let d = fresh("decorative-partition");
      d = edit(d, "slats", "gap", partLimits(d, "slats", "gap")[boundary]);
      const m = buildAssemblyModel(d, low),
        a = leaf(m, "slats.04"),
        b = leaf(m, "slats.05"),
        size = (Math.max(d.width, d.height) / 100) * 1.4;
      const cam = {
        target: [0, 0, 0],
        x: [1, 0, 0],
        y: [0, 1, 0],
        z: [0, 0, 1],
        size,
      };
      assert.equal(
        pickPart(
          m,
          cam,
          500 + ((a.max[0] + b.min[0]) / 2 / size) * 1000,
          500 - ((d.height * 0.7) / 100 / size) * 1000,
          1000,
          1000,
        ),
        null,
      );
    }
});
test("fixed angular/slat/leaf/suspension identities survive overall edits and metadata cannot change recipes", () => {
  for (const id of FINAL_OBJECTS.filter((id) => id !== "pendant-lamp")) {
    const d = fresh(id),
      defs = partDefinitions(d);
    assert.deepEqual(
      decorDefinitions({
        ...d,
        kind: "cabinet",
        variant: "drawers",
        panels: 99,
        shelves: 6,
      }),
      defs,
    );
    assert.deepEqual(
      Object.keys(
        partDefinitions(normalize({ ...d, width: 240, height: 20, depth: 4 })),
      ),
      Object.keys(defs),
    );
  }
  const d = fresh("chandelier"),
    defs = partDefinitions(d);
  assert.equal(
    Object.keys(defs).filter((id) => id.startsWith("arms.")).length,
    5,
  );
  assert.equal(
    Object.keys(defs).filter((id) => id.startsWith("globes.")).length,
    5,
  );
});
test("new groups inherit and apply/reset/history preserve independent member edits", () => {
  for (const object of FINAL_OBJECTS)
    for (const [root, definition] of Object.entries(
      partDefinitions(fresh(object)),
    ).filter(([, v]) => v.group)) {
      let d = edit(fresh(object), root, "color", "#123456");
      const children = Object.keys(partDefinitions(d)).filter(
        (id) => partDefinitions(d)[id].parent === root,
      );
      for (const id of children)
        assert.equal(resolveParts(d)[id].color, "#123456");
      d = edit(d, children[0], "color", "#abcdef");
      const h = new History(d);
      h.push(applyGroup(d, root));
      assert.equal(resolveParts(h.current)[children[0]].color, "#123456");
      assert.deepEqual(h.undo(), d);
      assert.deepEqual(
        resolveParts(normalize(resetPart(d, root))),
        resolveParts(fresh(object)),
      );
      for (const key of definition.fields) {
        const value = partLimits(d, root, key)[1],
          changed = edit(fresh(object), root, key, value);
        for (const child of children)
          if (partDefinitions(changed)[child].fields.includes(key))
            close(resolveParts(changed)[child][key], value);
      }
    }
});
test("historical final-object files migrate and invalid revision/member/construction files fail atomically", () => {
  for (const old of fixture("final-18-whole-object-legacy.json")) {
    const d = deserialize(JSON.stringify(old));
    assert.equal(d.partsRevision, 1);
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
      assert.equal(d[key], old.design[key]);
  }
  for (const object of FINAL_OBJECTS) {
    const d = fresh(object),
      file = JSON.parse(serialize(d));
    for (const patch of [
      { partsRevision: 2 },
      { partsRevision: null },
      { parts: { "invented.99": { height: 1 } } },
      { construction: { memberCount: 99 } },
      {
        kind: "tier-stand",
        variant: "shelf",
        panels: 99,
        parts: { "slats.99": { thickness: 1 } },
      },
    ])
      assert.throws(() =>
        deserialize(JSON.stringify({ ...file, design: { ...d, ...patch } })),
      );
  }
});
test("single bodies retain honest whole-object controls and the connected hollow vase profile", () => {
  for (const object of ["display-plinth", "product-pedestal", "vase"]) {
    const d = fresh(object),
      defs = partDefinitions(d);
    assert.deepEqual(Object.keys(defs), ["body"]);
    assert.deepEqual(defs.body.fields, []);
    assert.ok(defs.body.globalFields.includes("height"));
    const changed = normalize({
      ...edit(d, "body", "color", "#123456"),
      width: 93,
      height: 123,
      depth: 42,
    });
    assert.deepEqual(deserialize(serialize(changed)), changed);
    assert.equal(buildAssemblyModel(changed).parts.length, 1);
  }
  assert.equal(VASE_PROFILE[0][1], 0);
  assert.equal(VASE_PROFILE.at(-1)[1], 0);
  assert.ok(
    VASE_PROFILE.some((p, i) => i > 6 && p[0] < VASE_PROFILE[i - 1][0]),
  );
});
test("all 54 released v1.10 high/low meshes remain byte-identical", () => {
  for (const [id, hashes] of Object.entries(
    fixture("released-v110-hashes.json"),
  ))
    for (const low of [false, true])
      assert.equal(
        createHash("sha256")
          .update(Buffer.from(buildModel(fresh(id), low).buffer))
          .digest("hex"),
        hashes[low ? "low" : "high"],
        id,
      );
});
test("new component dimension prompts preserve whole-object settings", () => {
  for (const prompt of [
    "globe height 10 cm",
    "soil thickness 2 cm",
    "pot width 20 cm",
    "leaf height 20 cm",
    "strap section 1 cm",
    "surface thickness 1 cm",
    "rim width 5 cm",
  ]) {
    const d = fresh("planter"),
      result = parsePrompt(prompt, d);
    assert.deepEqual(result.design, d);
    assert.ok(result.warnings.length);
  }
});

test("soil is actually visible and selectable through the open rim in high/low detail", () => {
  for (const object of ["planter", "hanging-planter"])
    for (const low of [false, true]) {
      const d = fresh(object),
        m = buildAssemblyModel(d, low),
        size = (Math.max(d.width, d.depth) / 100) * 1.5,
        cam = {
          target: [0, 0, 0],
          x: [1, 0, 0],
          y: [0, 0, -1],
          z: [0, 1, 0],
          size,
        };
      assert.equal(
        pickPart(
          m,
          cam,
          500 + ((d.width * 0.15) / 100 / size) * 1000,
          500 + ((d.depth * 0.08) / 100 / size) * 1000,
          1000,
          1000,
        ),
        "soil",
      );
    }
});
test("vase surface is a single closed connected mesh with a continuous inner wall", () => {
  for (const low of [false, true]) {
    const m = buildAssemblyModel(fresh("vase"), low),
      edges = new Map(),
      adj = new Map();
    const key = (v) => v.map((n) => Math.round(n * 1e7)).join(",");
    for (let i = 0; i < m.data.length; i += 30) {
      const points = [0, 10, 20].map((offset) =>
        key([...m.data.slice(i + offset, i + offset + 3)]),
      );
      for (let j = 0; j < 3; j++) {
        const a = points[j],
          b = points[(j + 1) % 3],
          edge = [a, b].sort().join("|");
        edges.set(edge, (edges.get(edge) || 0) + 1);
        if (!adj.has(a)) adj.set(a, new Set());
        if (!adj.has(b)) adj.set(b, new Set());
        adj.get(a).add(b);
        adj.get(b).add(a);
      }
    }
    assert.ok([...edges.values()].every((n) => n === 2));
    const visited = new Set(),
      queue = [adj.keys().next().value];
    while (queue.length) {
      const a = queue.pop();
      if (visited.has(a)) continue;
      visited.add(a);
      for (const b of adj.get(a)) queue.push(b);
    }
    assert.equal(visited.size, adj.size);
  }
});
