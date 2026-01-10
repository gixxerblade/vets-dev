import { layout } from "./layout.js";

export const renderNotFound = (): string =>
  layout({
    title: "Not Found",
    content: `
      <section style="text-align: center; padding: 4rem 0;">
        <h1>404</h1>
        <p class="text-muted" style="font-size: 1.25rem; margin-bottom: 2rem;">
          Page not found
        </p>
        <a href="/" class="btn btn-outline">Go Home</a>
      </section>
    `,
  });

export const renderError = (message: string): string =>
  layout({
    title: "Error",
    content: `
      <section style="text-align: center; padding: 4rem 0;">
        <h1>Something went wrong</h1>
        <p class="text-muted" style="font-size: 1.25rem; margin-bottom: 2rem;">
          ${message}
        </p>
        <a href="/" class="btn btn-outline">Go Home</a>
      </section>
    `,
  });
