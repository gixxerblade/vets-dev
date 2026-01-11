import { beforeEach, describe, expect, test } from "bun:test";

describe("Config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment to original state before each test
    process.env = { ...originalEnv };
  });

  describe("Environment validation", () => {
    test("should load config with all required vars in production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      process.env.GITHUB_CLIENT_ID = "client_id";
      process.env.GITHUB_CLIENT_SECRET = "client_secret";

      // Re-import config to pick up new env vars
      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.nodeEnv).toBe("production");
      expect(config.databaseUrl).toBe("postgres://test");
      expect(config.sessionSecret).toBe("secret123");
      expect(config.github.clientId).toBe("client_id");
      expect(config.github.clientSecret).toBe("client_secret");
    });

    test("should use default values in development", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      // Clear GitHub vars - should use defaults
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.port).toBe(3000);
      expect(config.host).toBe("localhost");
      expect(config.github.clientId).toBe("");
      expect(config.github.clientSecret).toBe("");
    });
  });

  describe("Getters", () => {
    test("isDev should return true when NODE_ENV=development", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.isDev).toBe(true);
      expect(config.isProd).toBe(false);
    });

    test("isProd should return true when NODE_ENV=production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      process.env.GITHUB_CLIENT_ID = "client_id";
      process.env.GITHUB_CLIENT_SECRET = "client_secret";

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.isProd).toBe(true);
      expect(config.isDev).toBe(false);
    });

    test("github.isConfigured should return true when credentials are set", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      process.env.GITHUB_CLIENT_ID = "client_id";
      process.env.GITHUB_CLIENT_SECRET = "client_secret";

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.github.isConfigured).toBe(true);
    });

    test("github.isConfigured should return false when credentials are missing", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      // Clear GitHub vars
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.github.isConfigured).toBe(false);
    });
  });

  describe("Default values", () => {
    test("should use PORT default of 3000", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      delete process.env.PORT;

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.port).toBe(3000);
    });

    test("should use custom PORT when set", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";
      process.env.PORT = "8080";

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.port).toBe(8080);
    });

    test("should use default GitHub callback URL", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgres://test";
      process.env.SESSION_SECRET = "secret123";

      delete require.cache[require.resolve("../config.js")];
      const { config } = require("../config.js");

      expect(config.github.callbackUrl).toBe(
        "http://localhost:3000/auth/github/callback",
      );
    });
  });
});
