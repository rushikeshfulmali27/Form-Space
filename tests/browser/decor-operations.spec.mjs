import { test, expect } from "@playwright/test";
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
for (const [object, root, member] of [
  ["chandelier", "globes", "globes.03"],
  ["decorative-partition", "slats", "slats.03"],
  ["planter", "leaves", "leaves.03"],
])
  test(`${object}: fixed members support inheritance, apply/reset, undo and reload`, async ({
    page,
  }) => {
    await page.goto("./");
    await page.locator(`[data-object="${object}"]`).click();
    await page.locator("#edit-parts").click();
    await expect(page.locator("#construction-controls")).toBeHidden();
    await page.locator(`[data-part="${root}"]`).click();
    await page.locator("#part-material").selectOption("walnut");
    await page.locator(`#parts-expand-${root}`).click();
    await page.locator(`[data-part="${member}"]`).click();
    await expect(page.locator("#part-material")).toHaveValue("walnut");
    await page.locator("#part-material").selectOption("metal");
    await page.locator(`[data-part="${root}"]`).click();
    await page.locator("#apply-group").click();
    await page.locator(`[data-part="${member}"]`).click();
    await expect(page.locator("#part-material")).toHaveValue("walnut");
    await page.locator("#undo").click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.locator(`[data-part="${root}"]`).click();
    await page.locator("#reset-part").click();
    await page.locator(`[data-part="${member}"]`).click();
    await expect(page.locator("#part-material")).not.toHaveValue("metal");
    await page.locator("#undo").click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
    await page.reload();
    await page.locator("#edit-parts").click();
    await page.locator(`#parts-expand-${root}`).click();
    await page.locator(`[data-part="${member}"]`).click();
    await expect(page.locator("#part-material")).toHaveValue("metal");
  });
test("final-object legacy migration, invalid imports, component prompts and single-body controls", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "form-studio.workspace.v3",
      JSON.stringify({
        format: "form-studio",
        version: 3,
        units: "cm",
        design: { id: "mirror", width: 65, height: 95, depth: 5 },
      }),
    ),
  );
  await page.goto("./");
  await page.locator("#edit-parts").click();
  await page.locator('[data-part="frame"]').click();
  await page.locator("#part-section").fill("2");
  await page.locator("#part-section").press("Tab");
  await page.locator("#part-material").selectOption("metal");
  const saved = await page.evaluate(() =>
    localStorage.getItem("form-studio.workspace.v3"),
  );
  for (const patch of [
    { partsRevision: 2 },
    { parts: { "surface.99": { thickness: 1 } } },
    { construction: { count: 3 } },
    {
      kind: "partition",
      variant: "slatted",
      parts: { "slats.99": { thickness: 1 } },
    },
  ]) {
    const file = JSON.parse(saved);
    Object.assign(file.design, patch);
    await page
      .locator("#import-file")
      .setInputFiles({
        name: "invalid.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(file)),
      });
    expect(
      await page.evaluate(() =>
        localStorage.getItem("form-studio.workspace.v3"),
      ),
    ).toBe(saved);
  }
  await page.locator("#undo").click();
  await expect(page.locator("#part-material")).not.toHaveValue("metal");
  const before = await page.evaluate(() =>
    localStorage.getItem("form-studio.workspace.v3"),
  );
  await page.locator("#prompt").fill("surface thickness 1 cm");
  await page.locator("#prompt-form").evaluate((form) => form.requestSubmit());
  await expect(page.locator("#prompt-feedback")).toContainText(
    "Individual parts",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("form-studio.workspace.v3")),
  ).toBe(before);
  await page.locator('[data-object="product-pedestal"]').click();
  await page.locator('[data-part="body"]').click();
  await expect(page.locator("[data-part]")).toHaveCount(1);
  await page.locator("#part-shape").selectOption("square");
  await page.locator("#undo").click();
  await expect(page.locator("#part-shape")).toHaveValue("round");
  await page.locator("#part-width").fill("100");
  await page.locator("#part-width").press("Tab");
  await page.locator("#part-material").selectOption("metal");
  await page.locator("#reset-part").click();
  await expect(page.locator("#part-width")).toHaveValue("100");
  await expect(page.locator("#part-material")).toHaveValue("matte");
});
