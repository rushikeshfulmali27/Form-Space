import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const IDS = [
  "work-desk",
  "coffee-table",
  "dining-table",
  "conference-table",
  "communal-table",
];
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
test.afterEach(async ({ page }) => expect(page.__errors).toEqual([]));

for (const id of IDS)
  test(`${id}: group/member editing, real v3 export/import and reload`, async ({
    page,
  }, info) => {
    await page.goto("./");
    await page.locator(`[data-object="${id}"]`).click();
    await page.locator("#edit-parts").click();
    await page.locator('[data-part="tabletop"]').click();
    await page.locator("#part-thickness").fill("3.2");
    await page.locator("#part-thickness").press("Tab");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#part-section").fill("5");
    await page.locator("#part-section").press("Tab");
    await page.locator("#parts-expand-legs").click();
    await expect(page.locator("#parts-expand-legs")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("5");
    await page.locator("#part-section").fill("3");
    await page.locator("#part-section").press("Tab");
    await page.locator("#part-material").selectOption("metal");
    await page.locator('[data-part="legs"]').click();
    await expect(page.locator("#part-custom")).toContainText("1 custom member");
    await page.locator("#part-section").fill("6");
    await page.locator("#part-section").press("Tab");
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("3");
    await page.locator('[data-part="legs.front-right"]').click();
    await expect(page.locator("#part-section")).toHaveValue("6");
    await page.locator('[data-part="feet"]').click();
    await page.locator("#part-thickness").fill("4");
    await page.locator("#part-thickness").press("Tab");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export").click();
    const text = await readFile(await (await downloadPromise).path(), "utf8"),
      saved = JSON.parse(text);
    expect(saved.design.id).toBe(id);
    expect(saved.version).toBe(3);
    expect(saved.design.parts["legs.front-left"].section).toBe(3);
    await page.reload();
    await page.locator("#edit-parts").click();
    await page.locator("#parts-expand-legs").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await expect(page.locator("#part-section")).toHaveValue("3");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#apply-group").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("6");
    await page.locator("#undo").click();
    await expect(page.locator("#part-section")).toHaveValue("3");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#reset-part").click();
    await page.locator('[data-part="legs.front-left"]').click();
    await expect(page.locator("#part-section")).toHaveValue("4");
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "desk.json",
        mimeType: "application/json",
        buffer: Buffer.from(text),
      });
    await expect(page.locator("#part-section")).toHaveValue("3");
    await page.locator('[data-part="legs"]').click();
    await page.locator("#scene").scrollIntoViewIfNeeded();
    if (id === "work-desk")
      await page.screenshot({
        path: `docs/images/desk-parts-${info.project.name}.png`,
        fullPage: true,
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

test("individual leg picking opens its group; grouped selection remains editable after WebGL loss", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.locator('[data-object="work-desk"]').click();
  await page.locator("#edit-parts").click();
  await page.locator('[data-view="front"]').click();
  await page.locator("#scene").scrollIntoViewIfNeeded();
  const pos = await page.evaluate(async () => {
    const { fresh } = await import(new URL("studio/design.js", location.href));
    const { resolveParts } = await import(
      new URL("studio/parts.js", location.href)
    );
    const { solveDesk } = await import(
      new URL("studio/parts-desks.js", location.href)
    );
    const { Viewer } = await import(new URL("studio/viewer.js", location.href));
    const d = fresh("work-desk"),
      layout = solveDesk(d, resolveParts(d)),
      v = Object.create(Viewer.prototype),
      r = document.querySelector("#scene").getBoundingClientRect();
    Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 0.06 });
    const cam = v.camera(r.width, r.height),
      delta = [layout.sides.left.x, 0.35, layout.sides.left.z].map(
        (n, i) => n - cam.target[i],
      );
    const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
    return {
      x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
      y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
    };
  });
  if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
  else await page.touchscreen.tap(pos.x, pos.y);
  await expect(page.locator('[data-part="legs.front-left"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#parts-expand-legs")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.locator('[data-part="legs"]').click();
  const before = await page.locator("#scene").screenshot();
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
  await page.locator("#part-section").fill("7");
  await page.locator("#part-section").press("Tab");
  await expect(page.locator('[data-part="legs"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#save-status")).toHaveText("Saved on this device");
  expect(
    Buffer.compare(before, await page.locator("#scene").screenshot()),
  ).not.toBe(0);
  await page.locator('[data-object="cafe-table"]').click();
  await expect(page.locator("#selected-part-name")).toHaveText("Select a part");
  await expect(page.locator('[data-part="legs"]')).toHaveCount(0);
});

test("older v3 whole-object desk save migrates without a revision and malformed member imports preserve state", async ({
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
          id: "work-desk",
          width: 150,
          height: 74,
          depth: 70,
          material: "walnut",
          color: "#79553c",
          accent: "#282e2c",
          shape: "square",
        },
      }),
    ),
  );
  await page.goto("./");
  await expect(page.locator("#width-number")).toHaveValue("150");
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="legs"]').click();
  await page.locator("#part-section").fill("5");
  await page.locator("#part-section").press("Tab");
  const before = await page.evaluate(() =>
    localStorage.getItem("form-studio.workspace.v3"),
  );
  const payload = JSON.parse(before);
  payload.design.parts["legs.front-left"] = { inset: 2 };
  await page
    .locator("#import-file")
    .setInputFiles({
      name: "bad-member.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(payload)),
    });
  await expect(page.locator("#toast")).toContainText("Invalid part");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
});
