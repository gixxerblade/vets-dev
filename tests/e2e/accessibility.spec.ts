import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Pages accessible without authentication
const publicPages = [
  { name: "Home", path: "/" },
  { name: "Not Found", path: "/not-found" },
];

for (const pageConfig of publicPages) {
  test(`${pageConfig.name} page has no WCAG 2.0 AA / Section 508 violations`, async ({
    page,
  }) => {
    await page.goto(pageConfig.path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "section508"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("Home page has a functional skip navigation link", async ({ page }) => {
  await page.goto("/");

  // Skip link should be in the DOM
  const skipLink = page.locator(".skip-link");
  await expect(skipLink).toBeAttached();

  // Skip link should point to main content
  await expect(skipLink).toHaveAttribute("href", "#main-content");
});

test("Home page has correct landmark structure", async ({ page }) => {
  await page.goto("/");

  // Verify essential landmarks are present
  await expect(page.locator("header[role='banner']")).toBeAttached();
  await expect(page.locator("nav[role='navigation']")).toBeAttached();
  await expect(page.locator("main[role='main']#main-content")).toBeAttached();
  await expect(page.locator("footer[role='contentinfo']")).toBeAttached();
});

test("Home page SVG icons are hidden from screen readers", async ({ page }) => {
  await page.goto("/");

  const svgs = page.locator("svg");
  const svgCount = await svgs.count();

  for (let i = 0; i < svgCount; i++) {
    const svg = svgs.nth(i);
    // All SVGs should have aria-hidden="true"
    await expect(svg).toHaveAttribute("aria-hidden", "true");
  }
});

test("Home page heading hierarchy is correct", async ({ page }) => {
  await page.goto("/");

  // Should have exactly one h1
  const h1s = page.locator("h1");
  await expect(h1s).toHaveCount(1);
});

test("Home page interactive elements are keyboard focusable", async ({
  page,
}) => {
  await page.goto("/");

  // Tab to the first focusable element — skip link appears on focus
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  const href = await focused.getAttribute("href");
  expect(href).toBe("#main-content");
});

test("Error/Not-Found page has alert role for error message", async ({
  page,
}) => {
  await page.goto("/not-found");

  const alertRegion = page.locator("[role='alert']");
  await expect(alertRegion).toBeAttached();
});
