import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  fresh,
  normalize,
  serialize,
  deserialize,
  CATALOG,
  parsePrompt,
  History,
} from "../public/studio/design.js";
import {
  editPart,
  resolveParts,
  partDefinitions,
  partLimits,
  resetPart,
  applyGroup,
} from "../public/studio/parts.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
const IDS = ["standing-desk", "corner-desk", "patio-table", "laptop-stand"];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const part = (m, id) => m.parts.find((p) => p.id === id);
const edit = (d, id, key, value) => normalize(editPart(d, id, key, value));

test("four construction variants own every triangle and preserve the declared envelope at combined limits", () => {
  for (const id of IDS)
    for (const dims of [
      [20, 20, 4],
      [240, 240, 240],
      [240, 20, 4],
      [20, 240, 240],
    ])
      for (const extreme of [null, 0, 1])
        for (const low of [false, true])
          for (const shape of fresh(id).shape
            ? ["square", "round"]
            : [undefined]) {
            let d = normalize({
              ...fresh(id),
              width: dims[0],
              height: dims[1],
              depth: dims[2],
              ...(shape ? { shape } : {}),
            });
            if (extreme !== null)
              for (const [id, def] of Object.entries(partDefinitions(d)))
                for (const key of def.fields)
                  d = edit(d, id, key, partLimits(d, id, key)[extreme]);
            const m = buildAssemblyModel(d, low);
            assert.ok(m.data.every(Number.isFinite), id);
            let end = 0;
            for (const p of m.parts) {
              assert.equal(p.firstVertex, end);
              end += p.vertexCount;
              assert.ok(p.vertexCount > 0);
              assert.ok(p.bounds.size.every((n) => n > 0));
            }
            assert.equal(end * 10, m.data.length);
            dims.forEach((v, i) => close(m.bounds.size[i], v / 100));
            close(m.bounds.min[1], 0);
            for (let i = 0; i < m.data.length; i += 10)
              close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
            assert.deepEqual(deserialize(serialize(d)), d);
          }
});
test("standing columns connect the feet to the top; corner slabs stay flush and five legs attach", () => {
  let d = edit(fresh("standing-desk"), "tabletop", "thickness", 9);
  d = edit(d, "feet.left", "thickness", 6);
  let m = buildAssemblyModel(d),
    top = part(m, "tabletop");
  for (const side of ["left", "right"]) {
    const col = part(m, `columns.${side}`),
      foot = part(m, `feet.${side}`);
    close(col.bounds.max[1], top.bounds.min[1]);
    assert.ok(col.bounds.min[1] < foot.bounds.max[1]);
  }
  d = edit(fresh("corner-desk"), "tabletop", "width", 70);
  d = edit(d, "tabletop", "depth", 50);
  d = edit(d, "tabletop", "thickness", 7);
  m = buildAssemblyModel(d);
  const a = part(m, "tabletop.main-top"),
    b = part(m, "tabletop.return-top");
  close(a.bounds.max[0], b.bounds.min[0]);
  close(a.bounds.min[1], b.bounds.min[1]);
  close(a.bounds.size[0], 0.7);
  close(b.bounds.size[2], 0.5);
  assert.equal(m.parts.filter((p) => p.parent === "legs").length, 5);
  for (const leg of m.parts.filter((p) => p.parent === "legs"))
    close(leg.bounds.max[1], a.bounds.min[1]);
});
test("seven slats keep member finishes across shape changes and leave editable gaps", () => {
  let d = edit(fresh("patio-table"), "tabletop", "gap", 1.2);
  d = edit(d, "tabletop.03", "color", "#ff0000");
  const square = buildAssemblyModel(d),
    a = part(square, "tabletop.01"),
    b = part(square, "tabletop.02");
  close(b.bounds.min[0] - a.bounds.max[0], 0.012);
  d = normalize({ ...d, shape: "round" });
  const m = buildAssemblyModel(d);
  assert.equal(m.parts.filter((p) => p.parent === "tabletop").length, 7);
  assert.equal(resolveParts(d)["tabletop.03"].color, "#ff0000");
  for (const p of m.parts.filter((p) => p.parent === "tabletop"))
    for (
      let i = p.firstVertex * 10;
      i < (p.firstVertex + p.vertexCount) * 10;
      i += 10
    )
      assert.ok(
        (m.data[i] / (d.width / 200)) ** 2 +
          (m.data[i + 2] / (d.depth / 200)) ** 2 <=
          1 + 1e-5,
      );
  for (const leg of m.parts.filter((p) => p.parent === "legs")) {
    const x = (leg.bounds.min[0] + leg.bounds.max[0]) / 2;
    assert.ok(
      m.parts.some(
        (p) =>
          p.parent === "tabletop" &&
          x >= p.bounds.min[0] &&
          x <= p.bounds.max[0],
      ),
    );
  }
});
test("laptop support and retaining lip follow platform edits, including a thin base", () => {
  let d = edit(fresh("laptop-stand"), "base", "thickness", 0.3);
  d = edit(d, "support", "section", 3);
  d = edit(d, "platform", "thickness", 3);
  d = edit(d, "lip", "height", 4);
  const m = buildAssemblyModel(d),
    support = part(m, "support"),
    base = part(m, "base"),
    platform = part(m, "platform"),
    lip = part(m, "lip");
  assert.ok(support.bounds.min[1] < base.bounds.max[1]);
  assert.ok(support.bounds.min[1] >= 0);
  assert.ok(support.bounds.max[1] > platform.bounds.min[1]);
  close(lip.bounds.min[1], platform.bounds.max[1]);
  close(lip.bounds.max[2], platform.bounds.max[2]);
  close(lip.bounds.max[1], d.height / 100);
});
test("new group members inherit, reset, apply, undo and survive legacy and revisioned save round trips", () => {
  for (const id of IDS) {
    for (const version of [1, 2, 3]) {
      const old = structuredClone(CATALOG.find((d) => d.id === id));
      assert.equal(
        deserialize(
          JSON.stringify({ format: "form-studio", version, design: old }),
        ).partsRevision,
        1,
      );
    }
    const defs = partDefinitions(fresh(id)),
      group = Object.keys(defs).find((id) => defs[id].group);
    let d = fresh(id);
    if (group) {
      const child = Object.keys(defs).find((id) => defs[id].parent === group);
      d = edit(d, group, "color", "#112233");
      d = edit(d, child, "color", "#ff0000");
      assert.equal(resolveParts(d)[child].color, "#ff0000");
      const h = new History(d);
      h.push(normalize(applyGroup(d, group)));
      assert.equal(resolveParts(h.current)[child].color, "#112233");
      assert.deepEqual(h.undo(), d);
      assert.equal(normalize(resetPart(d, group)).parts, undefined);
    }
    assert.deepEqual(deserialize(serialize(d)), d);
    const file = JSON.parse(serialize(d));
    file.design.partsRevision = 2;
    assert.throws(() => deserialize(JSON.stringify(file)), /revision/);
    file.design.partsRevision = 1;
    file.design.parts = { unknown: { thickness: 2 } };
    assert.throws(() => deserialize(JSON.stringify(file)), /Invalid part/);
  }
});
test("R1 leaves every released v1.3 mesh byte-for-byte unchanged", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/released-v13-hashes.json", import.meta.url),
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

test("new component dimension prompts cannot mutate whole-object dimensions", () => {
  for (const [id, prompt] of [
    ["standing-desk", "column section 4 cm"],
    ["corner-desk", "return slab width 60 cm"],
    ["patio-table", "slat width 10 cm"],
    ["laptop-stand", "lip height 3 cm"],
  ]) {
    const d = fresh(id),
      result = parsePrompt(prompt, d);
    assert.deepEqual(result.design, d);
    assert.match(result.warnings.join(" "), /Individual parts/);
  }
});
