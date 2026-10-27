import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
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

test("office chair: independent members, group operations, real export/import and reload", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.locator('[data-object="office-chair"]').click();
  await page.locator("#edit-parts").click();
  await expect(page.locator("#construction-cushionCount")).toHaveCount(0);
  await page.locator('[data-part="seat"]').click();
  await page.locator("#part-height").fill("55");
  await page.locator("#part-height").press("Tab");
  await page.locator("#part-thickness").fill("8");
  await page.locator("#part-thickness").press("Tab");
  await page.locator('[data-part="column"]').click();
  await expect(page.locator("#column-height")).toContainText("Column height:");
  await page.locator("#part-diameter").fill("5");
  await page.locator("#part-diameter").press("Tab");
  await page.locator('[data-part="armrests"]').click();
  await page.locator("#part-height").fill("72");
  await page.locator("#part-height").press("Tab");
  await page.locator("#parts-expand-armrests").click();
  await page.locator('[data-part="armrests.left"]').click();
  await page.locator("#part-height").fill("80");
  await page.locator("#part-height").press("Tab");
  await page.locator('[data-part="casters"]').click();
  await page.locator("#part-diameter").fill("4");
  await page.locator("#part-diameter").press("Tab");
  await page.locator("#parts-expand-casters").click();
  await page.locator('[data-part="casters.03"]').click();
  await page.locator("#part-diameter").fill("6");
  await page.locator("#part-diameter").press("Tab");
  await page.locator("#part-material").selectOption("metal");
  await page.locator('[data-part="casters"]').click();
  await page.locator("#part-diameter").fill("5");
  await page.locator("#part-diameter").press("Tab");
  await page.locator('[data-part="casters.01"]').click();
  await expect(page.locator("#part-diameter")).toHaveValue("5");
  await page.locator('[data-part="casters.03"]').click();
  await expect(page.locator("#part-diameter")).toHaveValue("6");
  await page.locator('[data-part="star-base"]').click();
  await page.locator("#part-section").fill("2");
  await page.locator("#part-section").press("Tab");
  await page.locator("#parts-expand-star-base").click();
  await page.locator('[data-part="star-base.02"]').click();
  await page.locator("#part-section").fill("3");
  await page.locator("#part-section").press("Tab");
  await page.locator("#part-material").selectOption("walnut");
  const download = page.waitForEvent("download");
  await page.locator("#export").click();
  const text = await readFile(await (await download).path(), "utf8"),
    saved = JSON.parse(text);
  expect(saved.design.id).toBe("office-chair");
  expect(saved.design.partsRevision).toBe(1);
  expect(saved.design.parts["casters.03"].diameter).toBe(6);
  expect(saved.design.parts["star-base.02"].section).toBe(3);
  await page.reload();
  await page.locator("#edit-parts").click();
  await page.locator("#parts-expand-casters").click();
  await page.locator('[data-part="casters.03"]').click();
  await expect(page.locator("#part-diameter")).toHaveValue("6");
  await expect(page.locator("#part-material")).toHaveValue("metal");
  await page.locator('[data-part="casters"]').click();
  await page.locator("#apply-group").click();
  await page.locator('[data-part="casters.03"]').click();
  await expect(page.locator("#part-diameter")).toHaveValue("5");
  await page.locator("#undo").click();
  await expect(page.locator("#part-diameter")).toHaveValue("6");
  await page.locator('[data-part="casters"]').click();
  await page.locator("#reset-part").click();
  await page.locator('[data-part="casters.03"]').click();
  await expect(page.locator("#part-diameter")).toHaveValue("5.4");
  await page.locator("#import-file").setInputFiles({
    name: "chair.json",
    mimeType: "application/json",
    buffer: Buffer.from(text),
  });
  await expect(page.locator("#part-diameter")).toHaveValue("6");
  await page.locator("#parts-expand-star-base").click();
  await page.locator('[data-part="star-base.02"]').click();
  await expect(page.locator("#part-section")).toHaveValue("3");
  await expect(page.locator("#part-material")).toHaveValue("walnut");
  await page.locator("#scene").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/images/office-chair-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("office chair: caster mouse/touch picking and editing work in software fallback", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.locator('[data-object="office-chair"]').click();
  await page.locator("#edit-parts").click();
  await page.locator('[data-view="front"]').click();
  for (const fallback of [false, true]) {
    if (fallback) {
      await page.evaluate(() =>
        document
          .querySelector("#scene")
          .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
      );
      await expect(page.locator("#renderer-status")).toContainText("Software");
    }
    await page.locator("#scene").scrollIntoViewIfNeeded();
    const pos = await page.evaluate(async () => {
      const { fresh } = await import(
          new URL("studio/design.js", location.href)
        ),
        { resolveParts } = await import(
          new URL("studio/parts.js", location.href)
        ),
        { solveOfficeChair } = await import(
          new URL("studio/parts-office-chair.js", location.href)
        ),
        { Viewer } = await import(new URL("studio/viewer.js", location.href));
      const d = fresh("office-chair"),
        slot = solveOfficeChair(d, resolveParts(d)).slots[0],
        v = Object.create(Viewer.prototype),
        r = document.querySelector("#scene").getBoundingClientRect();
      Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 0.06 });
      const cam = v.camera(r.width, r.height),
        point = [slot.x, slot.height / 2, slot.z],
        delta = point.map((n, i) => n - cam.target[i]),
        dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
      return {
        x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
        y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
      };
    });
    if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
    else await page.touchscreen.tap(pos.x, pos.y);
    await expect(page.locator('[data-part="casters.01"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#parts-expand-casters")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.locator("#scene").focus();
    await page.keyboard.press("Escape");
    await expect(page.locator("#selected-part-name")).toHaveText(
      "Select a part",
    );
  }
  await page.locator('[data-part="casters.01"]').click();
  await page.locator("#part-diameter").fill("4");
  await page.locator("#part-diameter").press("Tab");
  await expect(page.locator("#save-status")).toHaveText("Saved on this device");
  await page.locator('[data-object="sofa"]').click();
  await expect(page.locator("#selected-part-name")).toHaveText("Select a part");
  await expect(page.locator("#construction-cushionCount")).toBeVisible();
});

test("office chair: old v3 storage migrates and invalid slots or construction preserve history", async ({
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
          id: "office-chair",
          width: 67,
          height: 115,
          depth: 65,
          material: "matte",
          color: "#282e2c",
          accent: "#aab1b1",
        },
      }),
    ),
  );
  await page.goto("./");
  await expect(page.locator("#width-number")).toHaveValue("67");
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="casters"]').click();
  await page.locator("#part-diameter").fill("4");
  await page.locator("#part-diameter").press("Tab");
  const before = await page.evaluate(() =>
      localStorage.getItem("form-studio.workspace.v3"),
    ),
    file = JSON.parse(before);
  file.design.parts["casters.06"] = { diameter: 4 };
  await page.locator("#import-file").setInputFiles({
    name: "bad-slot.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.locator("#toast")).toContainText("Invalid part");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
  delete file.design.parts["casters.06"];
  file.design.construction = { casterCount: 6 };
  await page.locator("#import-file").setInputFiles({
    name: "bad-count.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.locator("#toast")).toContainText("construction");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
  await page.locator("#undo").click();
  await expect(page.locator("#part-diameter")).toHaveValue("5.4");
});
