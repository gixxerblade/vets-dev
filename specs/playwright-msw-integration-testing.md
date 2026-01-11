# Plan: Playwright Integration Testing with MSW Mocking

## Task Description

Implement a comprehensive testing infrastructure using Playwright for browser automation, MSW (Mock Service Worker) for API mocking, and Bun's native test runner for unit tests. This setup will enable testing of the GitHub OAuth integration, Datastar SSE functionality, and all pure functions in the codebase. Additionally, create a `/testing` slash command that uses git diff to identify changed files and generate appropriate tests.

## Objective

Establish a robust, maintainable testing infrastructure that:
- Tests GitHub OAuth flow with mocked GitHub API responses
- Validates Datastar SSE streaming behavior with controlled data
- Provides reusable fixtures and helpers for future test development
- Integrates seamlessly with the existing Bun + Effect architecture
- Runs automatically in CI via GitHub Actions
- **Unit tests all pure functions at the smallest possible level**
- **Provides a `/testing` command to auto-generate tests based on git diff**

## Problem Statement

The current testing setup has several gaps:
1. Playwright is used but not declared as a dependency in `package.json`
2. No API mocking layer exists - tests require real GitHub credentials and API calls
3. SSE streams cannot be controlled or validated in tests
4. No test fixtures or helpers for common operations
5. External service dependencies make tests flaky and slow
6. No CI/CD pipeline exists for running tests automatically
7. **No unit tests for pure functions (cookie helpers, state machine, config validators)**
8. **No automated way to generate tests for changed files**

## Solution Approach

Implement a three-layer testing strategy:
1. **Unit Tests (Bun native test runner)** - Test pure functions in isolation without external dependencies
2. **MSW (Mock Service Worker)** - Intercepts HTTP requests at the Node level to mock GitHub API calls that the server makes
3. **Playwright Route Interception** - Intercepts browser-level requests for SSE stream testing and CDN resources

Additionally, create a `/testing` slash command that analyzes git diffs to identify changed files and generates appropriate unit and integration tests.

## Relevant Files

### Existing Files to Understand

- `package.json:1-26` - Root package configuration (needs Playwright + MSW dependencies)
- `packages/server/package.json` - Server package configuration
- `packages/server/src/services/github-oauth.ts:1-226` - GitHub OAuth service making API calls to:
  - `https://github.com/login/oauth/access_token` (token exchange, lines 71-130)
  - `https://api.github.com/user` (user profile fetch, lines 132-165)
  - **Pure functions to unit test:** `createStateCookie()` (178-195), `getStateCookie()` (197-209), `clearStateCookie()` (211-212), `generateState()` (215), `getAuthorizationUrl()` (217-224)
- `packages/server/src/services/github-profile.ts:1-223` - GitHub profile statistics fetching:
  - `https://api.github.com/users/{username}/repos` (repository listing, lines 77-116)
- `packages/server/src/services/sse.ts:1-138` - SSE service using Datastar SDK with `ServerSentEventGenerator.stream()`:
  - `streamUser()` function (lines 26-76)
  - `streamProfile()` function (lines 78-133)
- `packages/server/src/services/session.ts:1-184` - Session management:
  - **Pure functions to unit test:** `hashToken()` (51-52), `generateToken()` (54), `getSessionCookie()` (149-161), `createSessionCookie()` (163-180), `createLogoutCookie()` (182-183)
- `packages/server/src/services/verification.ts:1-391` - Verification service:
  - **Pure functions to unit test:** `generateRequestId()` (89), `createIdempotencyKey()` (91-92)
- `packages/server/src/services/audit.ts:1-70` - Audit logging:
  - **Pure functions to unit test:** `getClientInfo()` (58-69)
- `packages/server/src/config.ts:1-62` - Configuration management:
  - **Pure functions to unit test:** `requireEnv()` (3-9), `requireEnvInProd()` (11-20), `optionalEnv()` (22-24)
- `packages/shared/src/state/user-state.ts:1-130` - User state machine:
  - **Pure functions to unit test:** `Authenticated()` (25-29), `VerificationPending()` (31-38), `Verified()` (40-44), `transition()` (63-106), `isAuthenticated()` (110-111), `isVerified()` (114-117), `getUserId()` (120-129)
- `packages/server/src/index.ts` - Route handlers including:
  - `GET /auth/github` - OAuth initiation (line 374)
  - `GET /auth/github/callback` - OAuth callback handling (line 404)
  - `GET /api/sse/user` - Authenticated user SSE stream (line 436)
  - `GET /api/sse/profile/:username` - Public profile SSE stream (line 441)
- `packages/web/src/templates/dashboard.ts` - Uses `data-on-load="@get('/api/sse/user')"`
- `packages/web/src/templates/verify.ts` - SSE integration with conditional rendering
- `packages/web/src/templates/profile.ts` - Public profile SSE stream
- `tests/datastar-integration.spec.ts` - Existing Playwright test file
- `.env.example` - Environment variables for GitHub OAuth
- `.claude/commands/build.md` - Reference for command structure

### New Files to Create

**Testing Infrastructure:**
- `playwright.config.ts` - Playwright configuration file
- `tests/setup/msw-handlers.ts` - MSW request handlers for GitHub API
- `tests/setup/msw-server.ts` - MSW server setup and lifecycle
- `tests/setup/global-setup.ts` - Playwright global setup (starts MSW + app server)
- `tests/setup/global-teardown.ts` - Playwright global teardown
- `tests/fixtures/github-user.ts` - Mock GitHub user data fixtures
- `tests/fixtures/github-repos.ts` - Mock GitHub repository data fixtures
- `tests/fixtures/sse-signals.ts` - Mock SSE signal data fixtures
- `tests/helpers/auth.ts` - Authentication test helpers
- `tests/helpers/sse.ts` - SSE testing utilities

**Unit Tests (Bun native):**
- `packages/server/src/services/__tests__/session.test.ts` - Session helper unit tests
- `packages/server/src/services/__tests__/github-oauth.test.ts` - OAuth helper unit tests
- `packages/server/src/services/__tests__/verification.test.ts` - Verification helper unit tests
- `packages/server/src/services/__tests__/audit.test.ts` - Audit helper unit tests
- `packages/server/src/__tests__/config.test.ts` - Config helper unit tests
- `packages/shared/src/state/__tests__/user-state.test.ts` - State machine unit tests

**Integration Tests (Playwright):**
- `tests/e2e/github-oauth.spec.ts` - GitHub OAuth flow tests
- `tests/e2e/dashboard-sse.spec.ts` - Dashboard SSE integration tests
- `tests/e2e/profile-sse.spec.ts` - Public profile SSE tests

**CI/CD:**
- `.github/workflows/playwright.yml` - GitHub Actions workflow for CI testing

**Slash Command:**
- `.claude/commands/testing.md` - `/testing` command for auto-generating tests

## Implementation Phases

### Phase 1: Foundation

Set up the core testing infrastructure:
- Install and configure Playwright as a dev dependency
- Install and configure MSW for Node.js
- Create Playwright configuration with proper project settings
- Set up global setup/teardown for test lifecycle management

### Phase 2: Unit Testing

Build unit tests for all pure functions:
- Create unit tests for session helpers (cookie functions, token hashing)
- Create unit tests for OAuth helpers (state, URL generation)
- Create unit tests for config validators
- Create unit tests for user state machine (all transitions and helpers)
- Create unit tests for audit helpers

### Phase 3: Integration Testing

Build the mocking layer and fixtures:
- Create MSW handlers for GitHub OAuth endpoints
- Create MSW handlers for GitHub API endpoints
- Build reusable test fixtures for common data
- Implement SSE testing utilities using Playwright's route interception
- Create authentication helpers for session management in tests

### Phase 4: E2E Tests

Write comprehensive test suites:
- Implement GitHub OAuth flow tests (login, callback, error handling)
- Implement Dashboard SSE tests (data streaming, signal updates)
- Implement Profile SSE tests (public profile data)
- Add test scripts to package.json
- Document testing patterns and best practices

### Phase 5: CI/CD & Automation

Set up automated testing:
- Create GitHub Actions workflow for Playwright tests
- Configure test artifacts and report storage
- Set up proper caching for faster CI runs
- **Create `/testing` slash command for auto-generating tests**

## Step by Step Tasks

### 1. Install Testing Dependencies

- Add `@playwright/test` to root devDependencies
- Add `msw` (Mock Service Worker) to root devDependencies
- Add `@types/node` if not present for proper Node.js typing
- Run `bun install` to update lockfile
- Run `bunx playwright install chromium` to install browser binaries

```bash
bun add -d @playwright/test msw
bunx playwright install chromium
```

### 2. Create Playwright Configuration

- Create `playwright.config.ts` at project root
- Configure base URL to `http://localhost:3000`
- Set up test directory as `tests/e2e`
- Configure `webServer` option to start the dev server before tests
- Set up reporters (list for local, HTML for CI)
- Configure projects for different browsers (chromium as default)
- Set reasonable timeouts (30s for actions, 60s for tests)
- Enable retries for flaky test recovery (2 retries on CI)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

### 3. Create Unit Tests for Session Helpers

- Create `packages/server/src/services/__tests__/session.test.ts`
- Test `getSessionCookie()` with various cookie header formats
- Test `createSessionCookie()` with secure and insecure modes
- Test `createLogoutCookie()` returns proper clear cookie format
- Verify cookie flags (HttpOnly, SameSite, Max-Age, Secure)

```typescript
// packages/server/src/services/__tests__/session.test.ts
import { describe, expect, test } from 'bun:test';
import { createLogoutCookie, createSessionCookie, getSessionCookie } from '../session';

describe('Session Cookie Helpers', () => {
  describe('getSessionCookie', () => {
    test('returns null when no cookie header', () => {
      const request = new Request('http://localhost', {});
      expect(getSessionCookie(request)).toBeNull();
    });

    test('returns null when session cookie not present', () => {
      const request = new Request('http://localhost', {
        headers: { cookie: 'other=value' },
      });
      expect(getSessionCookie(request)).toBeNull();
    });

    test('extracts session cookie value', () => {
      const request = new Request('http://localhost', {
        headers: { cookie: 'vets_session=token123; other=value' },
      });
      expect(getSessionCookie(request)).toBe('token123');
    });

    test('handles cookie with equals in value', () => {
      const request = new Request('http://localhost', {
        headers: { cookie: 'vets_session=token=with=equals' },
      });
      expect(getSessionCookie(request)).toBe('token=with=equals');
    });
  });

  describe('createSessionCookie', () => {
    test('creates secure cookie by default', () => {
      const cookie = createSessionCookie('token123');
      expect(cookie).toContain('vets_session=token123');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Max-Age=');
    });

    test('creates non-secure cookie when secure=false', () => {
      const cookie = createSessionCookie('token123', false);
      expect(cookie).not.toContain('Secure');
    });
  });

  describe('createLogoutCookie', () => {
    test('creates cookie with Max-Age=0', () => {
      const cookie = createLogoutCookie();
      expect(cookie).toContain('vets_session=');
      expect(cookie).toContain('Max-Age=0');
    });
  });
});
```

### 4. Create Unit Tests for OAuth Helpers

- Create `packages/server/src/services/__tests__/github-oauth.test.ts`
- Test `createStateCookie()` generates proper cookie format
- Test `getStateCookie()` extracts state from cookie header
- Test `clearStateCookie()` returns proper clear format
- Test `generateState()` creates random hex string
- Test `getAuthorizationUrl()` builds correct GitHub URL with params

```typescript
// packages/server/src/services/__tests__/github-oauth.test.ts
import { describe, expect, test } from 'bun:test';
import {
  clearStateCookie,
  createStateCookie,
  generateState,
  getAuthorizationUrl,
  getStateCookie,
} from '../github-oauth';

describe('GitHub OAuth Helpers', () => {
  describe('generateState', () => {
    test('generates 64 character hex string', () => {
      const state = generateState();
      expect(state).toMatch(/^[a-f0-9]{64}$/);
    });

    test('generates unique values', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });
  });

  describe('createStateCookie', () => {
    test('creates state cookie with proper flags', () => {
      const cookie = createStateCookie('test-state');
      expect(cookie).toContain('github_oauth_state=test-state');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    });

    test('includes Secure flag by default', () => {
      const cookie = createStateCookie('test-state');
      expect(cookie).toContain('Secure');
    });

    test('excludes Secure flag when secure=false', () => {
      const cookie = createStateCookie('test-state', false);
      expect(cookie).not.toContain('Secure');
    });
  });

  describe('getStateCookie', () => {
    test('returns null when no cookie header', () => {
      const request = new Request('http://localhost');
      expect(getStateCookie(request)).toBeNull();
    });

    test('extracts state from cookie header', () => {
      const request = new Request('http://localhost', {
        headers: { cookie: 'github_oauth_state=abc123' },
      });
      expect(getStateCookie(request)).toBe('abc123');
    });
  });

  describe('clearStateCookie', () => {
    test('returns cookie with Max-Age=0', () => {
      const cookie = clearStateCookie();
      expect(cookie).toContain('github_oauth_state=');
      expect(cookie).toContain('Max-Age=0');
    });
  });

  describe('getAuthorizationUrl', () => {
    test('builds URL with required params', () => {
      const url = getAuthorizationUrl('test-state');
      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=read%3Auser');
    });
  });
});
```

### 5. Create Unit Tests for User State Machine

- Create `packages/shared/src/state/__tests__/user-state.test.ts`
- Test all state constructors create correct shapes
- Test `transition()` for all valid state transitions
- Test `transition()` fails for invalid transitions
- Test helper functions `isAuthenticated()`, `isVerified()`, `getUserId()`

```typescript
// packages/shared/src/state/__tests__/user-state.test.ts
import { describe, expect, test } from 'bun:test';
import { Effect } from 'effect';
import {
  Authenticated,
  getUserId,
  isAuthenticated,
  isVerified,
  transition,
  Unauthenticated,
  Verified,
  VerificationPending,
} from '../user-state';

describe('User State Machine', () => {
  describe('State Constructors', () => {
    test('Unauthenticated has correct tag', () => {
      expect(Unauthenticated._tag).toBe('Unauthenticated');
    });

    test('Authenticated creates correct state', () => {
      const state = Authenticated('user-123');
      expect(state._tag).toBe('Authenticated');
      expect(state.userId).toBe('user-123');
      expect(state.verified).toBe(false);
    });

    test('VerificationPending creates correct state', () => {
      const state = VerificationPending('user-123', 'req-456');
      expect(state._tag).toBe('VerificationPending');
      expect(state.userId).toBe('user-123');
      expect(state.requestId).toBe('req-456');
    });

    test('Verified creates correct state', () => {
      const date = new Date('2024-01-01');
      const state = Verified('user-123', date);
      expect(state._tag).toBe('Verified');
      expect(state.userId).toBe('user-123');
      expect(state.verifiedAt).toBe(date);
    });
  });

  describe('transition', () => {
    test('GithubLogin: Unauthenticated -> Authenticated', async () => {
      const result = await Effect.runPromise(
        transition(Unauthenticated, { _tag: 'GithubLogin', userId: 'user-123' })
      );
      expect(result._tag).toBe('Authenticated');
    });

    test('StartVerify: Authenticated -> VerificationPending', async () => {
      const result = await Effect.runPromise(
        transition(Authenticated('user-123'), { _tag: 'StartVerify', requestId: 'req-456' })
      );
      expect(result._tag).toBe('VerificationPending');
    });

    test('VerifySuccess: VerificationPending -> Verified', async () => {
      const date = new Date();
      const result = await Effect.runPromise(
        transition(VerificationPending('user-123', 'req-456'), { _tag: 'VerifySuccess', verifiedAt: date })
      );
      expect(result._tag).toBe('Verified');
    });

    test('VerifyFail: VerificationPending -> Authenticated', async () => {
      const result = await Effect.runPromise(
        transition(VerificationPending('user-123', 'req-456'), { _tag: 'VerifyFail', reason: 'test' })
      );
      expect(result._tag).toBe('Authenticated');
    });

    test('Logout: Authenticated -> Unauthenticated', async () => {
      const result = await Effect.runPromise(
        transition(Authenticated('user-123'), { _tag: 'Logout' })
      );
      expect(result._tag).toBe('Unauthenticated');
    });

    test('invalid transition fails with error', async () => {
      const result = Effect.runPromiseExit(
        transition(Unauthenticated, { _tag: 'Logout' })
      );
      expect((await result)._tag).toBe('Failure');
    });
  });

  describe('Helper Functions', () => {
    test('isAuthenticated returns false for Unauthenticated', () => {
      expect(isAuthenticated(Unauthenticated)).toBe(false);
    });

    test('isAuthenticated returns true for other states', () => {
      expect(isAuthenticated(Authenticated('user-123'))).toBe(true);
      expect(isAuthenticated(Verified('user-123', new Date()))).toBe(true);
    });

    test('isVerified returns true only for Verified state', () => {
      expect(isVerified(Unauthenticated)).toBe(false);
      expect(isVerified(Authenticated('user-123'))).toBe(false);
      expect(isVerified(Verified('user-123', new Date()))).toBe(true);
    });

    test('getUserId returns null for Unauthenticated', () => {
      expect(getUserId(Unauthenticated)).toBeNull();
    });

    test('getUserId returns userId for authenticated states', () => {
      expect(getUserId(Authenticated('user-123'))).toBe('user-123');
      expect(getUserId(Verified('user-123', new Date()))).toBe('user-123');
    });
  });
});
```

### 6. Create Unit Tests for Audit Helpers

- Create `packages/server/src/services/__tests__/audit.test.ts`
- Test `getClientInfo()` extracts IP from various headers
- Test fallback behavior when headers are missing

```typescript
// packages/server/src/services/__tests__/audit.test.ts
import { describe, expect, test } from 'bun:test';
import { getClientInfo } from '../audit';

describe('Audit Helpers', () => {
  describe('getClientInfo', () => {
    test('returns null when no headers present', () => {
      const request = new Request('http://localhost');
      const info = getClientInfo(request);
      expect(info.ipAddress).toBeNull();
      expect(info.userAgent).toBeNull();
    });

    test('extracts IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });
      const info = getClientInfo(request);
      expect(info.ipAddress).toBe('192.168.1.1');
    });

    test('falls back to x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.1' },
      });
      const info = getClientInfo(request);
      expect(info.ipAddress).toBe('192.168.1.1');
    });

    test('extracts user-agent header', () => {
      const request = new Request('http://localhost', {
        headers: { 'user-agent': 'TestAgent/1.0' },
      });
      const info = getClientInfo(request);
      expect(info.userAgent).toBe('TestAgent/1.0');
    });
  });
});
```

### 7. Create MSW Server Setup

- Create `tests/setup/msw-server.ts` to initialize MSW server
- Configure MSW to intercept requests to GitHub API domains
- Export `server` instance for use in handlers and tests
- Create lifecycle helpers (`startMocking`, `stopMocking`, `resetHandlers`)

```typescript
// tests/setup/msw-server.ts
import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

export const server = setupServer(...handlers);

export const startMocking = () => server.listen({ onUnhandledRequest: 'bypass' });
export const stopMocking = () => server.close();
export const resetHandlers = () => server.resetHandlers();
```

### 8. Create GitHub API Mock Handlers

- Create `tests/setup/msw-handlers.ts` with handlers for:
  - `POST https://github.com/login/oauth/access_token` - Returns mock access token
  - `GET https://api.github.com/user` - Returns mock user profile
  - `GET https://api.github.com/users/:username/repos` - Returns mock repositories
- Include error scenario handlers (401, 403, 500 responses)
- Make handlers configurable via test context for different scenarios

```typescript
// tests/setup/msw-handlers.ts
import { http, HttpResponse } from 'msw';
import { createMockGitHubUser } from '../fixtures/github-user';
import { createMockRepoList } from '../fixtures/github-repos';

export const handlers = [
  // Token exchange
  http.post('https://github.com/login/oauth/access_token', () => {
    return HttpResponse.json({ access_token: 'mock_access_token_123' });
  }),

  // User profile
  http.get('https://api.github.com/user', () => {
    return HttpResponse.json(createMockGitHubUser());
  }),

  // Repository listing
  http.get('https://api.github.com/users/:username/repos', ({ params }) => {
    return HttpResponse.json(createMockRepoList(5));
  }),
];
```

### 9. Create Test Fixtures

- Create `tests/fixtures/github-user.ts` with factory functions:
  - `createMockGitHubUser(overrides?)` - Creates valid GitHub user object
  - `createMockGitHubUserResponse()` - Creates full API response
- Create `tests/fixtures/github-repos.ts` with:
  - `createMockRepo(overrides?)` - Creates single repository
  - `createMockRepoList(count, overrides?)` - Creates repository list
- Create `tests/fixtures/sse-signals.ts` with:
  - `createUserSignals(overrides?)` - Creates user SSE signal data
  - `createProfileSignals(overrides?)` - Creates profile SSE signal data

```typescript
// tests/fixtures/github-user.ts
import type { GitHubUser } from '../../packages/server/src/services/github-oauth';

export function createMockGitHubUser(overrides?: Partial<GitHubUser>): GitHubUser {
  return {
    id: 12345,
    login: 'testuser',
    avatar_url: 'https://avatars.githubusercontent.com/u/12345',
    name: 'Test User',
    bio: 'A test user for integration tests',
    blog: 'https://example.com',
    public_repos: 42,
    ...overrides,
  };
}
```

### 10. Create Global Setup/Teardown

- Create `tests/setup/global-setup.ts`:
  - Start MSW server with GitHub handlers
  - Start application server on test port
  - Set up test database (if needed)
  - Export cleanup function
- Create `tests/setup/global-teardown.ts`:
  - Stop MSW server
  - Stop application server
  - Clean up test artifacts
- Register in `playwright.config.ts`

### 11. Create Authentication Test Helpers

- Create `tests/helpers/auth.ts` with:
  - `mockGitHubLogin(page, userOverrides?)` - Simulates complete OAuth flow
  - `createTestSession(userId)` - Creates session cookie directly
  - `clearSession(page)` - Clears all auth cookies
  - `getSessionCookie(page)` - Retrieves current session token

### 12. Create SSE Testing Utilities

- Create `tests/helpers/sse.ts` with:
  - `mockSSEStream(page, endpoint, signals)` - Intercepts SSE endpoint and returns mock signals
  - `waitForSignalUpdate(page, signalName, expectedValue)` - Waits for Datastar signal update
  - `captureSSEEvents(page, endpoint)` - Captures all SSE events for assertions
  - `createMockSSEResponse(signals)` - Creates properly formatted SSE response

```typescript
// tests/helpers/sse.ts
import { Page } from '@playwright/test';

export async function mockSSEStream(
  page: Page,
  endpoint: string,
  signals: Record<string, unknown>
) {
  await page.route(endpoint, async (route) => {
    const body = `event: datastar-patch-signals\ndata: ${JSON.stringify(signals)}\n\n`;
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body,
    });
  });
}

export async function waitForSignalUpdate(
  page: Page,
  signalName: string,
  expectedValue: unknown
) {
  await page.waitForFunction(
    ([name, value]) => {
      const ds = (window as any).ds;
      return ds?.signals?.[name] === value;
    },
    [signalName, expectedValue]
  );
}
```

### 13. Write GitHub OAuth Flow Tests

- Create `tests/e2e/github-oauth.spec.ts` with test cases:
  - "successfully completes OAuth flow and redirects to dashboard"
  - "handles OAuth state mismatch error"
  - "handles GitHub token exchange failure"
  - "handles GitHub user fetch failure"
  - "creates new user on first login"
  - "updates existing user on subsequent login"
  - "sets secure session cookie after login"

### 14. Write Dashboard SSE Tests

- Create `tests/e2e/dashboard-sse.spec.ts` with test cases:
  - "loads dashboard page for authenticated user"
  - "initiates SSE connection on page load"
  - "displays verified badge when user is verified"
  - "displays verification prompt when user not verified"
  - "updates repository count from SSE signal"
  - "updates star count from SSE signal"
  - "displays languages from SSE signal"
  - "handles SSE connection errors gracefully"

### 15. Write Profile SSE Tests

- Create `tests/e2e/profile-sse.spec.ts` with test cases:
  - "loads public profile page"
  - "initiates SSE connection with username"
  - "displays profile statistics from SSE"
  - "handles non-existent profile"
  - "displays verified badge for verified users"

### 16. Update Package Scripts

- Update `package.json` scripts:
  - `"test": "bun test"` - Run all unit tests
  - `"test:unit": "bun test packages/"` - Run only unit tests
  - `"test:e2e": "playwright test"` - Run all e2e tests
  - `"test:e2e:ui": "playwright test --ui"` - Run with Playwright UI
  - `"test:e2e:headed": "playwright test --headed"` - Run in headed mode
  - `"test:e2e:debug": "playwright test --debug"` - Run in debug mode
  - `"test:all": "bun test && playwright test"` - Run all tests
- Add to server package.json if needed for workspace filtering

### 17. Create GitHub Actions Workflow

- Create `.github/workflows/playwright.yml` with the following configuration:

```yaml
# .github/workflows/playwright.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun test

  e2e-tests:
    name: E2E Tests
    timeout-minutes: 60
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: vetsdev
          POSTGRES_PASSWORD: vetsdev_local
          POSTGRES_DB: vetsdev
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Install Playwright Browsers
        run: bunx playwright install --with-deps chromium

      - name: Run database migrations
        run: bun run db:migrate
        env:
          DATABASE_URL: postgres://vetsdev:vetsdev_local@localhost:5432/vetsdev

      - name: Run Playwright tests
        run: bun run test:e2e
        env:
          DATABASE_URL: postgres://vetsdev:vetsdev_local@localhost:5432/vetsdev
          GITHUB_CLIENT_ID: test_client_id
          GITHUB_CLIENT_SECRET: test_client_secret
          GITHUB_CALLBACK_URL: http://localhost:3000/auth/github/callback
          SESSION_SECRET: test_session_secret_for_ci

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: test-results
          path: test-results/
          retention-days: 30
```

### 18. Create /testing Slash Command

- Create `.claude/commands/testing.md` with the following content:

```markdown
---
description: Generate tests for changed files using git diff
argument-hint: [--unit|--e2e|--all] [base-branch]
---

# Testing Command

Analyze git diff to identify changed files and generate appropriate unit and integration tests based on the testing plan.

## Variables

TEST_TYPE: $1
BASE_BRANCH: $2

## Instructions

- IMPORTANT: Use git diff to identify files that have changed
- Analyze each changed file to determine what tests are needed
- For pure functions (no side effects, no database), generate unit tests using Bun's test runner
- For services with side effects, generate integration tests with MSW mocking
- For UI components/templates, generate Playwright e2e tests
- Follow the patterns established in the testing plan

## Workflow

1. **Identify Changed Files**
   - If BASE_BRANCH is not provided, default to `main`
   - Run `git diff --name-only BASE_BRANCH...HEAD` to get list of changed files
   - Filter to only `.ts` files in `packages/` directory

2. **Categorize Changes**
   - Pure functions (helpers, utils, state machine) → Unit tests
   - Services (session, oauth, verification) → Unit tests for pure helpers + Integration tests for service methods
   - Templates → E2E tests
   - Route handlers → E2E tests

3. **Generate Unit Tests** (if TEST_TYPE is --unit or --all)
   - For each changed file with pure functions:
     - Create `__tests__/<filename>.test.ts` in same directory
     - Generate tests for each exported pure function
     - Test edge cases, error conditions, and happy paths
   - Use `bun:test` APIs: `describe`, `test`, `expect`

4. **Generate Integration Tests** (if TEST_TYPE is --e2e or --all)
   - For each changed service:
     - Create or update MSW handlers in `tests/setup/msw-handlers.ts`
     - Create or update fixtures in `tests/fixtures/`
     - Create Playwright test in `tests/e2e/`
   - For each changed template:
     - Create Playwright test verifying Datastar bindings and SSE integration

5. **Run Tests**
   - Run `bun test` for unit tests
   - Run `bun run test:e2e` for e2e tests
   - Report any failures

## Pure Function Detection

A function is considered "pure" and suitable for unit testing if:
- It takes inputs and returns outputs without side effects
- It does not call `db.insert()`, `db.update()`, `db.delete()`, or `db.select()`
- It does not call `fetch()` or make HTTP requests
- It does not use `Effect.tryPromise()` with database or network operations
- Examples: cookie parsers, URL builders, state constructors, validators

## Test File Location Conventions

| Source File | Test File Location |
|-------------|-------------------|
| `packages/server/src/services/session.ts` | `packages/server/src/services/__tests__/session.test.ts` |
| `packages/shared/src/state/user-state.ts` | `packages/shared/src/state/__tests__/user-state.test.ts` |
| `packages/server/src/config.ts` | `packages/server/src/__tests__/config.test.ts` |
| Route handlers in `index.ts` | `tests/e2e/*.spec.ts` |
| Templates | `tests/e2e/*.spec.ts` |

## Example Unit Test Template

```typescript
import { describe, expect, test } from 'bun:test';
import { functionName } from '../filename';

describe('functionName', () => {
  test('returns expected output for valid input', () => {
    const result = functionName('input');
    expect(result).toBe('expected');
  });

  test('handles edge case', () => {
    const result = functionName('');
    expect(result).toBeNull();
  });

  test('throws for invalid input', () => {
    expect(() => functionName(null)).toThrow();
  });
});
```

## Report

After generating tests:
- List all test files created or updated
- Run the tests and report results
- Show coverage summary if available
```

### 19. Validate All Tests Pass

- Run `bun run lint` to ensure no linting errors
- Run `bun run format` to format all new files
- Run `bun run tsc` to verify TypeScript types
- Run `bun test` to execute all unit tests
- Run `bun run test:e2e` to execute all integration tests
- Verify all code quality checks pass: `bun run lint && bun run format && bun run tsc && bun run test && bun run build`

## Testing Strategy

### Unit Testing Layer
- Test pure functions in isolation (no mocking needed)
- Use Bun's native test runner (`bun:test`)
- Located in `__tests__/` directories next to source files
- Target: All cookie helpers, state machine functions, validators, URL builders

### Integration Testing Layer
- Test services with mocked external dependencies
- Use MSW for GitHub API mocking
- Test complete flows without real network calls
- Target: OAuth flow, session management, verification process

### E2E Testing Layer
- Test full user flows in a real browser
- Use Playwright for browser automation
- Mock SSE streams for controlled testing
- Target: Login flow, dashboard interactions, profile pages

### CI Testing Layer
- Automated test runs on push to main and pull requests
- Unit tests run in separate job (fast feedback)
- E2E tests run with PostgreSQL service container
- Test artifacts (reports, screenshots, traces) stored for debugging

### Test Coverage Goals

| Layer | Target Coverage | Key Areas |
|-------|----------------|-----------|
| Unit | 90%+ | Pure functions, state machine, helpers |
| Integration | 80%+ | Service methods, API handlers |
| E2E | 70%+ | Critical user paths |

### E2E Coverage Matrix

| Feature | Happy Path | Error Handling | Edge Cases |
|---------|------------|----------------|------------|
| GitHub OAuth | Login flow | Token failure | State mismatch |
| Dashboard SSE | Signal display | Connection error | Stale data |
| Profile SSE | Public view | User not found | Reserved paths |

## Acceptance Criteria

- [ ] Playwright is properly configured and runs tests successfully
- [ ] MSW intercepts all GitHub API calls (no real API calls during tests)
- [ ] OAuth flow tests pass with mocked GitHub responses
- [ ] SSE tests validate Datastar signal binding works correctly
- [ ] All tests are deterministic (no flakiness from external dependencies)
- [ ] Test fixtures are reusable and well-documented
- [ ] CI pipeline can run tests without GitHub credentials
- [ ] GitHub Actions workflow runs on push to main and pull requests
- [ ] Test artifacts (reports, screenshots) are uploaded to GitHub
- [ ] CI workflow completes within 10 minutes
- [ ] All code quality checks pass (`lint`, `format`, `tsc`, `test`, `build`)
- [ ] **Unit tests exist for all pure functions (session, oauth, audit, state machine)**
- [ ] **Unit tests achieve 90%+ coverage on pure functions**
- [ ] **`/testing` command successfully generates tests based on git diff**

## Validation Commands

Execute these commands to validate the task is complete:

```bash
# Install all dependencies including Playwright and MSW
bun install

# Ensure browser is installed
bunx playwright install chromium

# Run all unit tests
bun test

# Run all Playwright integration tests locally
bun run test:e2e

# Run tests with UI for debugging
bun run test:e2e:ui

# Run all tests
bun run test:all

# Full validation pipeline
bun run lint && bun run format && bun run tsc && bun run test && bun run build

# Test the /testing command
# /testing --all main
```

## Notes

### MSW Version Compatibility

MSW v2.x uses the new `http` handlers API. Example:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://github.com/login/oauth/access_token', () => {
    return HttpResponse.json({ access_token: 'mock_token_123' })
  }),
  http.get('https://api.github.com/user', () => {
    return HttpResponse.json({
      id: 12345,
      login: 'testuser',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345',
      name: 'Test User',
      bio: 'A test user',
      blog: 'https://example.com',
      public_repos: 42
    })
  })
]
```

### Bun Test Runner

Bun has a native test runner that's Jest-compatible:

```typescript
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';

describe('my tests', () => {
  beforeEach(() => {
    // setup
  });

  test('example test', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### SSE Mocking Strategy

For SSE endpoints, use Playwright's route interception:

```typescript
await page.route('/api/sse/user', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'text/event-stream',
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: `event: datastar-patch-signals\ndata: ${JSON.stringify({ verified: true, repoCount: 42 })}\n\n`
  })
})
```

### Datastar Signal Format

Datastar uses specific SSE event formats. The server uses `patchSignals()` which generates:

```
event: datastar-patch-signals
data: {"verified":true,"repoCount":42}
```

### Test Isolation

Each test should:
1. Reset MSW handlers to defaults before running
2. Clear any browser state (cookies, storage)
3. Not depend on other tests' state
4. Clean up any created resources

### Environment Variables

Tests should use `.env.test` or inline environment variables:
- `GITHUB_CLIENT_ID=test_client_id`
- `GITHUB_CLIENT_SECRET=test_client_secret`
- `GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback`
- `DATABASE_URL=postgres://vetsdev:vetsdev_local@localhost:5432/vetsdev`
- `SESSION_SECRET=test_session_secret`

### GitHub Actions Considerations

1. **PostgreSQL Service Container**: The workflow uses a PostgreSQL service container matching the development database configuration
2. **Browser Installation**: Uses `--with-deps` to install system dependencies required by Chromium
3. **Artifact Retention**: Test reports are retained for 30 days for debugging
4. **Timeout**: 60-minute timeout prevents hung tests from blocking CI
5. **Caching**: Bun automatically caches dependencies; consider adding explicit caching for Playwright browsers in future optimization
6. **Separate Jobs**: Unit tests run in a separate job for faster feedback

### Pure Functions Identified for Unit Testing

| File | Functions |
|------|-----------|
| `session.ts` | `hashToken`, `generateToken`, `getSessionCookie`, `createSessionCookie`, `createLogoutCookie` |
| `github-oauth.ts` | `createStateCookie`, `getStateCookie`, `clearStateCookie`, `generateState`, `getAuthorizationUrl` |
| `verification.ts` | `generateRequestId`, `createIdempotencyKey` |
| `audit.ts` | `getClientInfo` |
| `config.ts` | `requireEnv`, `requireEnvInProd`, `optionalEnv` |
| `user-state.ts` | `Authenticated`, `VerificationPending`, `Verified`, `transition`, `isAuthenticated`, `isVerified`, `getUserId` |

### Dependencies to Install

```bash
bun add -d @playwright/test msw
```
