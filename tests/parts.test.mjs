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
  MATERIALS,
  CATALOG,
} from "../public/studio/design.js";
import { buildModel, buildAssemblyModel } from "../public/studio/geometry.js";
import {
  supportsParts,
  resolveParts,
  normalizeParts,
  editPart,
  resetPart,
} from "../public/studio/parts.js";
import {
  STORE,
  LEGACY_STORE,
  loadWorkspace,
} from "../public/studio/storage.js";
import { Viewer } from "../public/studio/viewer.js";
import { pickPart } from "../public/studio/picking.js";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-5, `${a} != ${b}`);
const part = (m, id) => m.parts.find((p) => p.id === id);
const changed = (d, id, key, value) => normalize(editPart(d, id, key, value));

test("only the pilot has parts; mesh ownership is complete and stable at both detail levels", () => {
  for (const d of CATALOG)
    assert.equal(supportsParts(d), d.id === "cafe-table");
  for (const low of [false, true]) {
    const m = buildAssemblyModel(fresh(), low);
    assert.deepEqual(
      m.parts.map((p) => p.id),
      ["tabletop", "column", "base"],
    );
    let end = 0;
    for (const p of m.parts) {
      assert.equal(p.firstVertex, end);
      assert.equal(p.vertexCount % 3, 0);
      end += p.vertexCount;
    }
    assert.equal(end * 10, m.data.length);
  }
});

test("part dimensions are final measurements; support follows top and base stays grounded", () => {
  let d = fresh();
  d = changed(d, "column", "diameter", 8);
  d = changed(d, "base", "width", 60);
  d = changed(d, "base", "depth", 45);
  const before = buildAssemblyModel(d);
  d = changed(d, "tabletop", "thickness", 7.2);
  const m = buildAssemblyModel(d);
  close(part(m, "tabletop").bounds.size[1], 0.072);
  close(part(m, "column").bounds.size[0], 0.08);
  close(part(m, "base").bounds.size[0], 0.6);
  close(part(m, "base").bounds.size[2], 0.45);
  close(part(m, "base").bounds.min[1], 0);
  close(part(m, "column").bounds.max[1], part(m, "tabletop").bounds.min[1]);
  assert.ok(part(m, "column").bounds.min[1] < part(m, "base").bounds.max[1]);
  close(part(m, "base").bounds.size[1], part(before, "base").bounds.size[1]);
  close(m.bounds.size[0], d.width / 100);
  close(m.bounds.size[1], d.height / 100);
  close(m.bounds.size[2], d.depth / 100);
});

test("dimensions stay finite and normals stay unit length across shapes and constrained extremes", () => {
  for (const low of [false, true])
    for (const shape of ["round", "square"])
      for (const dims of [
        [20, 20, 4],
        [240, 240, 240],
      ]) {
        const d = normalize({
          ...fresh(),
          width: dims[0],
          height: dims[1],
          depth: dims[2],
          shape,
          parts: {
            tabletop: { thickness: 999 },
            column: { diameter: 999 },
            base: { width: 999, depth: 999 },
          },
        });
        const m = buildAssemblyModel(d, low);
        assert.ok(m.data.every(Number.isFinite));
        for (let i = 0; i < m.data.length; i += 10)
          close(Math.hypot(...m.data.slice(i + 3, i + 6)), 1);
        for (let k = 0; k < 3; k++)
          close(m.bounds.size[k], [d.width, d.height, d.depth][k] / 100);
      }
});

test("independent overrides survive whole-object edits; invalid dependent dimensions clamp together", () => {
  let d = changed(fresh(), "column", "diameter", 20);
  d = changed(d, "base", "width", 75);
  d = normalize({ ...d, width: 30, depth: 25, height: 100 });
  assert.equal(d.parts.base.width, 30);
  assert.equal(d.parts.column.diameter, 10);
  close(buildAssemblyModel(d).bounds.size[1], 1);
});

test("inherited finishes and independent material codes reach the correct vertex ranges", () => {
  const d = changed(
    { ...fresh(), material: "walnut" },
    "column",
    "material",
    "metal",
  );
  const m = buildAssemblyModel(d);
  assert.equal(m.data[part(m, "column").firstVertex * 10 + 9], 2);
  assert.equal(m.data[part(m, "tabletop").firstVertex * 10 + 9], 1);
  assert.equal(m.data[part(m, "base").firstVertex * 10 + 9], 0);
  assert.equal(
    resolveParts(normalize({ ...d, accent: "#ff0000" })).column.color,
    "#ff0000",
  );
  const custom = changed(d, "column", "color", "#00ff00");
  assert.equal(
    resolveParts(normalize({ ...custom, accent: "#ff0000" })).column.color,
    "#00ff00",
  );
  assert.equal(
    resolveParts(normalize(resetPart(custom, "column"))).column.material,
    "matte",
  );
});

test("v1 fixture migrates and v2 round-trips every override with semantic history", () => {
  const old = deserialize(
    readFileSync(
      new URL("./fixtures/cafe-table-v1.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(old.width, 90);
  assert.equal(old.material, "walnut");
  assert.equal(old.shape, "square");
  let next = changed(old, "tabletop", "thickness", 3.2);
  next = changed(next, "column", "material", "metal");
  const h = new History(old);
  h.push(next);
  assert.deepEqual(h.undo(), old);
  assert.deepEqual(h.redo(), next);
  assert.ok(diff(old, next).some((c) => c.key === "Tabletop thickness"));
  const text = serialize(next);
  assert.equal(JSON.parse(text).version, 2);
  assert.deepEqual(deserialize(text), next);
  h.undo();
  h.push(changed(old, "base", "depth", 40));
  assert.equal(h.canRedo, false);
});

test("invalid part imports reject IDs, fields, types, inherited prototype names and oversized dimensions", () => {
  for (const parts of [
    null,
    [],
    { unknown: {} },
    { constructor: { color: "#ffffff" } },
    { column: { diameter: 999 } },
    { column: { diameter: "5" } },
    { column: { material: "constructor" } },
    { column: { color: "red" } },
    { tabletop: { freeMove: 1 } },
    { base: { width: -1 } },
  ]) {
    assert.throws(() =>
      deserialize(
        JSON.stringify({
          format: "form-studio",
          version: 2,
          design: { ...fresh(), parts },
        }),
      ),
    );
  }
  assert.throws(() =>
    deserialize(
      JSON.stringify({
        format: "form-studio",
        version: 2,
        design: { ...fresh("bookshelf"), parts: { base: { width: 30 } } },
      }),
    ),
  );
  assert.throws(() =>
    normalizeParts(
      fresh(),
      { column: { diameter: Infinity } },
      MATERIALS,
      true,
    ),
  );
  assert.throws(() =>
    deserialize(
      JSON.stringify({
        format: "form-studio",
        version: 1,
        design: { ...fresh(), parts: { column: { diameter: 5 } } },
      }),
    ),
  );
});

test("storage migration preserves v1, reports write failure, and never hides corrupt v2 behind older data", () => {
  const v1 = readFileSync(
    new URL("./fixtures/cafe-table-v1.json", import.meta.url),
    "utf8",
  );
  const entries = new Map([[LEGACY_STORE, v1]]);
  const storage = {
    getItem: (k) => entries.get(k) ?? null,
    setItem: (k, v) => entries.set(k, v),
  };
  assert.equal(loadWorkspace(storage).design.width, 90);
  assert.equal(JSON.parse(entries.get(STORE)).version, 2);
  assert.equal(entries.get(LEGACY_STORE), v1);
  entries.set(STORE, "broken");
  assert.equal(loadWorkspace(storage).status, "corrupt");
  assert.equal(entries.get(STORE), "broken");
  entries.delete(STORE);
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

test("part dimension language cannot partially mutate the whole object", () => {
  for (const text of [
    "column diameter 8 cm and 90 cm wide",
    "tabletop thickness 3 cm",
    "base width 50 cm",
  ]) {
    const result = parsePrompt(text, fresh());
    assert.deepEqual(result.design, fresh());
    assert.equal(result.changes.length, 0);
    assert.match(result.warnings[0], /Individual parts/);
  }
});

test("ray picking selects nearest actual triangles across views, sizes and empty gaps", () => {
  const d = fresh(),
    m = buildAssemblyModel(d);
  const viewer = Object.create(Viewer.prototype);
  Object.assign(viewer, { design: d, zoom: 1 });
  for (const [yaw, pitch] of [
    [0.72, 0.34],
    [0, 0.06],
    [0, 1.56],
  ])
    for (const [w, h] of [
      [900, 600],
      [300, 350],
    ]) {
      Object.assign(viewer, { yaw, pitch });
      const cam = viewer.camera(w, h);
      const point = [0, d.height / 100, 0],
        delta = point.map((n, i) => n - cam.target[i]);
      const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
      const x = w / 2 + (dot(delta, cam.x) * h) / cam.size,
        y = h / 2 - (dot(delta, cam.y) * h) / cam.size;
      assert.equal(pickPart(m, cam, x, y, w, h), "tabletop");
      assert.equal(pickPart(m, cam, 0, 0, w, h), null);
    }
  // A top-down ray inside the base's box but between its feet must miss the base.
  const base = part(m, "base"),
    onlyBase = { ...m, parts: [base] };
  const cam = {
    target: [0, 0, 0],
    x: [1, 0, 0],
    y: [0, 0, -1],
    z: [0, 1, 0],
    size: 1,
  };
  assert.equal(pickPart(onlyBase, cam, 650, 500, 1000, 1000), null);
});

test("unrelated catalog geometry retains its legacy vertex layout", () => {
  const hashes = JSON.parse(
    readFileSync(
      new URL("./fixtures/v1-geometry-hashes.json", import.meta.url),
      "utf8",
    ),
  );
  for (const d of CATALOG.filter((d) => !supportsParts(d))) {
    const m = buildAssemblyModel(d, true);
    assert.deepEqual(m.parts, []);
    assert.equal(
      createHash("sha256").update(Buffer.from(m.data.buffer)).digest("hex"),
      hashes[d.id],
      d.id,
    );
  }
});
