import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  page.__errors = [];
  page.on("pageerror", (e) => page.__errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") page.__errors.push(m.text());
  });
  page.on("requestfailed", (r) => page.__errors.push(r.url()));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5180/FORM_Studio/") &&
      !r.url().startsWith("data:")
    )
      page.__errors.push("External request");
  });
  page.on("response", (r) => {
    if (r.status() >= 400) page.__errors.push("HTTP " + r.status());
  });
});
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([]);
});

async function clickColumn(page, id, touch) {
  await page.locator("#scene").scrollIntoViewIfNeeded();
  const position = await page.evaluate(async (id) => {
    const { Viewer } = await import(new URL("studio/viewer.js", location.href));
    const { fresh } = await import(new URL("studio/design.js", location.href));
    const d = fresh(id),
      r = document.querySelector("#scene").getBoundingClientRect(),
      v = Object.create(Viewer.prototype);
    Object.assign(v, { design: d, yaw: 0, pitch: 0.06, zoom: 1 });
    const cam = v.camera(r.width, r.height),
      p = [0, d.height / 200, 0],
      delta = p.map((n, i) => n - cam.target[i]);
    const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
    return {
      x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
      y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
    };
  }, id);
  if (touch) await page.touchscreen.tap(position.x, position.y);
  else await page.mouse.click(position.x, position.y);
}

for (const id of ["side-table", "square-cafe-table"]) {
  test(`${id}: independent parts, switching, v3 persistence and canvas selection`, async ({
    page,
  }, testInfo) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await expect(page.locator("#parts-description")).toContainText(
      id === "side-table" ? "Round side table" : "Square café table",
    );
    await page.locator("#edit-parts").click();
    await page.locator('[data-part="tabletop"]').click();
    await page.locator("#part-thickness").fill("3.4");
    await page.locator("#part-thickness").press("Tab");
    await page
      .locator("#part-shape")
      .selectOption(id === "side-table" ? "square" : "round");
    await page.locator('[data-part="column"]').click();
    await page.locator("#part-diameter").fill("6");
    await page.locator("#part-diameter").press("Tab");
    await page.locator("#part-material").selectOption("metal");
    await page.locator('[data-part="base"]').click();
    await page.locator("#part-width").fill("27");
    await page.locator("#part-width").press("Tab");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export").click();
    const exported = await readFile(
        await (await downloadPromise).path(),
        "utf8",
      ),
      saved = JSON.parse(exported);
    expect(saved.version).toBe(3);
    expect(saved.design.id).toBe(id);
    expect(saved.design.partsRevision).toBe(1);
    expect(saved.design.parts.column.diameter).toBe(6);
    await page.reload();
    await page.locator("#edit-parts").click();
    await page.locator('[data-part="column"]').click();
    await expect(page.locator("#part-diameter")).toHaveValue("6");
    await expect(page.locator("#part-material")).toHaveValue("metal");
    const other = id === "side-table" ? "square-cafe-table" : "side-table";
    await page.locator(`[data-object="${other}"]`).click();
    await expect(page.locator("#selected-part-name")).toHaveText(
      "Select a part",
    );
    await page.locator('[data-part="column"]').click();
    await expect(page.locator("#part-diameter")).toHaveValue(
      other === "side-table" ? "6.75" : "11.25",
    );
    await page.locator("#undo").click();
    await page.locator('[data-part="column"]').click();
    await expect(page.locator("#part-diameter")).toHaveValue("6");
    await page.locator("#reset").click();
    await page.locator('[data-view="front"]').click();
    await clickColumn(page, id, testInfo.project.name !== "desktop");
    await expect(page.locator('[data-part="column"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    if (
      testInfo.project.name === "desktop" ||
      (testInfo.project.name === "mobile" && id === "square-cafe-table")
    ) {
      await page.screenshot({
        path: `docs/images/parts-${id}-${testInfo.project.name}.png`,
        fullPage: true,
      });
    }
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "table.json",
        mimeType: "application/json",
        buffer: Buffer.from(exported),
      });
    await expect(page.locator("#part-diameter")).toHaveValue("6");
    await page.locator("#scene").scrollIntoViewIfNeeded();
    const lost = await page.evaluate(() => {
      const gl = document.querySelector("#scene").getContext("webgl"),
        ext = gl?.getExtension("WEBGL_lose_context");
      if (ext) {
        ext.loseContext();
        return true;
      }
      return false;
    });
    if (lost)
      await expect(page.locator("#renderer-status")).toContainText("Software");
    await page.locator("#part-diameter").fill("7");
    await page.locator("#part-diameter").press("Tab");
    await expect(page.locator("#save-status")).toHaveText(
      "Saved on this device",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("released v2 custom save migrates and an envelope preview restores original overrides", async ({
  page,
}) => {
  const legacy = await readFile("tests/fixtures/cafe-table-v2.json", "utf8");
  await page.addInitScript((value) => {
    if (!localStorage.getItem("form-studio.workspace.v3"))
      localStorage.setItem("form-studio.workspace.v2", value);
  }, legacy);
  await page.goto("./");
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="tabletop"]').click();
  await expect(page.locator("#part-thickness")).toHaveValue("3.2");
  await page.locator('[data-part="base"]').click();
  await expect(page.locator("#part-width")).toHaveValue("60");
  await page.locator("#edit-whole").click();
  await page.locator("#width-range").evaluate((range) => {
    range.value = "30";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    range.value = "80";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    range.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="base"]').click();
  await expect(page.locator("#part-width")).toHaveValue("60");
  await expect(page.locator("#undo")).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v2")),
  ).toBe(legacy);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("form-studio.workspace.v3")).version,
    ),
  ).toBe(3);
});
