import { HttpResponse, http } from "msw";

/**
 * MSW request handlers for mocking GitHub OAuth API endpoints in tests
 */
export const handlers = [
  // GitHub OAuth: Exchange code for access token
  http.post("https://github.com/login/oauth/access_token", () => {
    return HttpResponse.json({
      access_token: "gho_mock_access_token_1234567890",
      token_type: "bearer",
      scope: "read:user,user:email",
    });
  }),

  // GitHub API: Get authenticated user
  http.get("https://api.github.com/user", ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json({
      login: "test-veteran",
      id: 12345,
      avatar_url: "https://avatars.githubusercontent.com/u/12345",
      name: "Test Veteran User",
      email: "test@example.com",
      bio: "Test bio",
      created_at: "2020-01-01T00:00:00Z",
    });
  }),

  // GitHub API: Get user repositories
  http.get("https://api.github.com/user/repos", ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json([
      {
        id: 1,
        name: "test-repo",
        full_name: "test-veteran/test-repo",
        private: false,
        description: "A test repository",
        fork: false,
        created_at: "2021-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        stargazers_count: 10,
        language: "TypeScript",
      },
    ]);
  }),
];
