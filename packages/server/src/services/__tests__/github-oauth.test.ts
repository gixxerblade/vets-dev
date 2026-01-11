import { describe, expect, test } from "bun:test";
import {
  clearStateCookie,
  createStateCookie,
  generateState,
  getAuthorizationUrl,
  getStateCookie,
} from "../github-oauth.js";

describe("GitHub OAuth Helpers", () => {
  describe("generateState", () => {
    test("should generate random 64-character hex string", () => {
      const state = generateState();
      expect(state).toHaveLength(64);
      expect(state).toMatch(/^[a-f0-9]{64}$/);
    });

    test("should generate different states on multiple calls", () => {
      const state1 = generateState();
      const state2 = generateState();
      const state3 = generateState();

      expect(state1).not.toBe(state2);
      expect(state2).not.toBe(state3);
      expect(state1).not.toBe(state3);
    });
  });

  describe("getAuthorizationUrl", () => {
    test("should construct valid GitHub authorization URL", () => {
      const state = "test_state_123";
      const url = getAuthorizationUrl(state);

      expect(url).toContain("https://github.com/login/oauth/authorize");
      expect(url).toContain(`state=${state}`);
      expect(url).toContain("scope=read%3Auser");
      expect(url).toContain("client_id=");
      expect(url).toContain("redirect_uri=");
    });

    test("should URL-encode state parameter", () => {
      const state = "state with spaces & special=chars";
      const url = getAuthorizationUrl(state);

      // URLSearchParams uses + for spaces, so verify the encoded parts are present
      expect(url).toContain("state+with+spaces");
      expect(url).toContain("%26"); // & encoded
      expect(url).toContain("special%3Dchars"); // = encoded
    });
  });

  describe("createStateCookie", () => {
    test("should create secure state cookie by default", () => {
      const state = "test_state";
      const cookie = createStateCookie(state);

      expect(cookie).toContain(`github_oauth_state=${state}`);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Max-Age=300"); // 5 minutes
      expect(cookie).toContain("Secure");
    });

    test("should create non-secure cookie when secure=false", () => {
      const state = "test_state";
      const cookie = createStateCookie(state, false);

      expect(cookie).toContain(`github_oauth_state=${state}`);
      expect(cookie).not.toContain("Secure");
    });
  });

  describe("getStateCookie", () => {
    test("should extract state cookie from request", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "github_oauth_state=abc123; other=value",
        },
      });

      const result = getStateCookie(request);
      expect(result).toBe("abc123");
    });

    test("should return null when no cookie header exists", () => {
      const request = new Request("http://localhost:3000");
      const result = getStateCookie(request);
      expect(result).toBeNull();
    });

    test("should return null when state cookie is missing", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "other=value",
        },
      });

      const result = getStateCookie(request);
      expect(result).toBeNull();
    });
  });

  describe("clearStateCookie", () => {
    test("should create cookie with Max-Age=0", () => {
      const cookie = clearStateCookie();

      expect(cookie).toContain("github_oauth_state=");
      expect(cookie).toContain("Max-Age=0");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("SameSite=Lax");
    });
  });
});
