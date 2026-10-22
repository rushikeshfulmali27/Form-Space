import { test, expect } from "@playwright/test";
for (const [id, selected] of [
  ["standing-desk", "tabletop"],
  ["corner-desk", "tabletop.return-top"],
  ["patio-table", "tabletop.03"],
  ["laptop-stand", "platform"],
])
  test(`${id}: mouse/touch picks the visible component in both renderers`, async ({
    page,
  }, info) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
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
      const pos = await page.evaluate(
        async ({ id, selected }) => {
          const { fresh } = await import(
            new URL("studio/design.js", location.href)
          );
          const { buildAssemblyModel } = await import(
            new URL("studio/geometry.js", location.href)
          );
          const { Viewer } = await import(
            new URL("studio/viewer.js", location.href)
          );
          const d = fresh(id),
            model = buildAssemblyModel(d),
            b = model.parts.find((p) => p.id === selected).bounds;
          const v = Object.create(Viewer.prototype);
          Object.assign(v, { design: d, zoom: 1, yaw: 0, pitch: 1.56 });
          const r = document.querySelector("#scene").getBoundingClientRect(),
            cam = v.camera(r.width, r.height);
          const point = [
              (b.min[0] + b.max[0]) / 2,
              b.max[1],
              (b.min[2] + b.max[2]) / 2,
            ],
            delta = point.map((n, i) => n - cam.target[i]);
          const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
          return {
            x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
            y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
          };
        },
        { id, selected },
      );
      if (info.project.name === "desktop") await page.mouse.click(pos.x, pos.y);
      else await page.touchscreen.tap(pos.x, pos.y);
      await expect(page.locator(`[data-part="${selected}"]`)).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await page.locator("#scene").focus();
      await page.keyboard.press("Escape");
      await expect(page.locator("#selected-part-name")).toHaveText(
        "Select a part",
      );
    }
    expect(errors).toEqual([]);
  });
