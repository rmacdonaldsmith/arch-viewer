import { expect, test } from "@playwright/test";
import { startViewer, type Running } from "./cli.js";

let viewer: Running;

test.beforeAll(async () => {
  viewer = await startViewer("ts-basic");
});

test.afterAll(() => viewer?.stop());

test("shows the top-level Components and Modules with collapsed Dependencies", async ({ page }) => {
  await page.goto(viewer.url);

  const nodes = page.locator("[data-node-id]");
  await expect(nodes).toHaveCount(4);
  await expect(page.locator('[data-node-id="component:app"]')).toHaveText("app");
  await expect(page.locator('[data-node-id="component:core"]')).toHaveText("core");
  await expect(page.locator('[data-node-id="component:domain"]')).toHaveText("domain");
  await expect(page.locator('[data-node-id="module:main"]')).toHaveText("main");

  const edges = await page
    .locator("[data-edge-from]")
    .evaluateAll((els) => els.map((el) => `${el.getAttribute("data-edge-from")} -> ${el.getAttribute("data-edge-to")}`));
  expect(edges.sort()).toEqual([
    "component:app -> component:core",
    "component:app -> component:domain",
    "component:domain -> component:core",
    "module:main -> component:app",
  ]);
});

test("draws Component names in italics, distinct from Modules", async ({ page }) => {
  await page.goto(viewer.url);

  const fontStyle = (id: string) =>
    page.locator(`[data-node-id="${id}"] text`).evaluate((el) => getComputedStyle(el).fontStyle);
  expect(await fontStyle("component:app")).toBe("italic");
  expect(await fontStyle("module:main")).toBe("normal");
});
