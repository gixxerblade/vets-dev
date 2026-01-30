import { randomBytes } from "node:crypto";
import { Context, Data, Effect, Layer } from "effect";
import { config } from "../config.js";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";

// Types
export interface GitHubUser {
  readonly id: number;
  readonly login: string;
  readonly avatar_url: string;
  readonly name: string | null;
  readonly bio: string | null;
  readonly blog: string | null;
  readonly public_repos: number;
}

// Errors
export class GitHubOAuthError extends Data.TaggedError("GitHubOAuthError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class GitHubTokenError extends Data.TaggedError("GitHubTokenError")<{
  readonly message: string;
  readonly errorCode?: string;
}> {}

export class GitHubUserFetchError extends Data.TaggedError(
  "GitHubUserFetchError",
)<{
  readonly message: string;
  readonly status?: number;
}> {}

// Service interface
export interface GitHubOAuthService {
  readonly generateState: () => Effect.Effect<string>;
  readonly getAuthorizationUrl: (state: string) => Effect.Effect<string>;
  readonly exchangeCodeForToken: (
    code: string,
  ) => Effect.Effect<string, GitHubTokenError>;
  readonly fetchUser: (
    accessToken: string,
  ) => Effect.Effect<GitHubUser, GitHubUserFetchError>;
}

// Service tag
export class GitHubOAuth extends Context.Tag("GitHubOAuth")<
  GitHubOAuth,
  GitHubOAuthService
>() {}

// Service implementation
const makeGitHubOAuthService = (): GitHubOAuthService => ({
  generateState: () => Effect.sync(() => randomBytes(32).toString("hex")),

  getAuthorizationUrl: (state) =>
    Effect.sync(() => {
      const params = new URLSearchParams({
        client_id: config.github.clientId,
        redirect_uri: config.github.callbackUrl,
        scope: "read:user",
        state,
      });
      return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
    }),

  exchangeCodeForToken: (code) =>
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(GITHUB_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              client_id: config.github.clientId,
              client_secret: config.github.clientSecret,
              code,
              redirect_uri: config.github.callbackUrl,
            }),
          }),
        catch: (error) =>
          new GitHubTokenError({
            message: "Network error during token exchange",
            errorCode: String(error),
          }),
      });

      if (!response.ok) {
        return yield* new GitHubTokenError({
          message: `GitHub token exchange failed: ${response.status}`,
        });
      }

      const data = yield* Effect.tryPromise({
        try: () =>
          response.json() as Promise<{
            access_token?: string;
            error?: string;
            error_description?: string;
          }>,
        catch: () =>
          new GitHubTokenError({ message: "Failed to parse token response" }),
      });

      if (data.error) {
        return yield* new GitHubTokenError({
          message: data.error_description ?? data.error,
          errorCode: data.error,
        });
      }

      if (!data.access_token) {
        return yield* new GitHubTokenError({
          message: "No access token in response",
        });
      }

      return data.access_token;
    }),

  fetchUser: (accessToken) =>
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(GITHUB_USER_URL, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "vets.dev",
            },
          }),
        catch: (error) =>
          new GitHubUserFetchError({ message: `Network error: ${error}` }),
      });

      if (!response.ok) {
        return yield* new GitHubUserFetchError({
          message: `GitHub user fetch failed`,
          status: response.status,
        });
      }

      const user = yield* Effect.tryPromise({
        try: () => response.json() as Promise<GitHubUser>,
        catch: () =>
          new GitHubUserFetchError({
            message: "Failed to parse user response",
          }),
      });

      return user;
    }),
});

// Layer
export const GitHubOAuthLive = Layer.succeed(
  GitHubOAuth,
  makeGitHubOAuthService(),
);

// State cookie helpers (pure functions)
const STATE_COOKIE_NAME = "github_oauth_state";
const STATE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export const createStateCookie = (
  state: string,
  secure: boolean = true,
): string => {
  const flags = [
    `${STATE_COOKIE_NAME}=${state}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${STATE_EXPIRY_MS / 1000}`,
  ];

  if (secure) {
    flags.push("Secure");
  }

  return flags.join("; ");
};

export const getStateCookie = (request: Request): string | null => {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    }),
  );

  return cookies[STATE_COOKIE_NAME] ?? null;
};

export const clearStateCookie = (): string =>
  `${STATE_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;

// Pure helper functions (used directly by server, not Effect-based)
export const generateState = (): string => randomBytes(32).toString("hex");

export const getAuthorizationUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: "read:user",
    state,
  });
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
};
