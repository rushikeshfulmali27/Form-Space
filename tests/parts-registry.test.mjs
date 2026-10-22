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
  getPartsProfile,
  partDefinitions,
  supportedPartObjects,
} from "../public/studio/parts-registry.js";
import { editPart } from "../public/studio/parts.js";
import { buildAssemblyModel } from "../public/studio/geometry.js";
import {
  STORE,
  V2_STORE,
  LEGACY_STORE,
  loadWorkspace,
} from "../public/studio/storage.js";
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"),
  );
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);

test("registry resolves only explicitly enabled objects and trusted revisions", () => {
  assert.deepEqual(
    [...supportedPartObjects].sort(),
    [
      "cafe-table",
      "side-table",
      "square-cafe-table",
      "work-desk",
      "coffee-table",
      "dining-table",
      "conference-table",
      "communal-table",
      "standing-desk",
      "corner-desk",
      "patio-table",
      "laptop-stand",
    ].sort(),
  );
  for (const id of ["constructor", "__proto__", "bookshelf", "sofa"]) {
    assert.equal(getPartsProfile({ id }), null);
    assert.deepEqual(partDefinitions({ id }), {});
  }
  for (const id of supportedPartObjects) {
    const d = fresh(id);
    assert.equal(d.partsRevision, 1);
    assert.ok(Object.keys(partDefinitions(d)).length > 0);
  }
});

test("all three pedestal tables preserve independent dimensions, attachments, history and v3 round trips", () => {
  for (const id of supportedPartObjects.filter(
    (id) => getPartsProfile({ id }).id === "pedestal-table",
  )) {
    let d = fresh(id);
    const h = new History(d);
    for (const [part, key, value] of [
      ["tabletop", "thickness", 3.1],
      ["column", "diameter", 6],
      ["base", "width", 30],
      ["column", "material", "metal"],
    ])
      d = normalize(editPart(d, part, key, value));
    h.push(d);
    assert.deepEqual(h.redo(), d);
    assert.equal(h.undo().id, id);
    assert.deepEqual(deserialize(serialize(d)), d);
    for (const low of [false, true]) {
      const m = buildAssemblyModel(d, low),
        top = m.parts.find((p) => p.id === "tabletop"),
        column = m.parts.find((p) => p.id === "column"),
        base = m.parts.find((p) => p.id === "base");
      close(top.bounds.size[1], 0.031);
      close(column.bounds.size[0], 0.06);
      close(base.bounds.size[0], 0.3);
      close(base.bounds.min[1], 0);
      close(column.bounds.max[1], top.bounds.min[1]);
      assert.ok(column.bounds.min[1] < base.bounds.max[1]);
      [d.width, d.height, d.depth].forEach((n, k) =>
        close(m.bounds.size[k], n / 100),
      );
    }
  }
});

test("released custom café-table v2 settings and vertex data migrate without visual changes", () => {
  const legacy = fixture("cafe-table-v2.json"),
    d = deserialize(JSON.stringify(legacy)),
    hashes = fixture("cafe-table-v11-hashes.json");
  assert.deepEqual(d.parts, legacy.design.parts);
  assert.equal(d.partsRevision, 1);
  for (const low of [false, true]) {
    const data = buildAssemblyModel(d, low).data;
    assert.equal(
      createHash("sha256").update(Buffer.from(data.buffer)).digest("hex"),
      hashes[low ? "low" : "high"],
    );
  }
});

test("original side and square table v1 fixtures retain parameters and acquire the current profile", () => {
  for (const legacy of fixture("pedestal-tables-v1.json")) {
    const d = deserialize(JSON.stringify(legacy));
    for (const key of [
      "id",
      "width",
      "height",
      "depth",
      "shape",
      "material",
      "color",
      "accent",
    ])
      assert.equal(d[key], legacy.design[key]);
    assert.equal(d.partsRevision, 1);
    assert.equal(d.parts, undefined);
  }
});

test("v3 imports reject absent/future/wrong revisions and older formats cannot claim new part schemas", () => {
  const valid = JSON.parse(serialize(fresh("side-table")));
  for (const partsRevision of [undefined, null, 0, 2, "1", true])
    assert.throws(
      () =>
        deserialize(
          JSON.stringify({
            ...valid,
            design: { ...valid.design, partsRevision },
          }),
        ),
      /revision/,
    );
  assert.throws(
    () =>
      deserialize(
        JSON.stringify({
          ...valid,
          version: 2,
          design: { ...valid.design, parts: { column: { diameter: 5 } } },
        }),
      ),
    /version-3/,
  );
  assert.throws(
    () =>
      deserialize(
        JSON.stringify({
          ...valid,
          design: { ...fresh("bookshelf"), partsRevision: 1 },
        }),
      ),
    /revision/,
  );
  assert.throws(
    () =>
      deserialize(
        JSON.stringify({
          ...valid,
          design: { ...valid.design, parts: { legs: { diameter: 5 } } },
        }),
      ),
    /Invalid part/,
  );
});

test("v3 storage prefers v2 over v1, keeps backups and does not conceal corrupt newer saves", () => {
  const v2 = JSON.stringify(fixture("cafe-table-v2.json")),
    v1 = JSON.stringify(fixture("pedestal-tables-v1.json")[0]);
  const entries = new Map([
      [V2_STORE, v2],
      [LEGACY_STORE, v1],
    ]),
    storage = {
      getItem: (k) => entries.get(k) ?? null,
      setItem: (k, v) => entries.set(k, v),
    };
  assert.equal(loadWorkspace(storage).design.id, "cafe-table");
  assert.equal(JSON.parse(entries.get(STORE)).version, 3);
  assert.equal(entries.get(V2_STORE), v2);
  assert.equal(entries.get(LEGACY_STORE), v1);
  entries.delete(STORE);
  entries.set(V2_STORE, "invalid v2");
  assert.equal(loadWorkspace(storage).status, "corrupt");
  assert.equal(entries.has(STORE), false);
  entries.set(STORE, "invalid v3");
  assert.equal(loadWorkspace(storage).status, "corrupt");
  assert.equal(entries.get(STORE), "invalid v3");
  entries.delete(STORE);
  entries.set(V2_STORE, v2);
  assert.equal(
    loadWorkspace({
      ...storage,
      setItem() {
        throw Error("quota");
      },
    }).status,
    "unavailable",
  );
  assert.equal(entries.has(STORE), false);
});
