import { layout } from "./layout.js";

export const renderHomePage = (): string =>
  layout({
    title: "Home",
    description:
      "Verified credentials for U.S. military veterans who are software developers",
    content: `
      <section class="text-center py-16" aria-labelledby="hero-heading">
        <h1 id="hero-heading">Verified Veteran Developers</h1>
        <p class="text-text-muted text-xl max-w-xl mx-auto mb-8">
          Prove your GitHub identity and veteran status with a single, verifiable badge.
        </p>

        <div class="flex gap-4 justify-center mb-12">
          <a href="/auth/github" class="btn btn-primary" aria-label="Sign in with GitHub to get started">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </a>
        </div>

        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left max-w-2xl mx-auto list-none p-0">
          <li>
            <h3><span aria-hidden="true">🔐 </span>GitHub Identity</h3>
            <p class="text-muted">OAuth-verified connection to your GitHub account.</p>
          </li>
          <li>
            <h3><span aria-hidden="true">🎖️ </span>Veteran Status</h3>
            <p class="text-muted">Verified through GovX — no PII stored.</p>
          </li>
          <li>
            <h3><span aria-hidden="true">📊 </span>Developer Stats</h3>
            <p class="text-muted">Public repos, stars, and languages displayed.</p>
          </li>
          <li>
            <h3><span aria-hidden="true">🏷️ </span>Embeddable Badge</h3>
            <p class="text-muted">Add to your GitHub README or portfolio.</p>
          </li>
        </ul>
      </section>

      <section class="card mt-8" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading">How It Works</h2>
        <ol class="pl-6 text-text-muted">
          <li class="mb-3">Sign in with your GitHub account</li>
          <li class="mb-3">Verify your veteran status through GovX</li>
          <li class="mb-3">Get your verified profile at <code>vets.dev/username</code></li>
          <li>Embed your badge anywhere: <code>![Verified Veteran](https://vets.dev/badge/username.svg)</code></li>
        </ol>
      </section>
    `,
  });
