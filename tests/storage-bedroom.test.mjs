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
  resolveParts,
  editPart,
  resetPart,
  applyGroup,
  reconcilePartSelection,
} from "../public/studio/parts.js";
import {
  NEXT_OBJECTS,
  solveStorageBedroom,
} from "../public/studio/parts-storage-bedroom.js";
import { buildAssemblyModel, buildModel } from "../public/studio/geometry.js";
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"),
  );
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));
const overlaps = (a, b) =>
  [0, 1, 2].every(
    (k) => a.min[k] <= b.max[k] + 1e-6 && a.max[k] >= b.min[k] - 1e-6,
  );

for (const object of NEXT_OBJECTS)
  test(`${object}: positive connected owned components, measurements and bounds at combined limits`, () => {
    for (const size of [
      [20, 20, 4],
      [240, 240, 240],
      [240, 20, 4],
      [20, 240, 240],
      null,
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
            for (const [id, def] of Object.entries(partDefinitions(d)))
              for (const key of def.fields) {
                const lim = partLimits(d, id, key);
                assert.ok(lim[0] <= lim[1]);
                d = edit(
                  d,
                  id,
                  key,
                  lim[extreme === "mixed" ? i++ % 2 : extreme],
                );
              }
          const p = resolveParts(d),
            m = buildAssemblyModel(d, low),
            defs = partDefinitions(d);
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
              if (key === "thickness") {
                const root = part.id.split(".")[0];
                const axis =
                  root === "sides"
                    ? 0
                    : ["back", "headboard", "fronts", "mirror-frame"].includes(
                          root,
                        )
                      ? 2
                      : 1;
                close(part.bounds.size[axis], p[part.id][key] / 100);
              }
              if (
                key === "section" &&
                /^(posts|legs|brackets|mounts)\./.test(part.id)
              )
                close(part.bounds.size[0], p[part.id].section / 100);
            }
          }
          assert.equal(end * 10, m.data.length);
          for (let i = 0; i < m.data.length; i += 10)
            close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
          // Every component is connected to the grounded assembly, including
          // asymmetric fronts/handles and individually resized shelf boards.
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
                    reached.has(other.id) &&
                    overlaps(part.bounds, other.bounds),
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
          assert.deepEqual(deserialize(serialize(d)), d);
        }
  });

test("shelf board/bay counts preserve semantics, ordered safe bands and active identities for all five profiles", () => {
  for (const object of NEXT_OBJECTS.slice(0, 5))
    for (const count of [2, 3, 4, 5, 6]) {
      let d = normalize({ ...fresh(object), shelves: count });
      const open = d.variant === "open";
      const slots = Object.keys(partDefinitions(d)).filter((id) =>
        id.startsWith("shelves."),
      );
      assert.equal(slots.length, open ? count - 1 : count);
      for (const [i, id] of slots.entries()) {
        d = edit(d, id, "thickness", partLimits(d, id, "thickness")[1]);
        if (partDefinitions(d)[id].fields.includes("height"))
          d = edit(d, id, "height", partLimits(d, id, "height")[i % 2]);
      }
      const m = buildAssemblyModel(d),
        shelves = m.parts.filter((p) => p.parent === "shelves");
      for (let i = 1; i < shelves.length; i++)
        assert.ok(shelves[i].bounds.min[1] > shelves[i - 1].bounds.max[1]);
      if (open) {
        assert.ok(
          shelves[0].bounds.min[1] >
            m.parts.find((p) => p.id === "bottom").bounds.max[1],
        );
        assert.ok(
          shelves.at(-1).bounds.max[1] <
            m.parts.find((p) => p.id === "top").bounds.min[1],
        );
      } else {
        close(shelves[0].bounds.min[1], 0);
        close(shelves.at(-1).bounds.max[1], d.height / 100);
      }
      assert.deepEqual(deserialize(serialize(d)), d);
    }
});

test("count shrink/re-add is atomic, prunes inactive overrides and reconciles selection; undo restores exact data", () => {
  for (const object of NEXT_OBJECTS.slice(0, 5)) {
    let d = normalize({ ...fresh(object), shelves: 6 });
    const last = d.variant === "open" ? "shelves.05" : "shelves.06";
    d = edit(d, "shelves.01", "color", "#123456");
    d = edit(d, last, "thickness", 0.5);
    const h = new History(d),
      prior = partDefinitions(d);
    const smaller = normalize({ ...d, shelves: 2 });
    h.push(smaller);
    assert.equal(smaller.parts[last], undefined);
    assert.equal(smaller.parts["shelves.01"].color, "#123456");
    assert.equal(
      reconcilePartSelection(last, prior, partDefinitions(smaller)),
      "shelves",
    );
    assert.deepEqual(h.undo(), d);
    assert.deepEqual(h.redo(), smaller);
    const grown = normalize({ ...smaller, shelves: 6 });
    assert.equal(grown.parts[last], undefined);
    assert.equal(
      resolveParts(grown)[last].thickness,
      resolveParts(normalize({ ...fresh(object), shelves: 6 }))[last].thickness,
    );
  }
});

test("six-board and open-bay clearances survive thin/short envelopes and count/size changes", () => {
  for (const object of NEXT_OBJECTS.slice(0, 5))
    for (const size of [
      [20, 20, 4],
      [240, 20, 4],
      [20, 240, 240],
    ]) {
      let d = normalize({
        ...fresh(object),
        shelves: 6,
        width: size[0],
        height: size[1],
        depth: size[2],
      });
      for (const [id, def] of Object.entries(partDefinitions(d)))
        for (const key of def.fields)
          d = edit(d, id, key, partLimits(d, id, key)[1]);
      for (const count of [6, 2, 5, 3, 6]) {
        d = normalize({ ...d, shelves: count });
        const m = buildAssemblyModel(d),
          boards = m.parts.filter((p) => p.parent === "shelves");
        for (let i = 1; i < boards.length; i++)
          assert.ok(boards[i].bounds.min[1] > boards[i - 1].bounds.max[1]);
        [d.width, d.height, d.depth].forEach((n, k) =>
          close(m.bounds.size[k], n / 100),
        );
        assert.deepEqual(deserialize(serialize(d)), d);
      }
    }
});

test("all groups inherit fields/finish and apply/reset/undo preserve independent members", () => {
  for (const object of NEXT_OBJECTS) {
    const original = fresh(object);
    for (const [group, def] of Object.entries(partDefinitions(original)).filter(
      ([, v]) => v.group,
    )) {
      const members = Object.keys(partDefinitions(original)).filter(
        (id) => partDefinitions(original)[id].parent === group,
      );
      let d = edit(original, group, "color", "#123456");
      for (const member of members)
        assert.equal(resolveParts(d)[member].color, "#123456");
      d = edit(d, members[0], "color", "#abcdef");
      const h = new History(d);
      h.push(applyGroup(d, group));
      assert.equal(resolveParts(h.current)[members[0]].color, "#123456");
      assert.deepEqual(h.undo(), d);
      d = normalize(resetPart(d, group));
      assert.deepEqual(resolveParts(d), resolveParts(original));
      for (const key of def.fields) {
        const value = partLimits(original, group, key)[1];
        d = edit(original, group, key, value);
        for (const member of members)
          if (partDefinitions(d)[member].fields.includes(key))
            close(resolveParts(d)[member][key], value);
      }
    }
  }
});

test("legacy whole-object files migrate; new formats reject inactive IDs, invalid counts, revisions and construction", () => {
  for (const old of fixture("storage-bedroom-whole-object-legacy.json")) {
    const d = deserialize(JSON.stringify(old));
    assert.equal(d.partsRevision, 1);
    if (partDefinitions(d).back) {
      assert.equal(resolveParts(d).back.color, d.accent);
      assert.equal(resolveParts(d).back.material, "matte");
    }
    for (const key of [
      "id",
      "width",
      "height",
      "depth",
      "color",
      "accent",
      "material",
      "shelves",
    ])
      assert.equal(d[key], old.design[key]);
  }
  for (const object of NEXT_OBJECTS) {
    const original = fresh(object),
      file = JSON.parse(serialize(original));
    const invalid = [
      { partsRevision: 2 },
      { partsRevision: null },
      { parts: { "invented.99": { thickness: 1 } } },
      { construction: { shelfCount: 3 } },
      {
        kind: "cabinet",
        variant: "drawers",
        panels: 99,
        parts: { "fronts.99": { thickness: 1 } },
      },
    ];
    if (original.shelves)
      invalid.push(
        { shelves: 2.5 },
        { shelves: 1 },
        { parts: { "shelves.99": { thickness: 1 } } },
      );
    for (const change of invalid)
      assert.throws(() =>
        deserialize(
          JSON.stringify({ ...file, design: { ...original, ...change } }),
        ),
      );
    if (original.shelves)
      assert.throws(() =>
        deserialize(
          JSON.stringify({
            ...file,
            design: {
              ...original,
              shelves: 2,
              parts: { "shelves.06": { color: "#123456" } },
            },
          }),
        ),
      );
  }
  assert.deepEqual(
    partDefinitions({
      ...fresh("wardrobe"),
      kind: "shelf",
      variant: "open",
      panels: 99,
    }),
    partDefinitions(fresh("wardrobe")),
  );
  assert.deepEqual(
    partDefinitions({
      ...fresh("bookshelf"),
      kind: "cabinet",
      variant: "drawers",
      panels: 99,
    }),
    partDefinitions(fresh("bookshelf")),
  );
});

test("all 24 v1.8 high/low meshes remain byte-identical", () => {
  for (const [id, expected] of Object.entries(
    fixture("released-v18-hashes.json"),
  ))
    for (const low of [false, true])
      assert.equal(
        createHash("sha256")
          .update(Buffer.from(buildModel(fresh(id), low).buffer))
          .digest("hex"),
        expected[low ? "low" : "high"],
        id,
      );
});

test("component text edits preserve the whole object; shelf count prompts use the existing count adapter", () => {
  for (const phrase of [
    "shelf height 90 cm",
    "door width 25 cm",
    "drawer height 15 cm",
    "door panel width 25 cm",
    "handle section 2 cm",
    "mattress thickness 10 cm",
    "mirror width 40 cm",
    "bracket height 20 cm",
  ]) {
    const d = fresh("bookshelf"),
      result = parsePrompt(phrase, d);
    assert.deepEqual(result.design, d);
    assert.ok(result.warnings.length);
  }
  assert.equal(
    parsePrompt("use 6 shelves", fresh("bookshelf")).design.shelves,
    6,
  );
});
