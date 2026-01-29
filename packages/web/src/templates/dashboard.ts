import { layout } from "./layout.js";

export interface DashboardUser {
  githubUsername: string;
  avatarUrl: string | null;
  verifiedVeteran: boolean;
  verifiedAt: Date | null;
  profile: {
    bio: string | null;
    website: string | null;
    githubReposCount: number;
    githubStarsCount: number;
    githubLanguages: string[];
  } | null;
}

export const renderDashboard = (user: DashboardUser): string =>
  layout({
    title: "Dashboard",
    content: `
      <section class="py-8" data-on-load="@get('/api/sse/user')" data-signals="{verified: ${user.verifiedVeteran}, repoCount: ${user.profile?.githubReposCount ?? 0}, starCount: ${user.profile?.githubStarsCount ?? 0}, languageCount: ${user.profile?.githubLanguages?.length ?? 0}}">
        <div class="flex items-center gap-6 mb-8">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="${user.githubUsername}" class="w-20 h-20 rounded-full border-2 border-border">`
              : ""
          }
          <div>
            <h1 class="mb-1">${user.githubUsername}</h1>
            <span class="badge badge-success" data-show="$verified">✓ Verified Veteran</span>
            <span class="badge badge-warning" data-show="!$verified">Not Verified</span>
          </div>
        </div>

        <div class="card-bordered mb-8" data-show="!$verified">
          <h3 class="mb-2">Verify Your Veteran Status</h3>
          <p class="text-text-muted mb-4">
            Complete verification through GovX to get your verified badge and public profile.
          </p>
          <a href="/verify" class="btn btn-primary">Verify Now</a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div class="stat-card">
            <div class="text-4xl font-bold" data-text="$repoCount">${user.profile?.githubReposCount ?? 0}</div>
            <div class="text-muted">Repositories</div>
          </div>
          <div class="stat-card">
            <div class="text-4xl font-bold" data-text="$starCount">${user.profile?.githubStarsCount ?? 0}</div>
            <div class="text-muted">Stars</div>
          </div>
          <div class="stat-card">
            <div class="text-4xl font-bold" data-text="$languageCount">${user.profile?.githubLanguages?.length ?? 0}</div>
            <div class="text-muted">Languages</div>
          </div>
        </div>

        ${
          user.profile?.githubLanguages &&
          user.profile.githubLanguages.length > 0
            ? `
        <div class="mb-8">
          <h3>Top Languages</h3>
          <div class="flex gap-2 flex-wrap">
            ${user.profile.githubLanguages
              .map(
                (lang) =>
                  `<span class="bg-surface px-3 py-1 rounded-full text-sm">${lang}</span>`,
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        <div class="card" data-show="$verified">
          <h3>Your Badge</h3>
          <p class="text-text-muted mb-4">Embed this badge in your GitHub README:</p>
          <code class="block p-4 bg-bg rounded break-all">
            ![Verified Veteran](https://vets.dev/badge/${user.githubUsername}.svg)
          </code>
        </div>

        <div class="mt-8 pt-4 border-t border-border">
          <form action="/logout" method="POST" class="inline">
            <button type="submit" class="btn btn-outline">Sign Out</button>
          </form>
        </div>
      </section>
    `,
  });
