/**
 * Mock GitHub user data for testing
 */
export const mockGitHubUser = {
  login: "test-veteran",
  id: 12345,
  avatar_url: "https://avatars.githubusercontent.com/u/12345",
  name: "Test Veteran User",
  email: "test@example.com",
  bio: "Test bio for veteran user",
  created_at: "2020-01-01T00:00:00Z",
};

export type MockGitHubUser = typeof mockGitHubUser;

/**
 * Factory function to create mock GitHub user with custom overrides
 */
export function createMockGitHubUser(
  overrides: Partial<MockGitHubUser> = {},
): MockGitHubUser {
  return {
    ...mockGitHubUser,
    ...overrides,
  };
}
