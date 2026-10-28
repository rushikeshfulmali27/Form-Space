import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
// Verify new families through the actual editor and exported files.
const cases = [
  ["pendant-lamp", "shade", "height"],
  ["chandelier", "globes.03", "height"],
  ["wall-lamp", "mount", "thickness"],
  ["wall-light", "shade", "height"],
  ["mirror", "frame", "section"],
  ["mirror-stand", "supports.left", "section"],
  ["workstation-partition", "panel", "thickness"],
  ["decorative-partition", "slats.03", "thickness"],
  ["fitting-room-partition", "return", "thickness"],
  ["whiteboard-stand", "frame", "thickness"],
  ["menu-stand", "legs.front-left", "section"],
  ["signboard", "surface", "thickness"],
  ["planter", "pot", "width"],
  ["hanging-planter", "suspension.02", "section"],
  ["decorative-sculpture", "upper", "height"],
  ["display-plinth", "body", "width", true],
  ["product-pedestal", "body", "width", true],
  ["vase", "body", "width", true],
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
for (const [object, part, key, global] of cases)
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
    const value = global
      ? Math.round(
          Math.max(min, Math.min(max, Number(await input.inputValue()) * 1.2)),
        )
      : Math.round((min + (max - min) * 0.65) * 100) / 100;
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
    expect(global ? saved.design[key] : saved.design.parts[part][key]).toBe(
      value,
    );
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
    if (
      [
        "chandelier",
        "mirror-stand",
        "decorative-partition",
        "planter",
        "vase",
      ].includes(object)
    ) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `docs/images/final18-${object}-${info.project.name}.png`,
        fullPage: true,
        style: "#toast { visibility: hidden; }",
      });
    } else if (info.project.name === "desktop") {
      await page
        .locator("#scene")
        .screenshot({ path: `work/final18-${object}.png` });
    }
  });

for (const [object, target, view, pitch] of [
  ["chandelier", "globes.01", "front", 0.06],
  ["wall-lamp", "shade", "front", 0.06],
  ["mirror", "surface", "front", 0.06],
  ["mirror-stand", "surface", "front", 0.06],
  ["decorative-partition", "slats.05", "front", 0.06],
  ["menu-stand", "surface", "front", 0.06],
  ["planter", "soil", "top", 1.56],
  ["hanging-planter", "suspension.01", "front", 0.06],
  ["vase", "body", "front", 0.06],
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
          let point =
            pitch > 1
              ? [(b.min[0] + b.max[0]) / 2, b.max[1], (b.min[2] + b.max[2]) / 2]
              : [
                  (b.min[0] + b.max[0]) / 2,
                  (b.min[1] + b.max[1]) / 2,
                  b.max[2],
                ];
          if (target === "soil")
            point = [(d.width * 0.15) / 100, b.max[1], (d.depth * 0.08) / 100];
          if (target === "suspension.01") {
            const { resolveParts } = await import(
                new URL("studio/parts.js", location.href)
              ),
              { solveDecor } = await import(
                new URL("studio/parts-decor.js", location.href)
              );
            const strap = solveDecor(d, resolveParts(d)).find(
              (s) => s.id === target,
            );
            point = strap.from.map(
              (n, i) => (n + (strap.to[i] - n) * 0.85) / 100,
            );
          }
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
