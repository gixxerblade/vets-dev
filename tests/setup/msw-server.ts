import { afterAll, afterEach, beforeAll } from "bun:test";
import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers.js";

/**
 * MSW server instance for Node.js test environment
 *
 * This server intercepts HTTP requests during tests and returns mocked responses
 * based on the configured handlers.
 *
 * Setup:
 * - beforeAll: Starts the server with warning for unhandled requests
 * - afterEach: Resets handlers to their initial state
 * - afterAll: Closes the server and cleans up
 */
export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
