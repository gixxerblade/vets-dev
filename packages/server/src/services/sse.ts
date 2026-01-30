import { Context, Data, Effect, Layer } from "effect";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";
import { Users } from "./user-repository.js";
import type { UserRepository } from "./user-repository.js";

// Errors
export class SSEError extends Data.TaggedError("SSEError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Service interface - Users dependency resolved at layer creation, not leaked to callers
export interface SSEService {
  readonly streamUser: (userId: string) => Effect.Effect<Response, SSEError>;
  readonly streamProfile: (
    username: string,
  ) => Effect.Effect<Response, SSEError>;
}

// Service tag
export class SSE extends Context.Tag("SSE")<SSE, SSEService>() {}

// Service implementation - takes Users as a parameter instead of requiring it from callers
const makeSSEService = (users: UserRepository): SSEService => ({
  streamUser: (userId) =>
    Effect.gen(function* () {
      // Fetch user data
      const user = yield* users.findById(userId).pipe(
        Effect.mapError(
          (error) =>
            new SSEError({
              message: `Failed to fetch user: ${error._tag}`,
              cause: error,
            }),
        ),
      );

      // Create SSE response using Datastar SDK
      const response = yield* Effect.try({
        try: () =>
          ServerSentEventGenerator.stream(
            async (sse) => {
              // Send initial user state
              sse.patchSignals(
                JSON.stringify({
                  verified: user.verifiedVeteran,
                  repoCount: user.profile?.githubReposCount ?? 0,
                  starCount: user.profile?.githubStarsCount ?? 0,
                  languages: user.profile?.githubLanguages ?? [],
                }),
              );
            },
            {
              keepalive: true,
              responseInit: {
                headers: {
                  "Cache-Control": "no-cache",
                  Connection: "keep-alive",
                  "X-Accel-Buffering": "no",
                },
              },
            },
          ),
        catch: (error) =>
          new SSEError({
            message: "Failed to create SSE stream",
            cause: error,
          }),
      });

      return response;
    }),

  streamProfile: (username) =>
    Effect.gen(function* () {
      // Fetch user data by username
      const user = yield* users.findByUsername(username).pipe(
        Effect.mapError(
          (error) =>
            new SSEError({
              message: `Failed to fetch user profile: ${error._tag}`,
              cause: error,
            }),
        ),
      );

      // Create SSE response using Datastar SDK
      const response = yield* Effect.try({
        try: () =>
          ServerSentEventGenerator.stream(
            async (sse) => {
              // Send initial profile state
              sse.patchSignals(
                JSON.stringify({
                  username: user.githubUsername,
                  avatarUrl: user.avatarUrl,
                  verified: user.verifiedVeteran,
                  bio: user.profile?.bio ?? null,
                  website: user.profile?.website ?? null,
                  repoCount: user.profile?.githubReposCount ?? 0,
                  starCount: user.profile?.githubStarsCount ?? 0,
                  languages: user.profile?.githubLanguages ?? [],
                  lastActivity: user.profile?.githubLastActivity ?? null,
                }),
              );
            },
            {
              keepalive: true,
              responseInit: {
                headers: {
                  "Cache-Control": "no-cache",
                  Connection: "keep-alive",
                  "X-Accel-Buffering": "no",
                },
              },
            },
          ),
        catch: (error) =>
          new SSEError({
            message: "Failed to create SSE stream",
            cause: error,
          }),
      });

      return response;
    }),
});

// Layer - resolve Users dependency here so it's not leaked to callers
export const SSELive = Layer.effect(
  SSE,
  Effect.map(Users, (users) => makeSSEService(users)),
);
