import { layout } from "./layout.js";

export interface VerifyPageUser {
  githubUsername: string;
  avatarUrl: string | null;
  verifiedVeteran: boolean;
  verifiedAt: Date | null;
  pendingVerification?: boolean;
}

export const renderVerify = (user: VerifyPageUser): string =>
  layout({
    title: "Verify Veteran Status",
    description: "Complete veteran verification to get your verified badge",
    content: `
      <section style="padding: 2rem 0;" data-on-load="@get('/api/sse/user')" data-signals="{
  verified: ${user.verifiedVeteran},
  pending: ${user.pendingVerification ?? false}
}">
        <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="${user.githubUsername}" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--color-border);">`
              : ""
          }
          <div>
            <h1 style="margin-bottom: 0.25rem;">Verify Your Veteran Status</h1>
            <p class="text-muted">@${user.githubUsername}</p>
          </div>
        </div>

        ${
          user.verifiedVeteran
            ? `
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;" data-show="$verified">
          <h2 style="color: var(--color-success); margin-bottom: 0.5rem;">✓ Already Verified</h2>
          <p class="text-muted" style="margin-bottom: 1rem;">
            You completed verification on ${user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "an earlier date"}.
            Your verified badge is now active on your profile.
          </p>
          <a href="/dashboard" class="btn btn-primary">Return to Dashboard</a>
        </div>
        `
            : user.pendingVerification
              ? `
        <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.2); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;" data-show="$pending && !$verified">
          <h2 style="color: var(--color-warning); margin-bottom: 0.5rem;">⏳ Verification Pending</h2>
          <p class="text-muted" style="margin-bottom: 1rem;">
            Your verification request is being processed. This usually takes a few minutes.
            Check back soon or refresh this page.
          </p>
          <a href="/dashboard" class="btn btn-outline">Return to Dashboard</a>
        </div>
        `
              : `
        <div data-show="!$verified && !$pending">
          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
            <h2 style="margin-bottom: 0.5rem;">What You'll Get</h2>
            <ul style="padding-left: 1.5rem; color: var(--color-text-muted); margin-bottom: 0;">
              <li style="margin-bottom: 0.5rem;">✓ Verified Veteran badge on your profile</li>
              <li style="margin-bottom: 0.5rem;">📊 Public profile at <code>vets.dev/${user.githubUsername}</code></li>
              <li style="margin-bottom: 0.5rem;">🏷️ Embeddable badge for your GitHub README</li>
              <li>🎖️ Recognition in the veteran developer community</li>
            </ul>
          </div>

          <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;">
            <h2 style="margin-bottom: 0.5rem;">Privacy & Security</h2>
            <p class="text-muted" style="margin-bottom: 0.5rem;">
              We use secure third-party verification providers to confirm your veteran status.
              No personally identifiable information (PII) from your military service is stored on our servers.
            </p>
            <p class="text-muted" style="margin-bottom: 0;">
              We only store: (1) that you are a verified veteran, and (2) the date of verification.
            </p>
          </div>

          <div style="margin-bottom: 2rem;">
            <h2 style="margin-bottom: 1rem;">Verification Method</h2>

            <div style="display: grid; gap: 1rem;">
              <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem;">
                <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 1rem;">
                  <div>
                    <h3 style="margin-bottom: 0.5rem;">ID.me Verification</h3>
                    <p class="text-muted" style="margin-bottom: 0; font-size: 0.875rem;">
                      Secure verification through ID.me, trusted by the VA and military services.
                      Supports all branches of the U.S. military.
                    </p>
                  </div>
                  <span class="badge" style="background: rgba(59, 130, 246, 0.1); color: rgb(59, 130, 246); border: 1px solid rgba(59, 130, 246, 0.2);">Coming Soon</span>
                </div>
                <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 0;">
                  ID.me integration is currently being set up. Check back soon for verification availability.
                </p>
              </div>
            </div>
          </div>
        </div>
        `
        }

        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
          <a href="/dashboard" class="btn btn-outline">Back to Dashboard</a>
        </div>
      </section>
    `,
  });
