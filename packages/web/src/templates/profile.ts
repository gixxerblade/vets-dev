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
      <section style="padding: 2rem 0;" data-on-load="@get('/api/sse/profile/${user.githubUsername}')" data-signals="{
  repoCount: ${user.profile?.githubReposCount ?? 0},
  starCount: ${user.profile?.githubStarsCount ?? 0}
}">
        <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="${user.githubUsername}" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid var(--color-border);">`
              : ""
          }
          <div>
            <h1 style="margin-bottom: 0.5rem;">${user.githubUsername}</h1>
            ${
              user.verifiedVeteran
                ? `<span class="badge badge-success">✓ Verified Veteran Developer</span>`
                : ""
            }
            ${
              user.profile?.bio
                ? `<p class="text-muted" style="margin-top: 0.5rem;">${escapeHtml(user.profile.bio)}</p>`
                : ""
            }
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div style="background: var(--color-surface); border-radius: 0.5rem; padding: 1rem; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700;" data-text="$repoCount">${user.profile?.githubReposCount ?? 0}</div>
            <div class="text-muted">Repositories</div>
          </div>
          <div style="background: var(--color-surface); border-radius: 0.5rem; padding: 1rem; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700;" data-text="$starCount">${user.profile?.githubStarsCount ?? 0}</div>
            <div class="text-muted">Stars</div>
          </div>
        </div>

        ${
          user.profile?.githubLanguages &&
          user.profile.githubLanguages.length > 0
            ? `
        <div style="margin-bottom: 2rem;">
          <h3>Languages</h3>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${user.profile.githubLanguages
              .map(
                (lang) =>
                  `<span style="background: var(--color-surface); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem;">${lang}</span>`,
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
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
        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--color-border); color: var(--color-text-muted); font-size: 0.875rem;">
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
