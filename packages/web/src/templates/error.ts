import { layout } from "./layout.js";

export const renderNotFound = (): string =>
  layout({
    title: "Not Found",
    content: `
      <section class="text-center py-16">
        <h1>404</h1>
        <p class="text-text-muted text-xl mb-8">
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
      <section class="text-center py-16">
        <h1>Something went wrong</h1>
        <p class="text-text-muted text-xl mb-8">
          ${message}
        </p>
        <a href="/" class="btn btn-outline">Go Home</a>
      </section>
    `,
  });
