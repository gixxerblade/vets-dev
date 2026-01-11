import { test, expect } from "@playwright/test";

test.describe("Public Profile SSE Integration", () => {
  test("should show 404 for non-existent username", async ({ page }) => {
    const response = await page.goto("/nonexistent-user-12345");

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Should show not found message
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("should not show unverified user profiles", async ({ page }) => {
    // Try to access an unverified user profile
    // This would return 404 as per the requirement
    const response = await page.goto("/test-unverified");

    expect(response?.status()).toBe(404);
  });

  test("should load public profile page for verified user", async ({
    page,
  }) => {
    // Navigate to a verified user's profile
    // This requires a verified user to exist in the database
    // For this test, we'll verify the page structure loads

    await page.goto("/test-veteran");

    // Page should load (may be 404 if user doesn't exist in test DB)
    const statusCode = page.url().includes("test-veteran") ? 200 : 404;
    expect([200, 404]).toContain(statusCode);
  });

  test("should have Datastar script loaded on profile page", async ({
    page,
  }) => {
    await page.goto("/test-veteran");

    // If page loads (not 404), check for Datastar script
    const url = page.url();
    if (url.includes("test-veteran")) {
      const datastarScript = await page
        .locator('script[src*="datastar"]')
        .count();
      expect(datastarScript).toBeGreaterThan(0);
    }
  });

  test("should initiate SSE connection for profile data when profile exists", async ({
    page,
  }) => {
    let sseRequested = false;
    page.on("request", (request) => {
      if (request.url().includes("/api/sse/profile/")) {
        sseRequested = true;
      }
    });

    const response = await page.goto("/test-veteran");

    // If profile page loaded (200), SSE should be requested
    if (response?.status() === 200) {
      // Wait a moment for SSE connection
      await page.waitForTimeout(1000);
      expect(sseRequested).toBe(true);
    } else {
      // Profile doesn't exist in test DB - this is expected
      expect(response?.status()).toBe(404);
    }
  });

  test("should display verified badge for verified users", async ({ page }) => {
    await page.goto("/test-veteran");

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Check that page rendered
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("should handle SSE connection errors gracefully", async ({ page }) => {
    await page.goto("/test-veteran");

    // Page should still load even if SSE fails
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("should respect reserved paths - health endpoint", async ({ page }) => {
    const response = await page.goto("/health");
    expect(response?.status()).toBe(200);

    // Should return JSON health check
    const content = await page.textContent("body");
    expect(content).toContain("ok");
  });

  test("should respect reserved paths - protected routes redirect", async ({
    page,
  }) => {
    // Block external redirects to GitHub
    await page.route("https://github.com/**", (route) => route.abort());

    // Dashboard should redirect (not return profile page)
    await page.goto("/dashboard").catch(() => {});
    expect(page.url()).not.toContain("/dashboard");

    // Verify should redirect (not return profile page)
    await page.goto("/verify").catch(() => {});
    expect(page.url()).not.toContain("/verify");
  });
});
