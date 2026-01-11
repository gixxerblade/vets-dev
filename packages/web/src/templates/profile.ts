import { layout } from "./layout.js";

export interface PublicProfile {
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

export const renderPublicProfile = (user: PublicProfile): string =>
  layout({
    title: user.githubUsername,
    description: `${user.githubUsername} - ${user.verifiedVeteran ? "Verified Veteran Developer" : "Developer"} on vets.dev`,
    content: `
      <section class="py-8" data-on-load="@get('/api/sse/profile/${user.githubUsername}')" data-signals="{
  repoCount: ${user.profile?.githubReposCount ?? 0},
  starCount: ${user.profile?.githubStarsCount ?? 0}
}">
        <div class="flex items-center gap-6 mb-8">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="${user.githubUsername}" class="w-24 h-24 rounded-full border-2 border-border">`
              : ""
          }
          <div>
            <h1 class="mb-2">${user.githubUsername}</h1>
            ${
              user.verifiedVeteran
                ? `<span class="badge badge-success">✓ Verified Veteran Developer</span>`
                : ""
            }
            ${
              user.profile?.bio
                ? `<p class="text-text-muted mt-2">${escapeHtml(user.profile.bio)}</p>`
                : ""
            }
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div class="stat-card">
            <div class="text-4xl font-bold" data-text="$repoCount">${user.profile?.githubReposCount ?? 0}</div>
            <div class="text-muted">Repositories</div>
          </div>
          <div class="stat-card">
            <div class="text-4xl font-bold" data-text="$starCount">${user.profile?.githubStarsCount ?? 0}</div>
            <div class="text-muted">Stars</div>
          </div>
        </div>

        ${
          user.profile?.githubLanguages &&
          user.profile.githubLanguages.length > 0
            ? `
        <div class="mb-8">
          <h3>Languages</h3>
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

        <div class="flex gap-4 flex-wrap">
          <a href="https://github.com/${user.githubUsername}" target="_blank" rel="noopener" class="btn btn-outline">
            View on GitHub
          </a>
          ${
            user.profile?.website
              ? `<a href="${escapeHtml(user.profile.website)}" target="_blank" rel="noopener" class="btn btn-outline">Website</a>`
              : ""
          }
        </div>

        ${
          user.verifiedVeteran && user.verifiedAt
            ? `
        <div class="mt-8 pt-4 border-t border-border text-text-muted text-sm">
          Verified since ${new Date(user.verifiedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        `
            : ""
        }
      </section>
    `,
  });

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
