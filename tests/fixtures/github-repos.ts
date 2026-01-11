/**
 * Mock GitHub repository data for testing
 */
export const mockGitHubRepos = [
  {
    id: 1,
    name: "test-repo-1",
    full_name: "test-veteran/test-repo-1",
    private: false,
    description: "A test repository",
    fork: false,
    created_at: "2021-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    stargazers_count: 10,
    language: "TypeScript",
  },
  {
    id: 2,
    name: "test-repo-2",
    full_name: "test-veteran/test-repo-2",
    private: true,
    description: "Another test repository",
    fork: false,
    created_at: "2022-01-01T00:00:00Z",
    updated_at: "2024-06-01T00:00:00Z",
    stargazers_count: 25,
    language: "JavaScript",
  },
];

export type MockGitHubRepo = (typeof mockGitHubRepos)[0];

/**
 * Factory function to create mock GitHub repository with custom overrides
 */
export function createMockGitHubRepo(
  overrides: Partial<MockGitHubRepo> = {},
): MockGitHubRepo {
  const baseRepo = mockGitHubRepos[0];
  if (!baseRepo) {
    throw new Error("No base repository available for mock creation");
  }
  return {
    ...baseRepo,
    ...overrides,
  } as MockGitHubRepo;
}
