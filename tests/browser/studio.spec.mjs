import { test, expect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { CATALOG, TAXONOMY } from "../../public/studio/design.js";

test.beforeEach(async ({ page }) => {
  const errors = [],
    requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) =>
    errors.push("Failed request: " + request.url()),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push("HTTP " + response.status() + ": " + response.url());
  });
  page.on("request", (request) => requests.push(request.url()));
  page.__verification = { errors, requests };
});
test.afterEach(async ({ page }) => {
  expect(page.__verification.errors).toEqual([]);
  expect(
    page.__verification.requests.filter(
      (url) =>
        !url.startsWith("http://127.0.0.1:5180/FORM_Studio/") &&
        !url.startsWith("data:"),
    ),
  ).toEqual([]);
  expect(
    page.__verification.requests.some((url) =>
      /api\/design|openai|prompt-design/.test(url),
    ),
  ).toBe(false);
});

test("browse every subcategory, filter, select and show supported controls", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".object-card")).toHaveCount(72);
  await expect
    .poll(async () =>
      Math.round(
        (await page.locator(".object-card").first().boundingBox()).height,
      ),
    )
    .toBeGreaterThanOrEqual(130);
  await expect(
    page.getByRole("link", { name: /Prompt to Design/ }),
  ).toHaveCount(0);
  for (const category of TAXONOMY) {
    await page.locator(`[data-category="${category.id}"]`).click();
    for (const subcategory of category.subcategories) {
      await page.locator("#subcategory").selectOption(subcategory.id);
      const objects = CATALOG.filter((o) => o.subcategory === subcategory.id);
      await expect(page.locator(".object-card")).toHaveCount(objects.length);
      const object = objects[0];
      await page.locator(`[data-object="${object.id}"]`).click();
      await expect(page.locator("#object-name")).toHaveText(object.name);
      await expect(
        page.locator(`[data-object="${object.id}"]`),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#shape-section")).toBeVisible({
        visible: !!object.shape,
      });
      await expect(page.locator("#shelf-section")).toBeVisible({
        visible: !!object.shelves,
      });
      for (const axis of ["width", "depth", "height"])
        await expect(page.locator(`#${axis}-number`)).toHaveValue(
          String(object[axis]),
        );
    }
  }
  await page.locator('[data-category="All"]').click();
  await page.locator("#library-search").fill("café");
  await expect(page.locator(".object-card")).toHaveCount(
    CATALOG.filter((o) => o.category === "Cafe").length,
  );
  await page.locator("#library-search").fill("no such object xxxxx");
  await expect(page.locator("#library-empty")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".object-card")).toHaveCount(72);
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width > 0 && r.right > innerWidth + 1 && !e.closest("#object-list")
        );
      })
      .map((e) => ({
        tag: e.tagName,
        id: e.id,
        class: e.className,
        right: Math.round(e.getBoundingClientRect().right),
      }))
      .slice(0, 12),
  );
  expect(overflow).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("manual edits change the real canvas, history, export/import and reload", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await page.locator('[data-object="bookshelf"]').click();
  const canvas = page.locator("#scene");
  const original = await canvas.screenshot();
  await page.locator("#width-number").fill("120");
  await page.locator("#width-number").press("Tab");
  await expect(page.locator("#dimension-label")).toHaveText(
    "120 × 35 × 180 cm",
  );
  const edited = await canvas.screenshot();
  expect(Buffer.compare(original, edited)).not.toBe(0);
  await page.locator('[data-material="walnut"]').click();
  await page.locator("#shelf-count").focus();
  await page.locator("#shelf-count").press("ArrowRight");
  await expect(page.locator("#shelf-output")).toHaveText("5");
  await page.getByRole("button", { name: "Undo last edit" }).click();
  await expect(page.locator("#shelf-output")).toHaveText("4");
  await page.getByRole("button", { name: "Redo last edit" }).click();
  await expect(page.locator("#shelf-output")).toHaveText("5");
  await expect(page.locator("#save-status")).toHaveText("Saved on this device");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export design", exact: true })
    .click();
  const download = await downloadPromise;
  const exported = await readFile(await download.path(), "utf8");
  const d = JSON.parse(exported).design;
  expect(d.id).toBe("bookshelf");
  expect(d.width).toBe(120);
  expect(d.shelves).toBe(5);
  await page.locator("#reset").click();
  await expect(page.locator("#width-number")).toHaveValue("90");
  await page.locator("#import-file").setInputFiles({
    name: "saved.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported),
  });
  await expect(page.locator("#width-number")).toHaveValue("120");
  await expect(page.locator("#shelf-output")).toHaveText("5");
  await page.reload();
  await expect(page.locator("#object-name")).toHaveText("Grid bookshelf");
  await expect(page.locator("#width-number")).toHaveValue("120");
  for (const view of ["front", "top", "perspective"]) {
    await page.locator(`[data-view="${view}"]`).click();
    await expect(page.locator(`[data-view="${view}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await page.locator("#scene").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator('[data-view="perspective"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("#fit").click();
  await expect(page.locator("#zoom-label")).toHaveText("100%");
  await page.locator("#zoom-in").click();
  await expect(page.locator("#zoom-label")).not.toHaveText("100%");
  await page.locator("#fit").click();
  await page.locator("#scene").scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 35,
    box.y + box.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(page.locator('[data-view="perspective"]')).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("#fit").click();
  await page.locator("#prompt").fill("Make it blue and 20% taller");
  await page.locator("#apply-prompt").click();
  await expect(page.locator("#height-number")).toHaveValue("216");
  await page.locator("#prompt-help").click();
  await expect(page.locator("#help-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#help-dialog")).not.toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await mkdir("docs/images", { recursive: true });
  await page.screenshot({
    path: `docs/images/v1-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("renderer lifecycle, color, shape, wireframe and touch orbit", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await page.locator('[data-shape="square"]').click();
  await expect(page.locator('[data-shape="square"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#primary-color").fill("#aabbcc");
  await expect(page.locator("#primary-hex")).toHaveText("#AABBCC");
  await page.locator("#wireframe").check();
  await expect(page.locator("#wireframe")).toBeChecked();
  await page.locator("#wireframe").uncheck();
  await page.locator("#auto-rotate").check();
  const initial = await page
    .locator("#scene")
    .evaluate((canvas) => canvas.toDataURL());
  await expect
    .poll(() => page.locator("#scene").evaluate((canvas) => canvas.toDataURL()))
    .not.toBe(initial);
  await page.locator("#auto-rotate").uncheck();
  await page.locator("#fit").click();
  if (testInfo.project.name !== "desktop") {
    await page.locator("#scene").scrollIntoViewIfNeeded();
    const box = await page.locator("#scene").boundingBox(),
      x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 30, y: y + 10 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
    await expect(page.locator('[data-view="perspective"]')).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  }
  if (
    (await page.locator("#renderer-status").textContent()).startsWith("WebGL")
  ) {
    await page
      .locator("#scene")
      .evaluate((canvas) =>
        canvas
          .getContext("webgl")
          .getExtension("WEBGL_lose_context")
          .loseContext(),
      );
    await expect(page.locator("#renderer-status")).toContainText(
      "Software 3D fallback",
    );
    await page.locator("#scene").focus();
    await page.keyboard.press("ArrowLeft");
    await page.locator("#fit").click();
    await expect(page.locator('[data-view="perspective"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
});

test("invalid/oversized imports and invalid numeric input preserve the design", async ({
  page,
}) => {
  await page.goto("./");
  for (const [name, content] of [
    ["bad.json", "{oops"],
    [
      "unknown.json",
      '{"format":"form-studio","version":1,"design":{"id":"untrusted"}}',
    ],
    ["large.json", " ".repeat(100001)],
  ]) {
    await page.locator("#import-file").setInputFiles({
      name,
      mimeType: "application/json",
      buffer: Buffer.from(content),
    });
    await expect(page.locator("#toast")).toHaveClass(/visible/);
    await expect(page.locator("#object-name")).toHaveText("Orbit café table");
    await expect(page.locator("#undo")).toBeDisabled();
  }
  await page.locator("#width-number").fill("");
  await page.locator("#width-number").press("Tab");
  await expect(page.locator("#width-number")).toHaveValue("80");
  await page.locator("#width-number").fill("999");
  await page.locator("#width-number").press("Tab");
  await expect(page.locator("#width-number")).toHaveValue("240");
});

test("blocked storage and WebGL fallback remain editable with honest feedback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/.test(type) ? null : getContext.call(this, type, ...args);
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.locator("#renderer-status")).toContainText(
    "Software 3D fallback",
  );
  await expect(page.locator("#save-status")).toContainText(
    "Storage unavailable",
  );
  await expect(page.locator("#auto-rotate")).not.toBeChecked();
  await page.locator("#height-number").fill("100");
  await page.locator("#height-number").press("Tab");
  await expect(page.locator("#dimension-label")).toHaveText("80 × 80 × 100 cm");
  await expect(page.locator("#save-status")).toContainText(
    "Storage unavailable",
  );
  await page.locator("#scene").focus();
  await page.keyboard.press("ArrowRight");
  await page.locator("#fit").click();
  expect((await page.locator("#scene").screenshot()).length).toBeGreaterThan(
    1000,
  );
});

test("corrupted saved data is preserved until an edit and a range drag forms one history step", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("form-studio.workspace.v1", "corrupted saved data"),
  );
  await page.goto("./");
  await expect(page.locator("#save-status")).toContainText(
    "Saved data is invalid",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v1")),
  ).toBe("corrupted saved data");
  const range = page.locator("#width-range");
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.locator("#save-status")).toHaveText("Saved on this device");
  await page.locator("#undo").click();
  await expect(page.locator("#width-number")).toHaveValue("80");
});

test("parts inspector edits independent components, supports history and round-trips v2", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="tabletop"]').click();
  await page.locator("#part-thickness").fill("7.2");
  await page.locator("#part-thickness").press("Tab");
  await expect(page.locator("#part-custom")).toContainText("Custom");
  await page.locator('[data-part="column"]').click();
  await expect(page.locator("#column-height")).toContainText("61.8 cm");
  await page.locator("#part-diameter").fill("8");
  await page.locator("#part-diameter").press("Tab");
  await page.locator("#part-material").selectOption("metal");
  await page.locator('[data-part="base"]').click();
  await page.locator("#part-width").fill("60");
  await page.locator("#part-width").press("Tab");
  await page.locator("#undo").click();
  await expect(page.locator("#part-width")).toHaveValue("54.4");
  await page.locator("#redo").click();
  await expect(page.locator("#part-width")).toHaveValue("60");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const exported = await readFile(await (await downloadPromise).path(), "utf8");
  const saved = JSON.parse(exported);
  expect(saved.version).toBe(2);
  expect(saved.design.parts.tabletop.thickness).toBe(7.2);
  expect(saved.design.parts.column).toEqual({ diameter: 8, material: "metal" });
  await page.locator("#reset-part").click();
  await expect(page.locator("#part-width")).toHaveValue("54.4");
  await page.locator("#import-file").setInputFiles({
    name: "parts.json",
    mimeType: "application/json",
    buffer: Buffer.from(exported),
  });
  await expect(page.locator("#part-width")).toHaveValue("60");
  await page.reload();
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="column"]').click();
  await expect(page.locator("#part-diameter")).toHaveValue("8");
  await expect(page.locator("#part-material")).toHaveValue("metal");
  await page.locator("#scene").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `docs/images/parts-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#edit-whole").click();
  await page.locator('[data-material="walnut"]').click();
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="column"]').click();
  await expect(page.locator("#part-material")).toHaveValue("metal");
  await page.locator("#finish-all-parts").click();
  await expect(page.locator("#part-material")).toHaveValue("walnut");
  await expect(page.locator("#part-diameter")).toHaveValue("8");
  await page.locator("#reset-part").click();
  await expect(page.locator("#part-material")).toHaveValue("matte");
  await expect(page.locator("#part-diameter")).toHaveValue("12");
  await page.locator("#undo").click();
  await expect(page.locator("#part-diameter")).toHaveValue("8");
  await page.locator('[data-object="bookshelf"]').click();
  await expect(page.locator("#parts-editor")).toBeHidden();
  await expect(page.locator("#height-number")).toBeVisible();
  await page.locator("#undo").click();
  await page.locator("#edit-parts").click();
  await expect(page.locator("#selected-part-name")).toHaveText("Select a part");
});

async function clickWorld(page, point, touch) {
  await page.locator("#scene").scrollIntoViewIfNeeded();
  const position = await page.evaluate(async (point) => {
    const { Viewer } = await import(new URL("studio/viewer.js", location.href));
    const { fresh } = await import(new URL("studio/design.js", location.href));
    const c = document.querySelector("#scene"),
      r = c.getBoundingClientRect();
    const v = Object.create(Viewer.prototype);
    Object.assign(v, { design: fresh(), yaw: 0, pitch: 0.06, zoom: 1 });
    const cam = v.camera(r.width, r.height),
      delta = point.map((n, i) => n - cam.target[i]);
    const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
    return {
      x: r.left + r.width / 2 + (dot(delta, cam.x) * r.height) / cam.size,
      y: r.top + r.height / 2 - (dot(delta, cam.y) * r.height) / cam.size,
    };
  }, point);
  if (touch) await page.touchscreen.tap(position.x, position.y);
  else await page.mouse.click(position.x, position.y);
}

test("canvas selects visible parts with mouse/touch, separates orbit, and survives WebGL loss", async ({
  page,
}, testInfo) => {
  await page.goto("./");
  await page.locator("#edit-parts").click();
  await page.locator('[data-view="front"]').click();
  const touch = testInfo.project.name !== "desktop";
  const canvas = page.locator("#scene");
  await canvas.scrollIntoViewIfNeeded();
  const unselected = await canvas.screenshot();
  await clickWorld(page, [0, 0.74, 0], touch);
  await expect(page.locator('[data-part="tabletop"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const selected = await canvas.screenshot();
  expect(Buffer.compare(unselected, selected)).not.toBe(0);
  await clickWorld(page, [0, 0.35, 0], touch);
  await expect(page.locator('[data-part="column"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await clickWorld(page, [0.18, 0.035, 0.18], touch);
  await expect(page.locator('[data-part="base"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 45,
    box.y + box.height / 2 + 10,
    { steps: 4 },
  );
  await page.mouse.up();
  await expect(page.locator('[data-part="base"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await canvas.focus();
  await page.keyboard.press("Escape");
  await expect(page.locator("#selected-part-name")).toHaveText("Select a part");
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
  await page.locator('[data-view="front"]').click();
  await clickWorld(page, [0, 0.35, 0], touch);
  await expect(page.locator('[data-part="column"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#undo")).toBeDisabled();
});

test("parts slider is one undo step and migration/import failures preserve editable state", async ({
  page,
}) => {
  const legacy = await readFile("tests/fixtures/cafe-table-v1.json", "utf8");
  await page.addInitScript((value) => {
    if (!localStorage.getItem("form-studio.workspace.v2"))
      localStorage.setItem("form-studio.workspace.v1", value);
  }, legacy);
  await page.goto("./");
  await expect(page.locator("#width-number")).toHaveValue("90");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("form-studio.workspace.v2")).version,
    ),
  ).toBe(2);
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="tabletop"]').click();
  const range = page.getByRole("slider", {
    name: "Tabletop Thickness (cm) slider",
    exact: true,
  });
  await range.scrollIntoViewIfNeeded();
  const box = await range.boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.locator("#part-thickness")).not.toHaveValue("4.5");
  await page.locator("#undo").click();
  await expect(page.locator("#part-thickness")).toHaveValue("4.5");
  await expect(page.locator("#undo")).toBeDisabled();
  const before = await page.evaluate(() =>
    localStorage.getItem("form-studio.workspace.v2"),
  );
  const invalid = {
    ...JSON.parse(before),
    design: {
      ...JSON.parse(before).design,
      parts: { column: { diameter: 999 } },
    },
  };
  await page.locator("#import-file").setInputFiles({
    name: "invalid-parts.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.locator("#toast")).toContainText("Invalid part");
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v2")),
  ).toBe(before);
});
