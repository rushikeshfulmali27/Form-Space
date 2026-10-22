import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const IDS = ["garden-bench", "cafe-bench"];
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
  test(`${id}: individual slats, bearers, group history and real export/import/reload`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    await page.locator('[data-part="seat-slats"]').click();
    await page.locator("#part-thickness").fill("3");
    await page.locator("#part-thickness").press("Tab");
    await page.locator("#part-gap").fill("1");
    await page.locator("#part-gap").press("Tab");
    if (id === "garden-bench") {
      await page.locator("#part-height").fill("44");
      await page.locator("#part-height").press("Tab");
    } else {
      await expect(page.locator("#part-height")).toHaveCount(0);
      await expect(page.locator('[data-part="back-slats"]')).toHaveCount(0);
    }
    await page.locator("#parts-expand-seat-slats").click();
    await page.locator('[data-part="seat-slats.02"]').click();
    await page.locator("#part-thickness").fill("5");
    await page.locator("#part-thickness").press("Tab");
    await page.locator("#part-material").selectOption("metal");
    await page.locator('[data-part="seat-slats"]').click();
    await page.locator("#part-thickness").fill("4");
    await page.locator("#part-thickness").press("Tab");
    await page.locator('[data-part="seat-slats.01"]').click();
    await expect(page.locator("#part-thickness")).toHaveValue("4");
    await page.locator('[data-part="seat-slats.02"]').click();
    await expect(page.locator("#part-thickness")).toHaveValue("5");
    await page.locator("#parts-expand-bearers").click();
    await page.locator('[data-part="bearers.left"]').click();
    await page.locator("#part-section").fill("2");
    await page.locator("#part-section").press("Tab");
    const download = page.waitForEvent("download");
    await page.locator("#export").click();
    const text = await readFile(await (await download).path(), "utf8"),
      file = JSON.parse(text);
    expect(file.design.id).toBe(id);
    expect(file.design.partsRevision).toBe(1);
    expect(file.design.parts["seat-slats.02"].thickness).toBe(5);
    expect(file.design.parts["bearers.left"].section).toBe(2);
    await page.reload();
    await page.locator("#edit-parts").click();
    await page.locator("#parts-expand-seat-slats").click();
    await page.locator('[data-part="seat-slats.02"]').click();
    await expect(page.locator("#part-thickness")).toHaveValue("5");
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.locator('[data-part="seat-slats"]').click();
    await page.locator("#apply-group").click();
    await page.locator('[data-part="seat-slats.02"]').click();
    await expect(page.locator("#part-thickness")).toHaveValue("4");
    await page.locator("#undo").click();
    await expect(page.locator("#part-thickness")).toHaveValue("5");
    await page.locator('[data-part="seat-slats"]').click();
    await page.locator("#reset-part").click();
    await page.locator('[data-part="seat-slats.02"]').click();
    await expect(page.locator("#part-thickness")).not.toHaveValue("5");
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "bench.json",
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await expect(page.locator("#part-thickness")).toHaveValue("5");
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.locator("#scene").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/images/bench-${id}-${info.project.name}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("garden back boards and posts retain custom measurements as seat height changes", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.locator('[data-object="garden-bench"]').click();
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="back-slats"]').click();
  await page.locator("#part-height").fill("8");
  await page.locator("#part-height").press("Tab");
  await page.locator("#parts-expand-back-slats").click();
  await page.locator('[data-part="back-slats.02"]').click();
  await page.locator("#part-height").fill("7");
  await page.locator("#part-height").press("Tab");
  await page.locator("#part-thickness").fill("3");
  await page.locator("#part-thickness").press("Tab");
  await page.locator("#part-material").selectOption("metal");
  await page.locator("#parts-expand-back-supports").click();
  await page.locator('[data-part="back-supports.right"]').click();
  await page.locator("#part-section").fill("4");
  await page.locator("#part-section").press("Tab");
  await page.locator('[data-part="seat-slats"]').click();
  await page.locator("#part-height").fill("39");
  await page.locator("#part-height").press("Tab");
  await page.locator('[data-part="back-slats.02"]').click();
  await expect(page.locator("#part-height")).toHaveValue("7");
  await expect(page.locator("#part-material")).toHaveValue("metal");
  await page.locator("#scene").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `docs/images/bench-back-${info.project.name}.png`,
    fullPage: true,
  });
  await page.locator('[data-object="cafe-bench"]').click();
  await expect(page.locator('[data-part="back-slats"]')).toHaveCount(0);
  await expect(page.locator('[data-part="back-supports"]')).toHaveCount(0);
  await expect(page.locator("#selected-part-name")).toHaveText("Select a part");
});

for (const id of IDS)
  test(`${id}: native selection and editing survive software fallback`, async ({
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
          model = buildAssemblyModel(d),
          b = model.parts.find((p) => p.id === "seat-slats.04").bounds,
          v = Object.create(Viewer.prototype),
          r = document.querySelector("#scene").getBoundingClientRect();
        Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 1.56 });
        const cam = v.camera(r.width, r.height),
          point = [0, b.max[1], (b.min[2] + b.max[2]) / 2],
          delta = point.map((n, i) => n - cam.target[i]),
          dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
        return {
          x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
          y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
        };
      }, id);
      if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
      else await page.touchscreen.tap(pos.x, pos.y);
      await expect(page.locator('[data-part="seat-slats.04"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.locator("#parts-expand-seat-slats")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.locator("#scene").focus();
      await page.keyboard.press("Escape");
      await expect(page.locator("#selected-part-name")).toHaveText(
        "Select a part",
      );
    }
    await page.locator('[data-part="seat-slats.04"]').click();
    await page.locator("#part-thickness").fill("3");
    await page.locator("#part-thickness").press("Tab");
    await expect(page.locator("#save-status")).toHaveText(
      "Saved on this device",
    );
  });

test("old café bench v3 save migrates and invalid back imports preserve the workspace", async ({
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
          id: "cafe-bench",
          width: 145,
          height: 46,
          depth: 42,
          material: "walnut",
          color: "#79553c",
          accent: "#282e2c",
        },
      }),
    ),
  );
  await page.goto("./");
  await expect(page.locator("#width-number")).toHaveValue("145");
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="legs"]').click();
  await page.locator("#part-section").fill("3");
  await page.locator("#part-section").press("Tab");
  const before = await page.evaluate(() =>
      localStorage.getItem("form-studio.workspace.v3"),
    ),
    file = JSON.parse(before);
  file.design.parts["back-slats.01"] = { height: 4 };
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "bad-back.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(file)),
    });
  await expect(page.locator("#toast")).toContainText("Invalid part");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
});
