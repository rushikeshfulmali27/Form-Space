import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "../scripts/serve.mjs";
import { build, root, outputFiles } from "../scripts/build.mjs";
import {
  CATALOG,
  LIMITS,
  fresh,
  normalize,
  deserialize,
  serialize,
  History,
  MAX_IMPORT_BYTES,
} from "../public/studio/design.js";
import {
  loadWorkspace,
  saveWorkspace,
  STORE,
  storageMessage,
} from "../public/studio/storage.js";
import { buildModel, bounds } from "../public/studio/geometry.js";
import { Viewer } from "../public/studio/viewer.js";
import path from "node:path";
import { request } from "node:http";

test("imports reject malformed fields, unsupported properties, units and oversized UTF-8 without changing history", () => {
  const h = new History(fresh());
  const invalid = [
    { width: null },
    { width: "" },
    { height: 1e300 },
    { depth: 0 },
    { width: true },
    { color: "red" },
    { accent: ["#ffffff"] },
    { material: "constructor" },
    { material: "__proto__" },
    { shape: "sphere" },
    { shelves: 4 },
  ];
  for (const patch of invalid)
    assert.throws(
      () =>
        deserialize(
          JSON.stringify({
            format: "form-studio",
            version: 1,
            design: { ...fresh(), ...patch },
          }),
        ),
      JSON.stringify(patch),
    );
  assert.throws(() =>
    deserialize(
      JSON.stringify({
        format: "form-studio",
        version: 1,
        units: "in",
        design: fresh(),
      }),
    ),
  );
  assert.throws(() => deserialize(" ".repeat(MAX_IMPORT_BYTES + 1)));
  assert.throws(() => deserialize("é".repeat(MAX_IMPORT_BYTES / 2 + 1)));
  assert.deepEqual(h.current, fresh());
  assert.equal(h.canUndo, false);
  assert.equal(normalize({ width: null }).width, 80);
  assert.equal(normalize({ width: false }).width, 80);
  assert.equal(normalize({ width: "" }).width, 80);
  assert.equal(normalize({ material: "constructor" }).material, "oak");
});

test("workspace distinguishes new, corrupt, blocked and saved storage; failed writes do not claim success", () => {
  const entries = new Map(),
    storage = {
      getItem: (k) => entries.get(k) ?? null,
      setItem: (k, v) => entries.set(k, v),
    };
  assert.equal(loadWorkspace(storage).status, "new");
  assert.doesNotMatch(storageMessage("new"), /^Saved/);
  entries.set(STORE, "broken");
  assert.equal(loadWorkspace(storage).status, "corrupt");
  assert.equal(entries.get(STORE), "broken");
  assert.equal(saveWorkspace(storage, fresh("bookshelf")), "saved");
  assert.equal(loadWorkspace(storage).design.id, "bookshelf");
  const blocked = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("quota");
    },
  };
  assert.equal(loadWorkspace(blocked).status, "unavailable");
  assert.equal(saveWorkspace(blocked, fresh()), "unavailable");
  assert.doesNotMatch(storageMessage("unavailable"), /^Saved/);
});

test("all catalog objects remain finite with bounds and normals at combined minimum and maximum dimensions", () => {
  for (const object of CATALOG)
    for (const side of [0, 1]) {
      const d = normalize({
        ...object,
        ...Object.fromEntries(
          ["width", "depth", "height"].map((k) => [k, LIMITS[k][side]]),
        ),
      });
      const mesh = buildModel(d, true),
        b = bounds(mesh);
      assert.ok(mesh.every(Number.isFinite), object.id);
      for (const [i, key] of ["width", "height", "depth"].entries())
        assert.ok(
          Math.abs(b.size[i] - d[key] / 100) < 1e-5,
          object.id + " " + key,
        );
      for (let i = 0; i < mesh.length; i += 10)
        assert.ok(
          Math.abs(Math.hypot(...mesh.slice(i + 3, i + 6)) - 1) < 1e-4,
          object.id,
        );
      assert.deepEqual(deserialize(serialize(d)), d);
    }
});

test("idle viewer schedules no frames and unchanged state reuses geometry", () => {
  const viewer = Object.create(Viewer.prototype);
  viewer.render = () => {};
  viewer.update(fresh());
  const data = viewer.data;
  viewer.update(fresh());
  assert.equal(viewer.data, data);
  viewer.update({ ...fresh(), width: 120 });
  assert.notEqual(viewer.data, data);
  const before = {
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
  };
  let frames = 0;
  globalThis.document = { hidden: false };
  globalThis.requestAnimationFrame = () => {
    frames++;
  };
  try {
    viewer.auto = false;
    assert.equal(frames, 0);
    viewer.auto = true;
    assert.equal(frames, 1);
    viewer.auto = true;
    assert.equal(frames, 1);
    viewer.auto = false;
    viewer.animate(20);
    assert.equal(frames, 1);
  } finally {
    Object.assign(globalThis, before);
  }
});

test("static production build is deterministic, allowlisted, contains no API code and serves safely at a subpath", async () => {
  const first = await build(),
    second = await build();
  assert.deepEqual(second, first);
  const walk = async (dir) =>
    (
      await Promise.all(
        (await readdir(dir, { withFileTypes: true })).map(async (e) =>
          e.isDirectory()
            ? walk(path.join(dir, e.name))
            : path
                .relative(path.join(root, "dist"), path.join(dir, e.name))
                .replaceAll("\\", "/"),
        ),
      )
    ).flat();
  assert.deepEqual(
    (await walk(path.join(root, "dist"))).sort(),
    [...outputFiles].sort(),
  );
  for (const file of [
    "index.html",
    ...outputFiles.filter((f) => f.endsWith(".js")),
  ])
    assert.doesNotMatch(
      await readFile(path.join(root, "dist", file), "utf8"),
      /OPENAI_API_KEY|api\.openai|\/api\/design|prompt-design|\bfetch\(|XMLHttpRequest|WebSocket/,
    );
  const server = createServer({ prefix: "/FORM_Studio" });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const home = await fetch(origin + "/FORM_Studio/");
    assert.equal(home.status, 200);
    assert.match(await home.text(), /Object Studio v1.11/);
    assert.match(
      home.headers.get("content-security-policy"),
      /connect-src 'none'/,
    );
    const asset = await fetch(origin + "/FORM_Studio/studio/app.js");
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get("content-type"), /javascript/);
    for (const route of [
      "/api/design",
      "/prompt-design",
      "/.env.local",
      "/work/pre-v1-local/server/generate.js",
      "/studio/generation.js",
      "/scripts/serve.mjs",
      "/%2e%2e/.env.local",
      "/studio/..%5c..%5c.env.local",
    ])
      assert.equal(
        (await fetch(origin + "/FORM_Studio" + route)).status,
        404,
        route,
      );
    assert.equal(
      (await fetch(origin + "/FORM_Studio/", { method: "POST", body: "{}" }))
        .status,
      405,
    );
    const invalidHost = await new Promise((resolve, reject) => {
      const req = request(
        origin + "/FORM_Studio/",
        { headers: { host: "attacker.invalid" } },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      req.on("error", reject);
      req.end();
    });
    assert.equal(invalidHost, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
