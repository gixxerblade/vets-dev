import { createHash, randomBytes } from "node:crypto";
import { db } from "@vets-dev/shared/db";
import { sessions, users } from "@vets-dev/shared/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const COOKIE_NAME = "vets_session";

// Types
export interface SessionUser {
  readonly id: string;
  readonly githubId: number;
  readonly githubUsername: string;
  readonly avatarUrl: string | null;
  readonly verifiedVeteran: boolean;
  readonly verifiedAt: Date | null;
}

// Errors
export class SessionError extends Data.TaggedError("SessionError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class SessionNotFoundError extends Data.TaggedError(
  "SessionNotFoundError",
)<{
  readonly message: string;
}> {}

// Service interface
export interface SessionService {
  readonly create: (userId: string) => Effect.Effect<string, SessionError>;
  readonly validate: (
    token: string,
  ) => Effect.Effect<SessionUser, SessionNotFoundError | SessionError>;
  readonly delete: (token: string) => Effect.Effect<void, SessionError>;
  readonly deleteAllForUser: (
    userId: string,
  ) => Effect.Effect<void, SessionError>;
}

// Service tag
export class Session extends Context.Tag("Session")<
  Session,
  SessionService
>() {}

// Helpers
const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const generateToken = (): string => randomBytes(32).toString("hex");

// Service implementation
const makeSessionService = (): SessionService => ({
  create: (userId) =>
    Effect.gen(function* () {
      const token = generateToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

      yield* Effect.tryPromise({
        try: () =>
          db.insert(sessions).values({
            userId,
            tokenHash,
            expiresAt,
          }),
        catch: (error) =>
          new SessionError({
            message: "Failed to create session",
            cause: error,
          }),
      });

      return token;
    }),

  validate: (token) =>
    Effect.gen(function* () {
      const tokenHash = hashToken(token);

      const result = yield* Effect.tryPromise({
        try: () =>
          db
            .select({
              session: sessions,
              user: users,
            })
            .from(sessions)
            .innerJoin(users, eq(sessions.userId, users.id))
            .where(
              and(
                eq(sessions.tokenHash, tokenHash),
                gt(sessions.expiresAt, new Date()),
              ),
            )
            .limit(1),
        catch: (error) =>
          new SessionError({
            message: "Failed to validate session",
            cause: error,
          }),
      });

      const row = result[0];
      if (!row) {
        return yield* Effect.fail(
          new SessionNotFoundError({ message: "Session not found or expired" }),
        );
      }

      const { user } = row;
      return {
        id: user.id,
        githubId: user.githubId,
        githubUsername: user.githubUsername,
        avatarUrl: user.avatarUrl,
        verifiedVeteran: user.verifiedVeteran ?? false,
        verifiedAt: user.verifiedAt,
      };
    }),

  delete: (token) =>
    Effect.tryPromise({
      try: () =>
        db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token))),
      catch: (error) =>
        new SessionError({ message: "Failed to delete session", cause: error }),
    }).pipe(Effect.asVoid),

  deleteAllForUser: (userId) =>
    Effect.tryPromise({
      try: () => db.delete(sessions).where(eq(sessions.userId, userId)),
      catch: (error) =>
        new SessionError({
          message: "Failed to delete user sessions",
          cause: error,
        }),
    }).pipe(Effect.asVoid),
});

// Layer
export const SessionLive = Layer.succeed(Session, makeSessionService());

// Cookie helpers (pure functions, no Effect needed)
export const getSessionCookie = (request: Request): string | null => {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    }),
  );

  return cookies[COOKIE_NAME] ?? null;
};

export const createSessionCookie = (
  token: string,
  secure: boolean = true,
): string => {
  const flags = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${SESSION_DURATION_MS / 1000}`,
  ];

  if (secure) {
    flags.push("Secure");
  }

  return flags.join("; ");
};

export const createLogoutCookie = (): string =>
  `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
