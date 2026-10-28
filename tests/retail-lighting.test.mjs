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
  retailDefinitions,
  retailRecipe,
} from "../public/studio/parts-retail-lighting.js";
import { buildAssemblyModel, buildModel } from "../public/studio/geometry.js";
const objects = [
  "reception-desk",
  "service-counter",
  "bar-counter",
  "checkout-counter",
  "pastry-display-stand",
  "plant-stand",
  "garment-rail",
  "hanging-rack",
  "accessory-stand",
  "brochure-holder",
  "promotional-stand",
  "freestanding-logo-display",
  "floor-lamp",
  "table-lamp",
  "pendant-light",
];
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
for (const object of objects)
  test(`${object}: owned, connected, measurable components hold at combined/mixed limits`, () => {
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
              if (key === "width")
                close(part.bounds.size[0], p[part.id].width / 100);
              if (key === "depth")
                close(part.bounds.size[2], p[part.id].depth / 100);
              if (key === "diameter") {
                close(part.bounds.size[0], p[part.id].diameter / 100);
                close(part.bounds.size[2], p[part.id].diameter / 100);
              }
              if (key === "thickness") {
                const root = part.id.split(".")[0],
                  axis = ["fronts", "back", "backs", "lips", "mark"].includes(
                    root,
                  )
                    ? 2
                    : 1;
                close(part.bounds.size[axis], p[part.id].thickness / 100);
              }
              if (key === "section") {
                const axis =
                  part.id.startsWith("crossbars") ||
                  part.id === "rail" ||
                  ["mark.top", "mark.middle"].includes(part.id)
                    ? 1
                    : 0;
                close(part.bounds.size[axis], p[part.id].section / 100);
              }
              if (
                key === "height" &&
                ["shade", "lips", "feet", "plinth"].includes(
                  part.id.split(".")[0],
                )
              )
                close(part.bounds.size[1], p[part.id].height / 100);
            }
          }
          assert.equal(end * 10, m.data.length);
          if (object === "pastry-display-stand") {
            const last = m.parts
              .filter((p) => p.parent === "trays")
              .at(-1).bounds;
            for (const side of ["left", "right"])
              close(leaf(m, `posts.${side}`).max[1], last.min[1]);
          }
          if (["garment-rail", "hanging-rack"].includes(object))
            for (const side of ["left", "right"])
              close(leaf(m, `uprights.${side}`).max[1], leaf(m, "rail").min[1]);
          if (object === "accessory-stand")
            for (const side of ["lower", "upper"])
              close(
                leaf(m, `crossbars.${side}`).min[2],
                leaf(m, "mast").max[2],
              );
          if (object === "brochure-holder")
            for (const slot of ["01", "02", "03"])
              close(leaf(m, `backs.${slot}`).min[2], leaf(m, "mast").max[2]);
          if (object === "freestanding-logo-display") {
            close(leaf(m, "mark.stem").max[1], leaf(m, "mark.top").min[1]);
            close(leaf(m, "mark.middle").min[0], leaf(m, "mark.stem").max[0]);
          }
          for (let i = 0; i < m.data.length; i += 10)
            close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
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
          assert.deepEqual(deserialize(serialize(d)), d);
        }
  });

test("all tray counts have safe height bands, anchored ends and posts inside independently sized upper trays", () => {
  for (const size of [
    [20, 20, 4],
    [240, 20, 4],
    [20, 240, 240],
    [75, 70, 40],
  ])
    for (const count of [2, 3, 4, 5, 6]) {
      let d = normalize({
        ...fresh("pastry-display-stand"),
        shelves: count,
        width: size[0],
        height: size[1],
        depth: size[2],
      });
      for (const [id, def] of Object.entries(partDefinitions(d)))
        for (const key of def.fields)
          d = edit(
            d,
            id,
            key,
            partLimits(d, id, key)[key === "width" || key === "depth" ? 0 : 1],
          );
      const m = buildAssemblyModel(d),
        trays = m.parts.filter((p) => p.parent === "trays");
      assert.equal(trays.length, count);
      close(trays[0].bounds.min[1], 0);
      close(trays.at(-1).bounds.max[1], d.height / 100);
      for (let i = 1; i < count; i++)
        assert.ok(trays[i].bounds.min[1] > trays[i - 1].bounds.max[1]);
      for (const tray of trays)
        for (const side of ["left", "right"])
          assert.ok(overlap(tray.bounds, leaf(m, `posts.${side}`)));
    }
});
test("tray pruning, count/size clamping, selection and history preserve exact surviving settings", () => {
  let d = normalize({ ...fresh("pastry-display-stand"), shelves: 6 });
  d = edit(d, "trays.01", "material", "metal");
  d = edit(d, "trays.06", "width", 35);
  const h = new History(d),
    old = partDefinitions(d),
    smaller = normalize({ ...d, shelves: 2 });
  h.push(smaller);
  assert.equal(smaller.parts["trays.06"], undefined);
  assert.equal(smaller.parts["trays.01"].material, "metal");
  assert.equal(
    reconcilePartSelection("trays.06", old, partDefinitions(smaller)),
    "trays",
  );
  assert.deepEqual(h.undo(), d);
  assert.deepEqual(h.redo(), smaller);
  const grown = normalize({ ...smaller, shelves: 6 });
  assert.equal(grown.parts["trays.06"], undefined);
  const shrunk = normalize({ ...d, width: 20, height: 20, depth: 4 });
  assert.deepEqual(deserialize(serialize(shrunk)), shrunk);
});
test("modeled attachments follow individual platform, shelf, pocket, stroke and lighting edits", () => {
  let d = fresh("plant-stand");
  d = edit(d, "platforms.01", "width", 15);
  d = edit(d, "platforms.01", "height", 30);
  let m = buildAssemblyModel(d);
  for (const side of ["front", "rear"])
    close(
      leaf(m, `supports.01-${side}`).max[1],
      leaf(m, "platforms.01").min[1],
    );
  for (const object of ["floor-lamp", "table-lamp", "pendant-light"]) {
    d = edit(
      fresh(object),
      "shade",
      "height",
      partLimits(fresh(object), "shade", "height")[1],
    );
    d = edit(
      d,
      "diffuser",
      "thickness",
      partLimits(d, "diffuser", "thickness")[1],
    );
    m = buildAssemblyModel(d);
    if (object === "pendant-light") {
      close(leaf(m, "diffuser").min[1], 0);
      close(leaf(m, "diffuser").max[1], leaf(m, "shade").min[1]);
      close(leaf(m, "mount").max[1], d.height / 100);
    } else {
      close(leaf(m, "base").min[1], 0);
      close(leaf(m, "shade").max[1], d.height / 100);
      close(leaf(m, "diffuser").max[1], leaf(m, "shade").min[1]);
    }
  }
  assert.equal(partDefinitions(fresh("garment-rail")).shelf, undefined);
  assert.ok(partDefinitions(fresh("hanging-rack")).shelf);
  assert.equal(
    Object.keys(partDefinitions(fresh("brochure-holder"))).filter((id) =>
      id.startsWith("backs."),
    ).length,
    3,
  );
  assert.equal(
    Object.keys(partDefinitions(fresh("freestanding-logo-display"))).filter(
      (id) => id.startsWith("mark."),
    ).length,
    3,
  );
});
test("group inheritance, member overrides, apply/reset and undo work for every new group", () => {
  for (const object of objects)
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
        for (const id of children)
          if (partDefinitions(changed)[id].fields.includes(key))
            close(resolveParts(changed)[id][key], value);
      }
    }
});
test("historical files migrate; invalid fields/revisions/topology and spoofed metadata cannot replace construction", () => {
  for (const old of fixture("retail-lighting-whole-object-legacy.json")) {
    const d = deserialize(JSON.stringify(old));
    assert.equal(d.partsRevision, 1);
    for (const key of [
      "id",
      "width",
      "height",
      "depth",
      "shelves",
      "color",
      "accent",
      "material",
    ])
      assert.equal(d[key], old.design[key]);
  }
  for (const object of objects) {
    const d = fresh(object),
      file = JSON.parse(serialize(d));
    for (const patch of [
      { partsRevision: 2 },
      { partsRevision: null },
      { parts: { "invented.99": { thickness: 1 } } },
      { construction: { count: 9 } },
      {
        kind: "tier-stand",
        variant: "shelf",
        panels: 99,
        parts: { "trays.99": { thickness: 1 } },
      },
    ])
      assert.throws(() =>
        deserialize(JSON.stringify({ ...file, design: { ...d, ...patch } })),
      );
  }
  const file = JSON.parse(serialize(fresh("pastry-display-stand")));
  for (const patch of [
    { shelves: 2.5 },
    { shelves: 7 },
    { shelves: 2, parts: { "trays.06": { thickness: 1 } } },
  ])
    assert.throws(() =>
      deserialize(
        JSON.stringify({ ...file, design: { ...file.design, ...patch } }),
      ),
    );
  for (const id of objects.slice(4))
    assert.deepEqual(
      retailDefinitions({
        ...fresh(id),
        kind: "cabinet",
        variant: "open",
        panels: 99,
      }),
      retailDefinitions(fresh(id)),
    );
});
test("39 released high/low meshes remain byte-identical", () => {
  for (const [id, hashes] of Object.entries(
    fixture("released-v19-hashes.json"),
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
test("component dimension prompts do not mutate the whole object; tray count uses the existing shelves field", () => {
  for (const prompt of [
    "shade height 30 cm",
    "stem diameter 2 cm",
    "tray width 40 cm",
    "cable height 40 cm",
    "diffuser thickness 1 cm",
    "crossbar width 30 cm",
    "pocket height 25 cm",
  ]) {
    const d = fresh("floor-lamp"),
      result = parsePrompt(prompt, d);
    assert.deepEqual(result.design, d);
    assert.ok(result.warnings.length);
  }
  assert.equal(
    parsePrompt("use 6 tiers", fresh("pastry-display-stand")).design.shelves,
    6,
  );
});
