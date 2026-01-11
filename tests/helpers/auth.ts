import type { Page } from "@playwright/test";

/**
 * Creates a mock session cookie for testing
 */
export function createMockSessionCookie(
  token = "mock_session_token_123",
): string {
  return `vets_session=${token}; Path=/; HttpOnly; SameSite=Lax`;
}

/**
 * Helper to log in a user by setting a session cookie
 *
 * @param page - Playwright page instance
 * @param sessionToken - Optional session token (defaults to mock token)
 */
export async function loginAsUser(
  page: Page,
  sessionToken = "mock_session_token_123",
): Promise<void> {
  // Set session cookie
  await page.context().addCookies([
    {
      name: "vets_session",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    },
  ]);
}

/**
 * Helper to clear session (logout)
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
}
