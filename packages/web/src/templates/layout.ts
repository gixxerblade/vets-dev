import { skipLink } from "./components/skip-link.js";

export interface LayoutOptions {
  title: string;
  description?: string;
  content: string;
}

export const layout = ({
  title,
  description,
  content,
}: LayoutOptions): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | vets.dev</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ""}
  <link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
  ${skipLink()}
  <div class="max-w-container mx-auto p-8">
    <header role="banner" class="border-b border-border pb-4 mb-8">
      <a href="/" class="text-2xl font-bold text-text no-underline" aria-label="vets.dev home">vets<span class="text-primary" aria-hidden="true">.dev</span></a>
      <nav role="navigation" aria-label="Main navigation" class="flex gap-6 mt-4">
        <a href="/" class="text-text-muted no-underline hover:text-text transition-colors">Home</a>
        <a href="/auth/github" class="text-text-muted no-underline hover:text-text transition-colors">Sign In</a>
      </nav>
    </header>
    <main id="main-content" role="main" class="min-h-[60vh]" tabindex="-1">
      ${content}
    </main>
    <footer role="contentinfo" class="border-t border-border pt-4 mt-8 text-text-muted text-sm">
      <p>&copy; ${new Date().getFullYear()} vets.dev — Verified credentials for veteran developers</p>
    </footer>
  </div>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@starfederation/datastar/dist/datastar.js"></script>
</body>
</html>`;

// HTML escape helper
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
