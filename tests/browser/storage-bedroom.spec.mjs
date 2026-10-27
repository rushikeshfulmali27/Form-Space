import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const cases = [
  ["bookshelf", "shelves.02", "thickness"],
  ["wall-shelving", "shelves.02", "height"],
  ["display-rack", "posts.front-left", "section"],
  ["shoe-rack", "shelves.02", "height"],
  ["display-cabinet", "shelves.02", "height"],
  ["tv-unit", "fronts.02", "thickness"],
  ["wardrobe", "handles.02", "section"],
  ["bedside-table", "fronts.02", "thickness"],
  ["filing-cabinet", "fronts.02", "thickness"],
  ["drawer-unit", "handles.02", "section"],
  ["storage-locker", "fronts.02", "thickness"],
  ["wall-shelf", "board", "thickness"],
  ["bed-frame", "mattress", "thickness"],
  ["dressing-table", "worktop", "height"],
  ["kitchen-island", "top", "thickness"],
];
test.beforeEach(async ({ page }) => {
  page.__errors = [];
  page.on("pageerror", (e) => page.__errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") page.__errors.push(m.text());
  });
  page.on("requestfailed", (r) => page.__errors.push(r.url()));
  page.on("response", (r) => {
    if (r.status() >= 400) page.__errors.push(`HTTP ${r.status()}`);
  });
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5180/FORM_Studio/") &&
      !r.url().startsWith("data:")
    )
      page.__errors.push("External request");
  });
});
test.afterEach(async ({ page }) => expect(page.__errors).toEqual([]));
async function select(page, id) {
  const parent = id.includes(".") ? id.split(".")[0] : null;
  if (
    parent &&
    (await page
      .locator(`#parts-expand-${parent}`)
      .getAttribute("aria-expanded")) === "false"
  )
    await page.locator(`#parts-expand-${parent}`).click();
  await page.locator(`[data-part="${id}"]`).click();
}
for (const [object, part, key] of cases)
  test(`${object}: component edit, real export/import, history and reload`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${object}"]`).click();
    await page.locator("#edit-parts").click();
    await select(page, part);
    const input = page.locator(`#part-${key}`),
      min = Number(await input.getAttribute("min")),
      max = Number(await input.getAttribute("max"));
    const value = Math.round((min + (max - min) * 0.65) * 100) / 100;
    await input.fill(String(value));
    await input.press("Tab");
    await page.locator("#part-material").selectOption("metal");
    await expect(page.locator("#save-status")).toHaveText(
      "Saved on this device",
    );
    const download = page.waitForEvent("download");
    await page.locator("#export").click();
    const text = await readFile(await (await download).path(), "utf8"),
      saved = JSON.parse(text);
    expect(saved.design.id).toBe(object);
    expect(saved.design.partsRevision).toBe(1);
    expect(saved.design.parts[part][key]).toBe(value);
    expect(saved.design.parts[part].material).toBe("metal");
    await page.locator("#reset-part").click();
    await page.locator("#undo").click();
    await expect(input).toHaveValue(String(value));
    await page.reload();
    await page.locator("#edit-parts").click();
    await select(page, part);
    await expect(page.locator(`#part-${key}`)).toHaveValue(String(value));
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.locator("#reset-part").click();
    await page.locator("#import-file").setInputFiles({
      name: "component.json",
      mimeType: "application/json",
      buffer: Buffer.from(text),
    });
    await expect(page.locator(`#part-${key}`)).toHaveValue(String(value));
    if (["bookshelf", "wardrobe", "bed-frame"].includes(object)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `docs/images/next15-${object}-${info.project.name}.png`,
        fullPage: true,
        style: "#toast { visibility: hidden; }",
      });
    } else if (info.project.name === "desktop") {
      await page
        .locator("#scene")
        .screenshot({ path: `work/next15-${object}.png` });
    }
  });

for (const [object] of cases.slice(0, 5))
  test(`${object}: count shrink, undo, re-add, clamped placement and selected-slot reconciliation`, async ({
    page,
  }) => {
    await page.goto("./");
    await page.locator(`[data-object="${object}"]`).click();
    await page.locator("#edit-parts").click();
    const count = page.locator("#construction-shelves"),
      last = object === "display-cabinet" ? "shelves.05" : "shelves.06";
    await expect(page.locator("#shelf-section")).toBeHidden();
    await count.selectOption("6");
    await select(page, "shelves.01");
    await page.locator("#part-material").selectOption("metal");
    await select(page, last);
    await page.locator("#part-thickness").fill("0.5");
    await page.locator("#part-thickness").press("Tab");
    await count.focus();
    await count.selectOption("2");
    await expect(page.locator(`[data-part="${last}"]`)).toHaveCount(0);
    await expect(page.locator('[data-part="shelves"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(count).toBeFocused();
    await page.locator("#undo").click();
    await expect(count).toHaveValue("6");
    await select(page, last);
    await expect(page.locator("#part-thickness")).toHaveValue("0.5");
    await count.selectOption("2");
    await count.selectOption("6");
    await select(page, last);
    await expect(page.locator("#part-thickness")).not.toHaveValue("0.5");
    await select(page, "shelves.01");
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await select(page, "shelves");
    await page.locator("#part-material").selectOption("walnut");
    await page.locator("#apply-group").click();
    await select(page, "shelves.01");
    await expect(page.locator("#part-material")).toHaveValue("walnut");
    await page.locator("#undo").click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await select(page, "shelves.02");
    const max = await page.locator("#part-height").getAttribute("max");
    await page.locator("#part-height").fill("999");
    await page.locator("#part-height").press("Tab");
    await expect(page.locator("#part-height")).toHaveValue(max);
    await page.reload();
    await page.locator("#edit-parts").click();
    await expect(count).toHaveValue("6");
  });

for (const [object, target, view, pitch] of [
  ["bookshelf", "shelves.02", "front", 0.06],
  ["wardrobe", "fronts.02", "front", 0.06],
  ["bed-frame", "pillows.left", "top", 1.56],
])
  test(`${object}: mouse/touch canvas selection in WebGL and software fallback`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${object}"]`).click();
    await page.locator("#edit-parts").click();
    await page.locator(`[data-view="${view}"]`).click();
    for (const fallback of [false, true]) {
      if (fallback) {
        await page.evaluate(() =>
          document
            .querySelector("#scene")
            .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
        );
        await expect(page.locator("#renderer-status")).toContainText(
          "Software",
        );
      }
      await page.locator("#scene").scrollIntoViewIfNeeded();
      const pos = await page.evaluate(
        async ({ object, target, pitch }) => {
          const { fresh } = await import(
            new URL("studio/design.js", location.href)
          );
          const { buildAssemblyModel } = await import(
            new URL("studio/geometry.js", location.href)
          );
          const { Viewer } = await import(
            new URL("studio/viewer.js", location.href)
          );
          const d = fresh(object),
            b = buildAssemblyModel(d).parts.find((p) => p.id === target).bounds,
            v = Object.create(Viewer.prototype),
            r = document.querySelector("#scene").getBoundingClientRect();
          Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch });
          const cam = v.camera(r.width, r.height);
          const point =
            pitch > 1
              ? [(b.min[0] + b.max[0]) / 2, b.max[1], (b.min[2] + b.max[2]) / 2]
              : [
                  (b.min[0] + b.max[0]) / 2,
                  (b.min[1] + b.max[1]) / 2,
                  b.max[2],
                ];
          const delta = point.map((n, i) => n - cam.target[i]),
            dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
          return {
            x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
            y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
          };
        },
        { object, target, pitch },
      );
      if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
      else await page.touchscreen.tap(pos.x, pos.y);
      await expect(page.locator(`[data-part="${target}"]`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.locator("#scene").focus();
      await page.keyboard.press("Escape");
      await expect(page.locator("#selected-part-name")).toHaveText(
        "Select a part",
      );
    }
  });

test("new profiles: legacy storage migration and invalid import preserves saved design/history", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "form-studio.workspace.v3",
      JSON.stringify({
        format: "form-studio",
        version: 3,
        units: "cm",
        design: {
          id: "display-cabinet",
          width: 90,
          height: 160,
          depth: 35,
          shelves: 5,
        },
      }),
    ),
  );
  await page.goto("./");
  await page.locator("#edit-parts").click();
  await expect(page.locator("#construction-shelves")).toHaveValue("5");
  await select(page, "shelves.04");
  await page.locator("#part-material").selectOption("metal");
  const saved = await page.evaluate(() =>
    localStorage.getItem("form-studio.workspace.v3"),
  );
  for (const change of [
    { shelves: 2.5 },
    { partsRevision: 2 },
    { parts: { "shelves.06": { thickness: 1 } } },
    { construction: { shelfCount: 6 } },
  ]) {
    const invalid = JSON.parse(saved);
    Object.assign(invalid.design, change);
    await page.locator("#import-file").setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(invalid)),
    });
    expect(
      await page.evaluate(() =>
        localStorage.getItem("form-studio.workspace.v3"),
      ),
    ).toBe(saved);
  }
  await page.locator("#undo").click();
  await expect(page.locator("#part-material")).not.toHaveValue("metal");
  const beforePrompt = await page.evaluate(() =>
    localStorage.getItem("form-studio.workspace.v3"),
  );
  await page.locator("#prompt").fill("door width 25 cm");
  await page.locator("#prompt-form").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#prompt-feedback")).toContainText(
    "Individual parts",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(beforePrompt);
});
