import test from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG,
  TAXONOMY,
  filterCatalog,
  normalize,
  fresh,
  serialize,
  deserialize,
  parsePrompt,
} from "../public/studio/design.js";

test("all 17 requested subcategories are populated under their correct main category", () => {
  assert.equal(TAXONOMY.length, 4);
  assert.equal(TAXONOMY.flatMap((c) => c.subcategories).length, 17);
  assert.equal(CATALOG.length, 72);
  assert.equal(new Set(CATALOG.map((o) => o.id)).size, 72);
  const expected = { Home: 27, Office: 16, Cafe: 13, Shop: 16 };
  for (const c of TAXONOMY) {
    assert.equal(
      filterCatalog(CATALOG, { category: c.id }).length,
      expected[c.id],
    );
    for (const sub of c.subcategories) {
      const results = filterCatalog(CATALOG, {
        category: c.id,
        subcategory: sub.id,
      });
      assert.ok(results.length > 0, sub.id);
      assert.ok(results.every((o) => o.category === c.id));
    }
  }
  for (const o of CATALOG) {
    const owner = TAXONOMY.find((c) => c.id === o.category);
    assert.ok(
      owner?.subcategories.some((s) => s.id === o.subcategory),
      o.id,
    );
    assert.deepEqual(
      normalize(o),
      fresh(o.id),
      o.id + " defaults survive normalization with current revision",
    );
  }
});
test("search combines with category and subcategory filters and ignores accents", () => {
  assert.deepEqual(
    filterCatalog(CATALOG, {
      category: "Home",
      subcategory: "home-bedroom",
      query: "wardrobe",
    }).map((o) => o.id),
    ["wardrobe"],
  );
  assert.deepEqual(
    filterCatalog(CATALOG, { query: "café" }),
    filterCatalog(CATALOG, { query: "cafe" }),
  );
  assert.equal(
    filterCatalog(CATALOG, { category: "Home", query: "lighting" }).length,
    5,
  );
  assert.equal(
    filterCatalog(CATALOG, { category: "Shop", subcategory: "home-bedroom" })
      .length,
    0,
  );
  assert.equal(
    filterCatalog(CATALOG, { query: "there is no such object" }).length,
    0,
  );
});
test("every catalog object can be selected by a prompt, edited and exported", () => {
  for (const object of CATALOG) {
    const edit = parsePrompt(
      `Switch to ${object.name} and make it blue`,
      fresh(),
    );
    assert.equal(edit.design.id, object.id, object.name);
    assert.equal(edit.design.color, "#597a93", object.name);
    assert.equal(
      edit.warnings.length,
      0,
      object.name + ": " + edit.warnings.join(" "),
    );
    assert.deepEqual(deserialize(serialize(edit.design)), edit.design);
  }
});
test("old eight-object designs acquire taxonomy without losing edits", () => {
  for (const id of [
    "cafe-table",
    "lounge-chair",
    "floor-lamp",
    "work-desk",
    "bookshelf",
    "bar-stool",
    "display-plinth",
    "display-rack",
  ]) {
    const old = { ...fresh(id), color: "#123456", width: 99 };
    delete old.subcategory;
    const migrated = deserialize(
      JSON.stringify({
        format: "form-studio",
        version: 1,
        units: "cm",
        design: old,
      }),
    );
    assert.equal(migrated.width, 99);
    assert.equal(migrated.color, "#123456");
    assert.ok(migrated.subcategory);
  }
});

test("software previews respect depth for overlapping parts rather than triangle centers", async () => {
  const { drawSoftware } = await import("../public/studio/viewer.js");
  let rendered;
  const ctx = {
    clearRect() {},
    createImageData: (w, h) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    putImageData: (p) => (rendered = p),
  };
  const data = [];
  const triangle = (p, color) => {
    for (const v of p) data.push(...v, 0, 0, 1, ...color, 0);
  };
  // The nearer red plane overlaps a larger green plane. The second face is
  // deliberately drawn later, as happens with shelves, frames and cabinet doors.
  triangle(
    [
      [-0.5, -0.5, 0.2],
      [0.5, -0.5, 0.2],
      [0, 0.5, 0.2],
    ],
    [1, 0, 0],
  );
  triangle(
    [
      [-1, -1, 0],
      [1, -1, 0],
      [0, 1, 0],
    ],
    [0, 1, 0],
  );
  drawSoftware(ctx, new Float32Array(data), 100, 100, {
    target: [0, 0, 0],
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1],
    size: 2,
  });
  const off = (50 * 100 + 50) * 4;
  assert.ok(rendered.data[off] > 0);
  assert.equal(rendered.data[off + 1], 0);
  assert.equal(rendered.data[off + 3], 255);
});
