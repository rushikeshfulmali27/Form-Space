import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const cases = [
  ["standing-desk", "columns", "columns.left", "section", "4"],
  ["corner-desk", "tabletop", "tabletop.return-top", null, null],
  ["patio-table", "tabletop", "tabletop.03", null, null],
  ["laptop-stand", null, "support", "section", "3"],
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
});
test.afterEach(async ({ page }) => expect(page.__errors).toEqual([]));
for (const [id, group, member, field, value] of cases)
  test(`${id}: member editing, history, export/import, reload and fallback`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    if (group) {
      await page.locator(`[data-part="${group}"]`).click();
      if (id === "corner-desk") {
        await page.locator("#part-width").fill("70");
        await page.locator("#part-width").press("Tab");
      }
      if (id === "patio-table") {
        await page.locator("#part-gap").fill("1.2");
        await page.locator("#part-gap").press("Tab");
        await page.locator("#part-shape").selectOption("round");
      }
      await page.locator(`[id="parts-expand-${group}"]`).click();
    }
    await page.locator(`[data-part="${member}"]`).click();
    if (field) {
      await page.locator(`#part-${field}`).fill(value);
      await page.locator(`#part-${field}`).press("Tab");
    }
    await page.locator("#part-material").selectOption("metal");
    const download = page.waitForEvent("download");
    await page.locator("#export").click();
    const text = await readFile(await (await download).path(), "utf8");
    const saved = JSON.parse(text);
    expect(saved.design.parts[member].material).toBe("metal");
    expect(saved.design.partsRevision).toBe(1);
    await page.reload();
    await page.locator("#edit-parts").click();
    if (group) await page.locator(`[id="parts-expand-${group}"]`).click();
    await page.locator(`[data-part="${member}"]`).click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
    if (field) await expect(page.locator(`#part-${field}`)).toHaveValue(value);
    if (group) {
      await page.locator(`[data-part="${group}"]`).click();
      await page.locator("#apply-group").click();
      await page.locator(`[data-part="${member}"]`).click();
      await expect(page.locator("#part-material")).not.toHaveValue("metal");
      await page.locator("#undo").click();
      await expect(page.locator("#part-material")).toHaveValue("metal");
    } else {
      await page.locator("#reset-part").click();
      await expect(page.locator("#part-material")).not.toHaveValue("metal");
      await page.locator("#undo").click();
    }
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "variant.json",
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.locator("#scene").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/images/variant-${id}-${info.project.name}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.evaluate(() =>
      document
        .querySelector("#scene")
        .dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
    await page.locator("#part-material").selectOption("walnut");
    await expect(page.locator("#part-material")).toHaveValue("walnut");
  });
