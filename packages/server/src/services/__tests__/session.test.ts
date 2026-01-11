import { describe, expect, test } from "bun:test";
import {
  createLogoutCookie,
  createSessionCookie,
  getSessionCookie,
} from "../session.js";

describe("Session Cookie Helpers", () => {
  describe("getSessionCookie", () => {
    test("should extract session cookie from request", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "vets_session=test_token_123; other=value",
        },
      });

      const result = getSessionCookie(request);
      expect(result).toBe("test_token_123");
    });

    test("should return null when no cookie header exists", () => {
      const request = new Request("http://localhost:3000");
      const result = getSessionCookie(request);
      expect(result).toBeNull();
    });

    test("should return null when session cookie is missing", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "other=value; another=thing",
        },
      });

      const result = getSessionCookie(request);
      expect(result).toBeNull();
    });

    test("should handle cookie value with equals signs", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "vets_session=token=with=equals",
        },
      });

      const result = getSessionCookie(request);
      expect(result).toBe("token=with=equals");
    });
  });

  describe("createSessionCookie", () => {
    test("should create secure session cookie by default", () => {
      const cookie = createSessionCookie("test_token");

      expect(cookie).toContain("vets_session=test_token");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).toContain("Max-Age=604800"); // 7 days in seconds
      expect(cookie).toContain("Secure");
    });

    test("should create non-secure cookie when secure=false", () => {
      const cookie = createSessionCookie("test_token", false);

      expect(cookie).toContain("vets_session=test_token");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).not.toContain("Secure");
    });

    test("should handle special characters in token", () => {
      const token = "token-with_special.chars123";
      const cookie = createSessionCookie(token);

      expect(cookie).toContain(`vets_session=${token}`);
    });
  });

  describe("createLogoutCookie", () => {
    test("should create cookie with Max-Age=0", () => {
      const cookie = createLogoutCookie();

      expect(cookie).toContain("vets_session=");
      expect(cookie).toContain("Max-Age=0");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("SameSite=Lax");
    });
  });
});
