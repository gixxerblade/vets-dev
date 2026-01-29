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
      <section class="py-8" data-on-load="@get('/api/sse/user')" data-signals="{
  verified: ${user.verifiedVeteran},
  pending: ${user.pendingVerification ?? false}
}">
        <div class="flex items-center gap-6 mb-8">
          ${
            user.avatarUrl
              ? `<img src="${user.avatarUrl}" alt="${user.githubUsername}" class="w-20 h-20 rounded-full border-2 border-border">`
              : ""
          }
          <div>
            <h1 class="mb-1">Verify Your Veteran Status</h1>
            <p class="text-text-muted">@${user.githubUsername}</p>
          </div>
        </div>

        ${
          user.verifiedVeteran
            ? `
        <div class="alert alert-success" data-show="$verified">
          <h2 class="text-success mb-2">✓ Already Verified</h2>
          <p class="text-text-muted mb-4">
            You completed verification on ${user.verifiedAt ? new Date(user.verifiedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "an earlier date"}.
            Your verified badge is now active on your profile.
          </p>
          <a href="/dashboard" class="btn btn-primary">Return to Dashboard</a>
        </div>
        `
            : user.pendingVerification
              ? `
        <div class="alert alert-warning" data-show="$pending && !$verified">
          <h2 class="text-warning mb-2">⏳ Verification Pending</h2>
          <p class="text-text-muted mb-4">
            Your verification request is being processed. This usually takes a few minutes.
            Check back soon or refresh this page.
          </p>
          <a href="/dashboard" class="btn btn-outline">Return to Dashboard</a>
        </div>
        `
              : `
        <div data-show="!$verified && !$pending">
          <div class="card-bordered mb-8">
            <h2 class="mb-2">What You'll Get</h2>
            <ul class="pl-6 text-text-muted">
              <li class="mb-2">✓ Verified Veteran badge on your profile</li>
              <li class="mb-2">📊 Public profile at <code>vets.dev/${user.githubUsername}</code></li>
              <li class="mb-2">🏷️ Embeddable badge for your GitHub README</li>
              <li>🎖️ Recognition in the veteran developer community</li>
            </ul>
          </div>

          <div class="card-bordered mb-8">
            <h2 class="mb-2">Privacy & Security</h2>
            <p class="text-text-muted mb-2">
              We use secure third-party verification providers to confirm your veteran status.
              No personally identifiable information (PII) from your military service is stored on our servers.
            </p>
            <p class="text-text-muted mb-0">
              We only store: (1) that you are a verified veteran, and (2) the date of verification.
            </p>
          </div>

          <div class="mb-8">
            <h2 class="mb-4">Verification Method</h2>

            <div class="grid gap-4">
              <div class="card-bordered">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="mb-2">GovX Verification</h3>
                    <p class="text-text-muted text-sm mb-0">
                      Secure verification through GovX, trusted by the VA and military services.
                      Supports all branches of the U.S. military.
                    </p>
                  </div>
                  <span class="badge badge-info">Coming Soon</span>
                </div>
                <p class="text-text-muted text-sm mb-0">
                  GovX integration is currently being set up. Check back soon for verification availability.
                </p>
              </div>
            </div>
          </div>
        </div>
        `
        }

        <div class="mt-8 pt-4 border-t border-border">
          <a href="/dashboard" class="btn btn-outline">Back to Dashboard</a>
        </div>
      </section>
    `,
  });
