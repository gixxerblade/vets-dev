import { layout } from "./layout.js";

export const renderNotFound = (): string =>
  layout({
    title: "404 Not Found",
    content: `
      <section class="text-center py-16" aria-labelledby="error-heading">
        <div role="alert" tabindex="-1" id="error-region">
          <h1 id="error-heading">404</h1>
          <p class="text-text-muted text-xl mb-8">
            Page not found
          </p>
        </div>
        <a href="/" class="btn btn-outline">Go to home page</a>
      </section>
    `,
  });

export const renderError = (message: string): string =>
  layout({
    title: "Error",
    content: `
      <section class="text-center py-16" aria-labelledby="error-heading">
        <div role="alert" tabindex="-1" id="error-region">
          <h1 id="error-heading">Something went wrong</h1>
          <p class="text-text-muted text-xl mb-8">
            ${message}
          </p>
        </div>
        <a href="/" class="btn btn-outline">Go to home page</a>
      </section>
    `,
  });
