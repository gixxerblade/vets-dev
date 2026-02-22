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
      <section class="py-8" data-on-load="@get('/api/sse/user')" data-signals="{verified: ${user.verifiedVeteran}, repoCount: ${user.profile?.githubReposCount ?? 0}, starCount: ${user.profile?.githubStarsCount ?? 0}, languageCount: ${user.profile?.githubLanguages?.length ?? 0}}" aria-labelledby="dashboard-heading">
        <div class="flex items-center gap-6 mb-8">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="Profile photo of ${user.githubUsername}" class="w-20 h-20 rounded-full border-2 border-border">`
              : ""
          }
          <div>
            <h1 id="dashboard-heading" class="mb-1">${user.githubUsername}</h1>
            <div role="status" aria-live="polite" aria-atomic="true">
              <span class="badge badge-success" data-show="$verified" aria-label="Verification status: Verified Veteran"><span aria-hidden="true">✓ </span>Verified Veteran</span>
              <span class="badge badge-warning" data-show="!$verified" aria-label="Verification status: Not Verified">Not Verified</span>
            </div>
          </div>
        </div>

        <div class="card-bordered mb-8" data-show="!$verified">
          <h2 class="mb-2">Verify Your Veteran Status</h2>
          <p class="text-text-muted mb-4">
            Complete verification through GovX to get your verified badge and public profile.
          </p>
          <a href="/verify" class="btn btn-primary">Verify Now</a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" aria-label="GitHub statistics">
          <div class="stat-card" aria-label="Repositories">
            <div class="text-4xl font-bold" data-text="$repoCount" aria-live="polite">${user.profile?.githubReposCount ?? 0}</div>
            <div class="text-muted" aria-hidden="true">Repositories</div>
          </div>
          <div class="stat-card" aria-label="Stars">
            <div class="text-4xl font-bold" data-text="$starCount" aria-live="polite">${user.profile?.githubStarsCount ?? 0}</div>
            <div class="text-muted" aria-hidden="true">Stars</div>
          </div>
          <div class="stat-card" aria-label="Languages">
            <div class="text-4xl font-bold" data-text="$languageCount" aria-live="polite">${user.profile?.githubLanguages?.length ?? 0}</div>
            <div class="text-muted" aria-hidden="true">Languages</div>
          </div>
        </div>

        ${
          user.profile?.githubLanguages &&
          user.profile.githubLanguages.length > 0
            ? `
        <div class="mb-8">
          <h3>Top Languages</h3>
          <ul class="flex gap-2 flex-wrap list-none p-0" aria-label="Top programming languages">
            ${user.profile.githubLanguages
              .map(
                (lang) =>
                  `<li><span class="bg-surface px-3 py-1 rounded-full text-sm">${lang}</span></li>`,
              )
              .join("")}
          </ul>
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
