// Load environment variables first
import "./env.js";

import {
  renderDashboard,
  renderError,
  renderHomePage,
  renderNotFound,
  renderPublicProfile,
  renderVerify,
} from "@vets-dev/web";
import { Effect, Exit } from "effect";
import { config } from "./config.js";
import { generateState, getAuthorizationUrl } from "./services/github-oauth.js";
import {
  Audit,
  clearStateCookie,
  createLogoutCookie,
  createSessionCookie,
  createStateCookie,
  GitHubOAuth,
  GitHubProfile,
  getClientInfo,
  getSessionCookie,
  getStateCookie,
  ServicesLive,
  Session,
  SSE,
  Users,
} from "./services/index.js";

console.log(`🚀 vets.dev server starting...`);
console.log(`📍 http://${config.host}:${config.port}`);
console.log(`🏥 Health check: http://${config.host}:${config.port}/health`);

// Helper to run an Effect and return a Response
const runEffect = <E, A>(
  effect: Effect.Effect<
    A,
    E,
    Session | Users | Audit | GitHubOAuth | GitHubProfile | SSE
  >,
): Promise<A> => Effect.runPromise(Effect.provide(effect, ServicesLive));

// Effect-based route handlers
const handleHome = (request: Request) =>
  Effect.gen(function* () {
    const session = yield* Session;
    const token = getSessionCookie(request);

    if (token) {
      const userResult = yield* session.validate(token).pipe(
        Effect.map((user) => user),
        Effect.catchAll(() => Effect.succeed(null)),
      );

      if (userResult) {
        return Response.redirect("/dashboard", 302);
      }
    }

    return html(renderHomePage());
  });

const handleOAuthCallback = (request: Request, url: URL) =>
  Effect.gen(function* () {
    const session = yield* Session;
    const users = yield* Users;
    const audit = yield* Audit;
    const oauth = yield* GitHubOAuth;
    const profile = yield* GitHubProfile;

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = getStateCookie(request);
    const error = url.searchParams.get("error");

    console.log("OAuth callback received:", {
      hasCode: !!code,
      state,
      storedState,
      cookies: request.headers.get("cookie"),
      error,
    });

    if (error) {
      console.error("GitHub OAuth error:", error);
      return html(renderError(`GitHub authentication failed: ${error}`), 400);
    }

    if (!state || !storedState || state !== storedState) {
      console.error("State mismatch:", { state, storedState });
      return html(
        renderError(
          `Invalid authentication state. Please try again. (state: ${state ? "present" : "missing"}, cookie: ${storedState ? "present" : "missing"})`,
        ),
        400,
      );
    }

    if (!code) {
      return html(renderError("No authorization code received."), 400);
    }

    // Exchange code for token
    const accessToken = yield* oauth.exchangeCodeForToken(code).pipe(
      Effect.catchAll((err) => {
        console.error("Token exchange error:", err);
        return Effect.fail(err);
      }),
    );

    // Fetch GitHub user
    const githubUser = yield* oauth.fetchUser(accessToken).pipe(
      Effect.catchAll((err) => {
        console.error("User fetch error:", err);
        return Effect.fail(err);
      }),
    );

    // Create or update user
    const { user, isNewUser } = yield* users.upsertFromGitHub(githubUser);

    // Create session
    const sessionToken = yield* session.create(user.id);

    // Log audit event
    const { ipAddress, userAgent } = getClientInfo(request);
    yield* audit.log({
      userId: user.id,
      action: "login",
      ipAddress,
      userAgent,
      metadata: { isNewUser, githubUsername: githubUser.login },
    });

    // Refresh profile stats in background (fork to not block)
    yield* profile.refreshIfStale(user.id, user.githubUsername).pipe(
      Effect.catchAll((err) => {
        console.error(`Failed to refresh profile:`, err);
        return Effect.void;
      }),
      Effect.fork,
    );

    // Redirect to dashboard with session cookie
    const headers = new Headers();
    headers.set("Location", "/dashboard");
    headers.append(
      "Set-Cookie",
      createSessionCookie(sessionToken, !config.isDev),
    );
    headers.append("Set-Cookie", clearStateCookie());
    return new Response(null, { status: 302, headers });
  });

const handleLogout = (request: Request) =>
  Effect.gen(function* () {
    const sessionService = yield* Session;
    const audit = yield* Audit;

    const token = getSessionCookie(request);

    // Get current user before deleting session
    let currentUser = null;
    if (token) {
      currentUser = yield* sessionService.validate(token).pipe(
        Effect.map((user) => user),
        Effect.catchAll(() => Effect.succeed(null)),
      );

      yield* sessionService
        .delete(token)
        .pipe(Effect.catchAll(() => Effect.void));
    }

    if (currentUser) {
      const { ipAddress, userAgent } = getClientInfo(request);
      yield* audit.log({
        userId: currentUser.id,
        action: "logout",
        ipAddress,
        userAgent,
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": createLogoutCookie(),
      },
    });
  });

const handleDashboard = (request: Request) =>
  Effect.gen(function* () {
    const sessionService = yield* Session;
    const usersService = yield* Users;

    const token = getSessionCookie(request);

    if (!token) {
      return Response.redirect("/auth/github", 302);
    }

    const sessionUser = yield* sessionService
      .validate(token)
      .pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (!sessionUser) {
      return Response.redirect("/auth/github", 302);
    }

    const fullUser = yield* usersService.findByUsernameOptional(
      sessionUser.githubUsername,
    );

    if (!fullUser) {
      return html(renderError("User not found."), 404);
    }

    return html(renderDashboard(fullUser));
  });

const handleVerify = (request: Request) =>
  Effect.gen(function* () {
    const sessionService = yield* Session;
    const usersService = yield* Users;

    const token = getSessionCookie(request);

    if (!token) {
      return Response.redirect("/auth/github", 302);
    }

    const sessionUser = yield* sessionService
      .validate(token)
      .pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (!sessionUser) {
      return Response.redirect("/auth/github", 302);
    }

    const fullUser = yield* usersService.findByUsernameOptional(
      sessionUser.githubUsername,
    );

    if (!fullUser) {
      return html(renderError("User not found."), 404);
    }

    return html(renderVerify(fullUser));
  });

const handleSSEUser = (request: Request) =>
  Effect.gen(function* () {
    const sessionService = yield* Session;
    const sse = yield* SSE;

    const token = getSessionCookie(request);

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sessionUser = yield* sessionService
      .validate(token)
      .pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (!sessionUser) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Stream user data
    return yield* sse.streamUser(sessionUser.id);
  });

const handleSSEProfile = (username: string) =>
  Effect.gen(function* () {
    const sse = yield* SSE;

    // Reserved paths check
    const reserved = [
      "health",
      "auth",
      "logout",
      "dashboard",
      "verify",
      "badge",
      "api",
    ];
    if (reserved.includes(username.toLowerCase())) {
      return new Response("Not Found", { status: 404 });
    }

    // Stream profile data
    return yield* sse.streamProfile(username);
  });

const handlePublicProfile = (username: string) =>
  Effect.gen(function* () {
    const usersService = yield* Users;

    // Skip reserved paths
    const reserved = [
      "health",
      "auth",
      "logout",
      "dashboard",
      "verify",
      "badge",
      "api",
    ];
    if (reserved.includes(username.toLowerCase())) {
      return html(renderNotFound(), 404);
    }

    const profile = yield* usersService.findByUsernameOptional(username);

    if (!profile) {
      return html(renderNotFound(), 404);
    }

    // Only show public profiles for verified users
    if (!profile.verifiedVeteran) {
      return html(renderNotFound(), 404);
    }

    return html(renderPublicProfile(profile));
  });

const server = Bun.serve({
  port: config.port,
  hostname: config.host,

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Health check (pure, no Effect needed)
      if (path === "/health") {
        return Response.json({
          status: "ok",
          timestamp: new Date().toISOString(),
        });
      }

      // Home page
      if (path === "/" && method === "GET") {
        return await runEffect(handleHome(request));
      }

      // GitHub OAuth: Start (pure, no Effect needed)
      if (path === "/auth/github" && method === "GET") {
        if (!config.github.isConfigured) {
          return html(
            renderError(
              "GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env",
            ),
            503,
          );
        }

        const state = generateState();
        const authUrl = getAuthorizationUrl(state);
        const stateCookie = createStateCookie(state, !config.isDev);

        console.log("OAuth start:", {
          state: `${state.slice(0, 8)}...`,
          cookie: stateCookie,
          redirectTo: `${authUrl.slice(0, 50)}...`,
        });

        return new Response(null, {
          status: 302,
          headers: {
            Location: authUrl,
            "Set-Cookie": stateCookie,
          },
        });
      }

      // GitHub OAuth: Callback
      if (path === "/auth/github/callback" && method === "GET") {
        const result = await Effect.runPromiseExit(
          Effect.provide(handleOAuthCallback(request, url), ServicesLive),
        );

        if (Exit.isFailure(result)) {
          console.error("OAuth callback error:", result.cause);
          return html(
            renderError("Authentication failed. Please try again."),
            500,
          );
        }

        return result.value;
      }

      // Logout
      if (path === "/logout" && method === "POST") {
        return await runEffect(handleLogout(request));
      }

      // Dashboard (authenticated)
      if (path === "/dashboard" && method === "GET") {
        return await runEffect(handleDashboard(request));
      }

      // Verify page
      if (path === "/verify" && method === "GET") {
        return await runEffect(handleVerify(request));
      }

      // SSE: User data stream (authenticated)
      if (path === "/api/sse/user" && method === "GET") {
        return await runEffect(handleSSEUser(request));
      }

      // SSE: Profile data stream (public)
      const sseProfileMatch = path.match(
        /^\/api\/sse\/profile\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)$/,
      );
      if (sseProfileMatch?.[1] && method === "GET") {
        const username = sseProfileMatch[1];
        return await runEffect(handleSSEProfile(username));
      }

      // Public profile: /:username
      const usernameMatch = path.match(
        /^\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)$/,
      );
      if (usernameMatch?.[1] && method === "GET") {
        const username = usernameMatch[1];
        return await runEffect(handlePublicProfile(username));
      }

      // 404
      return html(renderNotFound(), 404);
    } catch (err) {
      console.error("Server error:", err);
      return html(renderError("An unexpected error occurred."), 500);
    }
  },
});

console.log(`✅ Server running at http://${server.hostname}:${server.port}`);

// Helper for HTML responses
function html(content: string, status: number = 200): Response {
  return new Response(content, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

