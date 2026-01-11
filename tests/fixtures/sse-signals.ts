/**
 * Mock SSE signal data for Datastar testing
 */

export interface UserSignalData {
  id: number;
  githubUsername: string;
  verifiedVeteran: boolean;
  createdAt: string;
}

export interface ProfileSignalData {
  githubUsername: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  totalStars: number;
  totalRepos: number;
}

/**
 * Creates a mock SSE event for user data
 */
export function mockUserSignal(data: UserSignalData): string {
  return `event: datastar-patch-signals\ndata: ${JSON.stringify({ userStore: data })}\n\n`;
}

/**
 * Creates a mock SSE event for profile data
 */
export function mockProfileSignal(data: ProfileSignalData): string {
  return `event: datastar-patch-signals\ndata: ${JSON.stringify({ profileStore: data })}\n\n`;
}

/**
 * Sample user signal data for testing
 */
export const sampleUserSignalData: UserSignalData = {
  id: 1,
  githubUsername: "test-veteran",
  verifiedVeteran: true,
  createdAt: "2024-01-01T00:00:00.000Z",
};

/**
 * Sample profile signal data for testing
 */
export const sampleProfileSignalData: ProfileSignalData = {
  githubUsername: "test-veteran",
  name: "Test Veteran User",
  bio: "Test bio",
  avatarUrl: "https://avatars.githubusercontent.com/u/12345",
  totalStars: 35,
  totalRepos: 2,
};
