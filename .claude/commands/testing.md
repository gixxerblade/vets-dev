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
- Follow the patterns established in the testing plan at `specs/playwright-msw-integration-testing.md`

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
   - Follow patterns in existing test files:
     - `packages/server/src/services/__tests__/session.test.ts`
     - `packages/server/src/services/__tests__/github-oauth.test.ts`
     - `packages/shared/src/state/__tests__/user-state.test.ts`

4. **Generate Integration Tests** (if TEST_TYPE is --e2e or --all)
   - For each changed service:
     - Create or update MSW handlers in `tests/setup/msw-handlers.ts`
     - Create or update fixtures in `tests/fixtures/`
     - Create Playwright test in `tests/e2e/`
   - For each changed template:
     - Create Playwright test verifying Datastar bindings and SSE integration
   - Follow patterns in existing E2E tests:
     - `tests/e2e/github-oauth.spec.ts`
     - `tests/e2e/dashboard-sse.spec.ts`
     - `tests/e2e/profile-sse.spec.ts`

5. **Run Tests**
   - Run `bun test` for unit tests
   - Run `bun run test:e2e` for e2e tests
   - Report any failures

## Pure Function Detection

A function is considered "pure" and suitable for unit testing if:
- It takes inputs and returns outputs without side effects
- It doesn't call external APIs or databases
- It doesn't modify global state
- It's deterministic (same inputs = same outputs)

Examples of pure functions in the codebase:
- Cookie helpers: `createSessionCookie()`, `getSessionCookie()`, `createLogoutCookie()`
- State constructors: `Authenticated()`, `Verified()`, `VerificationPending()`
- State helpers: `isAuthenticated()`, `isVerified()`, `getUserId()`
- OAuth helpers: `generateState()`, `getAuthorizationUrl()`, `createStateCookie()`

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
import { functionName } from '../filename.js';

describe('functionName', () => {
  test('should return expected output for valid input', () => {
    const result = functionName('input');
    expect(result).toBe('expected');
  });

  test('should handle edge case', () => {
    const result = functionName('');
    expect(result).toBeNull();
  });

  test('should throw for invalid input', () => {
    expect(() => functionName(null)).toThrow();
  });
});
```

## Example E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete happy path flow', async ({ page }) => {
    await page.goto('/path');

    // Verify initial state
    expect(await page.textContent('h1')).toBe('Expected Title');

    // Perform action
    await page.click('button');

    // Verify result
    await page.waitForURL('/new-path');
  });

  test('should handle error case', async ({ page }) => {
    // Test error handling
  });
});
```

## Examples

Generate unit tests only:
```
/testing --unit
```

Generate E2E tests only:
```
/testing --e2e
```

Generate all tests for changes since main:
```
/testing --all main
```

Generate all tests for changes since feature branch:
```
/testing --all origin/develop
```

## Report

After generating tests:
- List all test files created or updated
- Run the tests and report results
- Show any failures that need to be addressed
- Provide summary of coverage added
