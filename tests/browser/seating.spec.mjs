import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const IDS = [
  "lounge-chair",
  "meeting-chair",
  "dining-chair",
  "visitor-chair",
  "outdoor-chair",
  "bar-stool",
  "breakfast-stool",
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

for (const id of IDS)
  test(`${id}: independent members, group operations, real export/import and reload`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    await page.locator('[data-part="seat"]').click();
    await page.locator("#part-thickness").fill("3");
    await page.locator("#part-thickness").press("Tab");
    if (!id.includes("stool")) {
      await page.locator("#part-height").fill("40");
      await page.locator("#part-height").press("Tab");
    } else await expect(page.locator("#part-height")).toHaveCount(0);
    await page.locator('[data-part="legs"]').click();
    await page.locator("#part-section").fill("3");
    await page.locator("#part-section").press("Tab");
    await page.locator("#parts-expand-legs").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await page.locator("#part-section").fill("2");
    await page.locator("#part-section").press("Tab");
    await page.locator("#part-material").selectOption("metal");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#part-section").fill("4");
    await page.locator("#part-section").press("Tab");
    await page.locator('[data-part="legs.rear-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("4");
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("2");
    const download = page.waitForEvent("download");
    await page.locator("#export").click();
    const text = await readFile(await (await download).path(), "utf8"),
      file = JSON.parse(text);
    expect(file.design.id).toBe(id);
    expect(file.design.partsRevision).toBe(1);
    expect(file.design.parts["legs.front-left"].material).toBe("metal");
    await page.reload();
    await page.locator("#edit-parts").click();
    await page.locator("#parts-expand-legs").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("2");
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#apply-group").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("4");
    await page.locator("#undo").click();
    await expect(page.locator("#part-section")).toHaveValue("2");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#reset-part").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).not.toHaveValue("2");
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "seating.json",
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await expect(page.locator("#part-section")).toHaveValue("2");
    if (
      ["lounge-chair", "dining-chair", "outdoor-chair", "bar-stool"].includes(
        id,
      )
    ) {
      await page.locator("#scene").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `docs/images/seating-${id}-${info.project.name}.png`,
        fullPage: true,
      });
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("armrests, slats and stretchers keep their distinct controls and member settings", async ({
  page,
}) => {
  await page.goto("./");
  await page.locator('[data-object="lounge-chair"]').click();
  await page.locator("#edit-parts").click();
  await page.locator("#parts-expand-armrests").click();
  await page.locator('[data-part="armrests.left"]').click();
  await page.locator("#part-height").fill("60");
  await page.locator("#part-height").press("Tab");
  await page.locator('[data-part="armrests.right"]').click();
  await expect(page.locator("#part-height")).toHaveValue("51.2");
  await page.locator('[data-part="armrests.left"]').click();
  await expect(page.locator("#part-height")).toHaveValue("60");
  await page.locator("#parts-expand-arm-supports").click();
  await page.locator('[data-part="arm-supports.left"]').click();
  await expect(page.locator("#part-height")).toHaveCount(0);
  await page.locator("#part-material").selectOption("walnut");
  await page.locator('[data-object="visitor-chair"]').click();
  await expect(page.locator('[data-part="armrests"]')).toHaveCount(0);
  await expect(page.locator("#selected-part-name")).toHaveText("Select a part");
  await page.locator('[data-object="outdoor-chair"]').click();
  await page.locator('[data-part="back-slats"]').click();
  await page.locator("#part-gap").fill("1");
  await page.locator("#part-gap").press("Tab");
  await page.locator("#parts-expand-back-slats").click();
  await page.locator('[data-part="back-slats.03"]').click();
  await page.locator("#part-material").selectOption("metal");
  await expect(page.locator("#part-thickness")).toHaveCount(0);
  await page.locator('[data-part="back-slats"]').click();
  await page.locator("#part-gap").fill("1.3");
  await page.locator("#part-gap").press("Tab");
  await page.locator('[data-part="back-slats.03"]').click();
  await expect(page.locator("#part-material")).toHaveValue("metal");
  await page.locator('[data-object="bar-stool"]').click();
  await page.locator('[data-part="stretchers"]').click();
  await page.locator("#part-height").fill("25");
  await page.locator("#part-height").press("Tab");
  await page.locator("#parts-expand-stretchers").click();
  await page.locator('[data-part="stretchers.front"]').click();
  await page.locator("#part-section").fill("1.5");
  await page.locator("#part-section").press("Tab");
  await page.locator('[data-part="seat"]').click();
  await page.locator("#part-shape").selectOption("square");
  await page.locator('[data-part="stretchers.front"]').click();
  await expect(page.locator("#part-section")).toHaveValue("1.5");
});

for (const id of IDS)
  test(`${id}: mouse/touch selection and software fallback`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    await page.locator('[data-view="front"]').click();
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
          { resolveParts } = await import(
            new URL("studio/parts.js", location.href)
          ),
          { solveSeating } = await import(
            new URL("studio/parts-seating.js", location.href)
          ),
          { Viewer } = await import(new URL("studio/viewer.js", location.href));
        const d = fresh(id),
          s = solveSeating(d, resolveParts(d)),
          leg = s.legs["front-left"],
          point = leg.bottom.map((n, i) => (n + leg.top[i]) / 2),
          v = Object.create(Viewer.prototype),
          r = document.querySelector("#scene").getBoundingClientRect();
        Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 0.06 });
        const cam = v.camera(r.width, r.height),
          delta = point.map((n, i) => n - cam.target[i]),
          dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
        return {
          x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
          y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
        };
      }, id);
      if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
      else await page.touchscreen.tap(pos.x, pos.y);
      await expect(
        page.locator('[data-part="legs.front-left"]'),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#parts-expand-legs")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.locator("#scene").focus();
      await page.keyboard.press("Escape");
      await expect(page.locator("#selected-part-name")).toHaveText(
        "Select a part",
      );
    }
    await page.locator('[data-part="legs.front-left"]').click();
    await page.locator("#part-section").fill("2");
    await page.locator("#part-section").press("Tab");
    await expect(page.locator("#save-status")).toHaveText(
      "Saved on this device",
    );
  });
