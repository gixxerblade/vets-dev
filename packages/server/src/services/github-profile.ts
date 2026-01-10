import { db } from "@vets-dev/shared/db";
import { profiles } from "@vets-dev/shared/db/schema";
import { eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";

const GITHUB_API_BASE = "https://api.github.com";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Types
interface GitHubRepo {
  readonly stargazers_count: number;
  readonly language: string | null;
  readonly pushed_at: string;
  readonly fork: boolean;
}

export interface ProfileStats {
  readonly reposCount: number;
  readonly starsCount: number;
  readonly languages: string[];
  readonly lastActivity: Date | null;
}

// Errors
export class GitHubProfileError extends Data.TaggedError("GitHubProfileError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class ProfileNotFoundError extends Data.TaggedError(
  "ProfileNotFoundError",
)<{
  readonly username: string;
}> {}

// Service interface
export interface GitHubProfileService {
  readonly fetchStats: (
    username: string,
    accessToken?: string,
  ) => Effect.Effect<ProfileStats, GitHubProfileError | ProfileNotFoundError>;
  readonly updateCachedStats: (
    userId: string,
    stats: ProfileStats,
  ) => Effect.Effect<void, GitHubProfileError>;
  readonly refreshIfStale: (
    userId: string,
    username: string,
    accessToken?: string,
  ) => Effect.Effect<void, GitHubProfileError>;
}

// Service tag
export class GitHubProfile extends Context.Tag("GitHubProfile")<
  GitHubProfile,
  GitHubProfileService
>() {}

// Service implementation
const makeGitHubProfileService = (): GitHubProfileService => ({
  fetchStats: (username, accessToken) =>
    Effect.gen(function* () {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "vets.dev",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // Fetch repos with pagination
      const repos: GitHubRepo[] = [];
      let page = 1;
      const perPage = 100;

      while (page <= 10) {
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(
              `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner`,
              { headers },
            ),
          catch: (error) =>
            new GitHubProfileError({
              message: "Network error fetching repos",
              cause: error,
            }),
        });

        if (response.status === 404) {
          return yield* Effect.fail(new ProfileNotFoundError({ username }));
        }

        if (!response.ok) {
          return yield* Effect.fail(
            new GitHubProfileError({
              message: `GitHub API error: ${response.status}`,
            }),
          );
        }

        const pageRepos = yield* Effect.tryPromise({
          try: () => response.json() as Promise<GitHubRepo[]>,
          catch: (error) =>
            new GitHubProfileError({
              message: "Failed to parse repos",
              cause: error,
            }),
        });

        if (pageRepos.length === 0) break;
        repos.push(...pageRepos);
        if (pageRepos.length < perPage) break;
        page++;
      }

      // Calculate stats
      const ownRepos = repos.filter((r) => !r.fork);
      const starsCount = ownRepos.reduce(
        (sum, r) => sum + r.stargazers_count,
        0,
      );

      // Count languages
      const languageCounts = new Map<string, number>();
      for (const repo of ownRepos) {
        if (repo.language) {
          languageCounts.set(
            repo.language,
            (languageCounts.get(repo.language) ?? 0) + 1,
          );
        }
      }

      // Top 5 languages
      const languages = [...languageCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);

      // Most recent activity
      const lastActivity =
        repos.length > 0
          ? new Date(
              Math.max(...repos.map((r) => new Date(r.pushed_at).getTime())),
            )
          : null;

      return {
        reposCount: ownRepos.length,
        starsCount,
        languages,
        lastActivity,
      };
    }),

  updateCachedStats: (userId, stats) =>
    Effect.tryPromise({
      try: () =>
        db
          .update(profiles)
          .set({
            githubReposCount: stats.reposCount,
            githubStarsCount: stats.starsCount,
            githubLanguages: stats.languages,
            githubLastActivity: stats.lastActivity,
            profileCachedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, userId)),
      catch: (error) =>
        new GitHubProfileError({
          message: "Failed to update profile stats",
          cause: error,
        }),
    }).pipe(Effect.asVoid),

  refreshIfStale: (userId, username, accessToken) =>
    Effect.gen(function* () {
      const [profile] = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1),
        catch: (error) =>
          new GitHubProfileError({
            message: "Failed to fetch profile",
            cause: error,
          }),
      });

      if (!profile) return;

      const cachedAt = profile.profileCachedAt;
      const isStale =
        !cachedAt || Date.now() - cachedAt.getTime() > CACHE_DURATION_MS;

      if (isStale) {
        const service = makeGitHubProfileService();

        const stats = yield* service
          .fetchStats(username, accessToken)
          .pipe(
            Effect.catchTag("ProfileNotFoundError", () => Effect.succeed(null)),
          );

        if (stats) {
          yield* service.updateCachedStats(userId, stats);
          yield* Effect.log(`Refreshed profile stats for ${username}`);
        }
      }
    }),
});

// Layer
export const GitHubProfileLive = Layer.succeed(
  GitHubProfile,
  makeGitHubProfileService(),
);
