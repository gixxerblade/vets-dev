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
  <style>
    :root {
      --color-bg: #0a0a0a;
      --color-surface: #141414;
      --color-border: #2a2a2a;
      --color-text: #e5e5e5;
      --color-text-muted: #737373;
      --color-primary: #3b82f6;
      --color-success: #22c55e;
      --color-warning: #eab308;
      --font-sans: system-ui, -apple-system, sans-serif;
      --font-mono: ui-monospace, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-sans);
      background: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      min-height: 100vh;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      text-decoration: none;
    }

    .logo span {
      color: var(--color-primary);
    }

    nav {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    nav a {
      color: var(--color-text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }

    nav a:hover {
      color: var(--color-text);
    }

    main {
      min-height: 60vh;
    }

    footer {
      border-top: 1px solid var(--color-border);
      padding-top: 1rem;
      margin-top: 2rem;
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }

    .btn-primary {
      background: var(--color-primary);
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--color-border);
      color: var(--color-text);
    }

    .btn-outline:hover {
      border-color: var(--color-text-muted);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge-success {
      background: rgba(34, 197, 94, 0.1);
      color: var(--color-success);
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1rem; }
    h2 { font-size: 1.75rem; font-weight: 600; margin-bottom: 0.75rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }

    p { margin-bottom: 1rem; }

    .text-muted { color: var(--color-text-muted); }
    .text-center { text-align: center; }

    code {
      font-family: var(--font-mono);
      background: var(--color-surface);
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.875em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="logo">vets<span>.dev</span></a>
      <nav>
        <a href="/">Home</a>
        <a href="/auth/github">Sign In</a>
      </nav>
    </header>
    <main>
      ${content}
    </main>
    <footer>
      <p>&copy; ${new Date().getFullYear()} vets.dev — Verified credentials for veteran developers</p>
    </footer>
  </div>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@starfederation/datastar"></script>
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
