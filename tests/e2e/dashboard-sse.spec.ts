import { test, expect } from "@playwright/test";

test.describe("Dashboard SSE Integration", () => {
  test("should redirect to auth when not authenticated", async ({ page }) => {
    // Block external redirects to GitHub to stay on our site
    await page.route("https://github.com/**", (route) => route.abort());

    await page.goto("/dashboard").catch(() => {
      // Expected - we blocked the GitHub redirect
    });

    // Should have been redirected away from dashboard
    const url = page.url();
    expect(url).not.toContain("/dashboard");
  });

  test("should show auth redirect when accessing protected routes", async ({
    page,
  }) => {
    // Block external redirects to GitHub
    await page.route("https://github.com/**", (route) => route.abort());

    await page.goto("/dashboard").catch(() => {
      // Expected - we blocked the GitHub redirect
    });

    // The redirect chain should have gone through /auth/github
    // Since we blocked GitHub, we should be able to see we're not on dashboard
    const url = page.url();
    expect(url).not.toBe("http://localhost:3000/dashboard");
  });

  // The following tests require a seeded database with authenticated sessions.
  // They are skipped by default but can be enabled when running against a test DB.
  test.describe("Authenticated tests (require seeded database)", () => {
    test.skip(
      () => !process.env.TEST_DB_SEEDED,
      "Skipped: requires seeded test database",
    );

    test("should load dashboard page for authenticated user", async ({
      page,
      context,
    }) => {
      // This test requires a valid session token in the test database
      const testSessionToken = process.env.TEST_SESSION_TOKEN;
      if (testSessionToken) {
        await context.addCookies([
          {
            name: "vets_session",
            value: testSessionToken,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            sameSite: "Lax",
          },
        ]);
      }

      await page.goto("/dashboard");

      // Should successfully load dashboard
      await expect(page).toHaveURL("/dashboard");

      // Should show dashboard content
      const content = await page.textContent("body");
      expect(content).toBeTruthy();
    });

    test("should have Datastar script loaded on dashboard", async ({
      page,
      context,
    }) => {
      const testSessionToken = process.env.TEST_SESSION_TOKEN;
      if (testSessionToken) {
        await context.addCookies([
          {
            name: "vets_session",
            value: testSessionToken,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            sameSite: "Lax",
          },
        ]);
      }

      await page.goto("/dashboard");

      // Check for Datastar script tag
      const datastarScript = await page
        .locator('script[src*="datastar"]')
        .count();
      expect(datastarScript).toBeGreaterThan(0);
    });

    test("should initiate SSE connection on page load", async ({
      page,
      context,
    }) => {
      const testSessionToken = process.env.TEST_SESSION_TOKEN;
      if (testSessionToken) {
        await context.addCookies([
          {
            name: "vets_session",
            value: testSessionToken,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            sameSite: "Lax",
          },
        ]);
      }

      // Listen for SSE connection requests
      let sseRequested = false;
      page.on("request", (request) => {
        if (request.url().includes("/api/sse/user")) {
          sseRequested = true;
        }
      });

      await page.goto("/dashboard");

      // Wait a moment for SSE connection to be initiated
      await page.waitForTimeout(1000);

      // Verify SSE connection was attempted
      expect(sseRequested).toBe(true);
    });
  });
});
