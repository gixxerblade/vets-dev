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
      <section style="padding: 2rem 0;">
        <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="${user.githubUsername}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--color-border);">`
              : ""
          }
          <div>
            <h1 style="margin-bottom: 0.25rem;">${user.githubUsername}</h1>
            ${
              user.verifiedVeteran
                ? `<span class="badge badge-success">✓ Verified Veteran</span>`
                : `<span class="badge" style="background: rgba(234, 179, 8, 0.1); color: var(--color-warning); border: 1px solid rgba(234, 179, 8, 0.2);">Not Verified</span>`
            }
          </div>
        </div>

        ${
          !user.verifiedVeteran
            ? `
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
          <h3 style="margin-bottom: 0.5rem;">Verify Your Veteran Status</h3>
          <p class="text-muted" style="margin-bottom: 1rem;">
            Complete verification through ID.me to get your verified badge and public profile.
          </p>
          <a href="/verify" class="btn btn-primary">Verify Now</a>
        </div>
        `
            : ""
        }

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div style="background: var(--color-surface); border-radius: 0.5rem; padding: 1rem; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700;">${user.profile?.githubReposCount ?? 0}</div>
            <div class="text-muted">Repositories</div>
          </div>
          <div style="background: var(--color-surface); border-radius: 0.5rem; padding: 1rem; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700;">${user.profile?.githubStarsCount ?? 0}</div>
            <div class="text-muted">Stars</div>
          </div>
          <div style="background: var(--color-surface); border-radius: 0.5rem; padding: 1rem; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700;">${user.profile?.githubLanguages?.length ?? 0}</div>
            <div class="text-muted">Languages</div>
          </div>
        </div>

        ${
          user.profile?.githubLanguages &&
          user.profile.githubLanguages.length > 0
            ? `
        <div style="margin-bottom: 2rem;">
          <h3>Top Languages</h3>
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

        ${
          user.verifiedVeteran
            ? `
        <div style="background: var(--color-surface); border-radius: 0.5rem; padding: 1.5rem;">
          <h3>Your Badge</h3>
          <p class="text-muted" style="margin-bottom: 1rem;">Embed this badge in your GitHub README:</p>
          <code style="display: block; padding: 1rem; background: var(--color-bg); border-radius: 0.25rem; word-break: break-all;">
            ![Verified Veteran](https://vets.dev/badge/${user.githubUsername}.svg)
          </code>
        </div>
        `
            : ""
        }

        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
          <form action="/logout" method="POST" style="display: inline;">
            <button type="submit" class="btn btn-outline">Sign Out</button>
          </form>
        </div>
      </section>
    `,
  });
