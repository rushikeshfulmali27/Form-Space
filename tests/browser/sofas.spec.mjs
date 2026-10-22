import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const IDS = ["sofa", "reception-sofa"];
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

for (const id of IDS)
  test(`${id}: dynamic members, focus, atomic history, real export/import and reload`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    const count = page.locator("#construction-cushionCount");
    await count.selectOption("4");
    await page.locator("#parts-expand-cushions").click();
    await page.locator('[data-part="cushions.04"]').click();
    await page.locator("#part-thickness").fill("10");
    await page.locator("#part-thickness").press("Tab");
    await page.locator("#part-material").selectOption("metal");
    await page.locator('[data-part="cushions.01"]').click();
    await page.locator("#part-material").selectOption("walnut");
    await count.focus();
    await count.selectOption("3");
    await expect(count).toBeFocused();
    await expect(page.locator('[data-part="cushions.01"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#part-material")).toHaveValue("walnut");
    await expect(page.locator("#parts-expand-cushions")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.locator("#undo").click();
    await expect(count).toHaveValue("4");
    await page.locator('[data-part="cushions.04"]').click();
    await expect(page.locator("#part-thickness")).toHaveValue("10");
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await count.focus();
    await count.selectOption("2");
    await expect(count).toBeFocused();
    await expect(page.locator("#selected-part-name")).toHaveText(
      "Editing: All cushions",
    );
    await expect(page.locator('[data-part="cushions.04"]')).toHaveCount(0);
    let saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("form-studio.workspace.v3")),
    );
    expect(saved.design.parts["cushions.04"]).toBeUndefined();
    expect(saved.design.parts["cushions.01"].material).toBe("walnut");
    await page.locator("#undo").click();
    await expect(count).toHaveValue("4");
    await page.locator('[data-part="cushions.04"]').click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await count.selectOption("2");
    await count.selectOption("4");
    await page.locator('[data-part="cushions.04"]').click();
    await expect(page.locator("#part-material")).toHaveValue("matte");
    await page.locator('[data-part="cushions.01"]').click();
    await expect(page.locator("#part-material")).toHaveValue("walnut");
    const download = page.waitForEvent("download");
    await page.locator("#export").click();
    const text = await readFile(await (await download).path(), "utf8");
    saved = JSON.parse(text);
    expect(saved.design.construction.cushionCount).toBe(4);
    expect(saved.design.partsRevision).toBe(1);
    await page.reload();
    await page.locator("#edit-parts").click();
    await expect(count).toHaveValue("4");
    await page.locator("#parts-expand-cushions").click();
    await page.locator('[data-part="cushions.01"]').click();
    await expect(page.locator("#part-material")).toHaveValue("walnut");
    await count.selectOption("1");
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "sofa.json",
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await expect(count).toHaveValue("4");
    await expect(page.locator('[data-part="cushions.01"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.locator("#scene").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/images/sofa-${id}-${info.project.name}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("sofa count remains explicit across width changes and groups apply/reset without deleting membership", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('[data-object="sofa"]').click();
  await page.locator("#edit-parts").click();
  await page.locator("#construction-cushionCount").selectOption("4");
  await page.locator("#parts-expand-cushions").click();
  await page.locator('[data-part="cushions.03"]').click();
  await page.locator("#part-thickness").fill("9");
  await page.locator("#part-thickness").press("Tab");
  await page.locator('[data-part="cushions"]').click();
  await page.locator("#part-thickness").fill("8");
  await page.locator("#part-thickness").press("Tab");
  await page.locator("#apply-group").click();
  await page.locator('[data-part="cushions.03"]').click();
  await expect(page.locator("#part-thickness")).toHaveValue("8");
  await page.locator("#undo").click();
  await expect(page.locator("#part-thickness")).toHaveValue("9");
  await page.locator("#edit-whole").click();
  await page.locator("#width-number").fill("180");
  await page.locator("#width-number").press("Tab");
  await page.locator("#edit-parts").click();
  await expect(page.locator("#construction-cushionCount")).toHaveValue("4");
  await page.locator('[data-part="cushions"]').click();
  await page.locator("#reset-part").click();
  await expect(page.locator("#construction-cushionCount")).toHaveValue("4");
});

test("legacy sofa storage captures count and malformed construction imports preserve design/history", async ({
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
          id: "sofa",
          width: 190.4,
          height: 82,
          depth: 90,
          material: "matte",
          color: "#92a18b",
          accent: "#79553c",
        },
      }),
    ),
  );
  await page.goto("./");
  await page.locator("#edit-parts").click();
  await expect(page.locator("#construction-cushionCount")).toHaveValue("3");
  await page.locator("#construction-cushionCount").selectOption("4");
  const before = await page.evaluate(() =>
      localStorage.getItem("form-studio.workspace.v3"),
    ),
    file = JSON.parse(before);
  file.design.construction.cushionCount = 5;
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "bad-count.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(file)),
    });
  await expect(page.locator("#toast")).toContainText("construction");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
  file.design.construction.cushionCount = 1;
  file.design.parts = { "cushions.04": { thickness: 8 } };
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "inactive.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(file)),
    });
  await expect(page.locator("#toast")).toContainText("Invalid part");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
  await page.locator("#undo").click();
  await expect(page.locator("#construction-cushionCount")).toHaveValue("3");
});

for (const id of IDS)
  test(`${id}: canvas selection and count reconciliation work in software fallback`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    await page.locator('[data-view="top"]').click();
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
      const pos = await page.evaluate(async (id) => {
        const { fresh } = await import(
            new URL("studio/design.js", location.href)
          ),
          { buildAssemblyModel } = await import(
            new URL("studio/geometry.js", location.href)
          ),
          { Viewer } = await import(new URL("studio/viewer.js", location.href));
        const d = fresh(id),
          b = buildAssemblyModel(d).parts.find(
            (p) => p.id === "cushions.01",
          ).bounds,
          v = Object.create(Viewer.prototype),
          r = document.querySelector("#scene").getBoundingClientRect();
        Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 1.56 });
        const cam = v.camera(r.width, r.height),
          point = [
            (b.min[0] + b.max[0]) / 2,
            b.max[1],
            (b.min[2] + b.max[2]) / 2,
          ],
          delta = point.map((n, i) => n - cam.target[i]),
          dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
        return {
          x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
          y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
        };
      }, id);
      if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
      else await page.touchscreen.tap(pos.x, pos.y);
      await expect(page.locator('[data-part="cushions.01"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.locator("#scene").focus();
      await page.keyboard.press("Escape");
    }
    await page.locator("#construction-cushionCount").selectOption("4");
    await page.locator('[data-part="cushions.04"]').click();
    await page.locator("#construction-cushionCount").selectOption("1");
    await expect(page.locator("#selected-part-name")).toHaveText(
      "Editing: All cushions",
    );
    await page.locator("#part-thickness").fill("8");
    await page.locator("#part-thickness").press("Tab");
    await expect(page.locator("#save-status")).toHaveText(
      "Saved on this device",
    );
    await page.locator('[data-object="work-desk"]').click();
    await expect(page.locator("#selected-part-name")).toHaveText(
      "Select a part",
    );
    await expect(page.locator("#construction-cushionCount")).toHaveCount(0);
  });
