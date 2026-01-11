import { test, expect } from "@playwright/test";

test.describe("GitHub OAuth Flow", () => {
  test("should redirect unauthenticated users from dashboard to auth", async ({
    page,
  }) => {
    // Navigate to dashboard (requires auth)
    const response = await page.goto("/dashboard");

    // The redirect chain should include /auth/github
    // Note: Playwright follows redirects, so we check the final URL
    const finalUrl = page.url();

    // Should have been redirected (either to /auth/github or to GitHub itself)
    expect(
      finalUrl.includes("/auth/github") || finalUrl.includes("github.com"),
    ).toBe(true);
  });

  test("should set state cookie when initiating OAuth", async ({
    page,
    context,
  }) => {
    // Start OAuth flow - don't follow external redirects
    await page.route("https://github.com/**", (route) => route.abort());

    await page.goto("/auth/github").catch(() => {
      // Expected - we blocked the redirect to GitHub
    });

    // Check that state cookie was set
    const cookies = await context.cookies();
    const stateCookie = cookies.find((c) => c.name === "github_oauth_state");

    expect(stateCookie).toBeDefined();
    expect(stateCookie?.value).toHaveLength(64); // 32 bytes = 64 hex chars
    expect(stateCookie?.httpOnly).toBe(true);
    expect(stateCookie?.sameSite).toBe("Lax");
  });

  test("should reject OAuth callback with state mismatch", async ({ page }) => {
    // Try to access callback with invalid state
    await page.goto("/auth/github/callback?code=test_code&state=invalid_state");

    // Should show error page
    const content = await page.textContent("body");
    expect(content).toContain("Invalid authentication state");
  });

  test("should reject OAuth callback with missing code", async ({
    page,
    context,
  }) => {
    // Set a valid state cookie
    await context.addCookies([
      {
        name: "github_oauth_state",
        value: "a".repeat(64),
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Try callback without code
    await page.goto(`/auth/github/callback?state=${"a".repeat(64)}`);

    // Should show error
    const content = await page.textContent("body");
    expect(content).toContain("No authorization code");
  });

  test("should handle GitHub OAuth errors gracefully", async ({
    page,
    context,
  }) => {
    // Set state cookie
    const state = "c".repeat(64);
    await context.addCookies([
      {
        name: "github_oauth_state",
        value: state,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Try with an error parameter (GitHub OAuth error)
    await page.goto(`/auth/github/callback?error=access_denied&state=${state}`);

    // Should show error message
    const content = await page.textContent("body");
    expect(content).toContain("authentication failed");
  });

  // This test requires real GitHub API integration or server-side mocking
  // It's skipped by default since E2E tests hit the real server
  test.skip("should successfully complete OAuth flow (requires GitHub API)", async ({
    page,
    context,
  }) => {
    const state = "b".repeat(64);

    // Set state cookie
    await context.addCookies([
      {
        name: "github_oauth_state",
        value: state,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Navigate to callback with matching state and code
    // Note: This requires valid GitHub credentials or server-side mocking
    await page.goto(`/auth/github/callback?code=test_code_123&state=${state}`);

    // Should redirect to dashboard after successful auth
    await page.waitForURL("/dashboard", { timeout: 5000 });

    // Should have session cookie set
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === "vets_session");
    expect(sessionCookie).toBeDefined();

    // State cookie should be cleared
    const stateCookie = cookies.find((c) => c.name === "github_oauth_state");
    expect(stateCookie).toBeUndefined();
  });
});
