import { db } from "@vets-dev/shared/db";
import { profiles, users } from "@vets-dev/shared/db/schema";
import { eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";
import type { GitHubUser } from "./github-oauth.js";

// Types
export interface UserWithProfile {
  readonly id: string;
  readonly githubId: number;
  readonly githubUsername: string;
  readonly avatarUrl: string | null;
  readonly verifiedVeteran: boolean;
  readonly verifiedAt: Date | null;
  readonly createdAt: Date | null;
  readonly profile: {
    readonly bio: string | null;
    readonly website: string | null;
    readonly githubReposCount: number;
    readonly githubStarsCount: number;
    readonly githubLanguages: string[];
    readonly githubLastActivity: Date | null;
  } | null;
}

// Errors
export class UserRepositoryError extends Data.TaggedError(
  "UserRepositoryError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly identifier: string;
}> {}

// Service interface
export interface UserRepository {
  readonly upsertFromGitHub: (
    githubUser: GitHubUser,
  ) => Effect.Effect<
    { user: UserWithProfile; isNewUser: boolean },
    UserRepositoryError
  >;
  readonly findById: (
    id: string,
  ) => Effect.Effect<UserWithProfile, UserNotFoundError | UserRepositoryError>;
  readonly findByUsername: (
    username: string,
  ) => Effect.Effect<UserWithProfile, UserNotFoundError | UserRepositoryError>;
  readonly findByUsernameOptional: (
    username: string,
  ) => Effect.Effect<UserWithProfile | null, UserRepositoryError>;
}

// Service tag
export class Users extends Context.Tag("Users")<Users, UserRepository>() {}

// Helper to map DB result to UserWithProfile
const mapToUserWithProfile = (
  user: typeof users.$inferSelect,
  profile: typeof profiles.$inferSelect | null,
): UserWithProfile => ({
  id: user.id,
  githubId: user.githubId,
  githubUsername: user.githubUsername,
  avatarUrl: user.avatarUrl,
  verifiedVeteran: user.verifiedVeteran ?? false,
  verifiedAt: user.verifiedAt,
  createdAt: user.createdAt,
  profile: profile
    ? {
        bio: profile.bio,
        website: profile.website,
        githubReposCount: profile.githubReposCount ?? 0,
        githubStarsCount: profile.githubStarsCount ?? 0,
        githubLanguages: (profile.githubLanguages as string[]) ?? [],
        githubLastActivity: profile.githubLastActivity,
      }
    : null,
});

// Service implementation
const makeUserRepository = (): UserRepository => ({
  upsertFromGitHub: (githubUser) =>
    Effect.gen(function* () {
      // Check if user exists
      const existingUsers = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(users)
            .where(eq(users.githubId, githubUser.id))
            .limit(1),
        catch: (error) =>
          new UserRepositoryError({
            message: "Failed to check existing user",
            cause: error,
          }),
      });

      const existing = existingUsers[0];
      if (existing) {
        // Update avatar and username
        yield* Effect.tryPromise({
          try: () =>
            db
              .update(users)
              .set({
                githubUsername: githubUser.login,
                avatarUrl: githubUser.avatar_url,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existing.id)),
          catch: (error) =>
            new UserRepositoryError({
              message: "Failed to update user",
              cause: error,
            }),
        });

        const repo = makeUserRepository();
        const user = yield* repo.findById(existing.id).pipe(
          Effect.catchTag("UserNotFoundError", () =>
            Effect.fail(
              new UserRepositoryError({
                message: "User not found after update",
              }),
            ),
          ),
        );
        return { user, isNewUser: false };
      }

      // Create new user
      const insertResult = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(users)
            .values({
              githubId: githubUser.id,
              githubUsername: githubUser.login,
              avatarUrl: githubUser.avatar_url,
            })
            .returning(),
        catch: (error) =>
          new UserRepositoryError({
            message: "Failed to create user",
            cause: error,
          }),
      });

      const newUser = insertResult[0];
      if (!newUser) {
        return yield* new UserRepositoryError({
          message: "Failed to create user - no result returned",
        });
      }

      // Create empty profile
      yield* Effect.tryPromise({
        try: () =>
          db.insert(profiles).values({
            userId: newUser.id,
            bio: githubUser.bio,
            website: githubUser.blog,
            githubReposCount: githubUser.public_repos,
          }),
        catch: (error) =>
          new UserRepositoryError({
            message: "Failed to create profile",
            cause: error,
          }),
      });

      const repo = makeUserRepository();
      const user = yield* repo.findById(newUser.id).pipe(
        Effect.catchTag("UserNotFoundError", () =>
          Effect.fail(
            new UserRepositoryError({
              message: "User not found after creation",
            }),
          ),
        ),
      );
      return { user, isNewUser: true };
    }),

  findById: (id) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db
            .select({ user: users, profile: profiles })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(eq(users.id, id))
            .limit(1),
        catch: (error) =>
          new UserRepositoryError({
            message: "Failed to find user",
            cause: error,
          }),
      });

      const row = result[0];
      if (!row) {
        return yield* new UserNotFoundError({ identifier: id });
      }

      const { user, profile } = row;
      return mapToUserWithProfile(user, profile);
    }),

  findByUsername: (username) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db
            .select({ user: users, profile: profiles })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(eq(users.githubUsername, username))
            .limit(1),
        catch: (error) =>
          new UserRepositoryError({
            message: "Failed to find user",
            cause: error,
          }),
      });

      const row = result[0];
      if (!row) {
        return yield* new UserNotFoundError({ identifier: username });
      }

      const { user, profile } = row;
      return mapToUserWithProfile(user, profile);
    }),

  findByUsernameOptional: (username) =>
    Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db
            .select({ user: users, profile: profiles })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(eq(users.githubUsername, username))
            .limit(1),
        catch: (error) =>
          new UserRepositoryError({
            message: "Failed to find user",
            cause: error,
          }),
      });

      const row = result[0];
      if (!row) {
        return null;
      }

      const { user, profile } = row;
      return mapToUserWithProfile(user, profile);
    }),
});

// Layer
export const UsersLive = Layer.succeed(Users, makeUserRepository());
