# Plan: Migrate from Native CSS to Tailwind CSS

## Task Description

Migrate the `packages/web` package from using embedded native CSS (in `layout.ts`) and inline styles to using Tailwind CSS utility classes. This involves setting up Tailwind CSS with a custom theme matching the existing design system, adding a CSS build pipeline, implementing static file serving, and converting all templates to use Tailwind utility classes.

## Objective

Replace all embedded CSS and inline styles with Tailwind CSS utility classes while maintaining the exact same visual appearance. Establish a scalable CSS architecture with proper build tooling for future development.

## Problem Statement

The current styling approach has several limitations:
- **No browser caching**: Inline CSS in every HTML response increases payload size
- **Maintenance burden**: ~140 lines of embedded CSS + 50+ inline style attributes scattered across 6 template files
- **Inconsistency**: Hardcoded rgba() values duplicate CSS variable colors (e.g., warning color appears as both `--color-warning` and `rgba(234, 179, 8, 0.1)`)
- **No CSS tooling**: No minification, autoprefixer, or modern CSS features
- **Scalability concerns**: Adding new pages requires duplicating style patterns

## Solution Approach

1. Install Tailwind CSS with PostCSS for the web package
2. Configure Tailwind with a custom theme matching the existing design tokens
3. Add a CSS build step that generates optimized CSS
4. Add static file serving to the server for the generated CSS
5. Systematically convert each template from inline styles to Tailwind utility classes
6. Remove the embedded `<style>` block from layout.ts

## Relevant Files

Files to modify during migration:

- **`packages/web/package.json`** - Add Tailwind and PostCSS dependencies, add build script
- **`packages/web/src/templates/layout.ts`** - Remove embedded CSS, add `<link>` to external stylesheet
- **`packages/web/src/templates/home.ts`** - Convert 10 inline style attributes to Tailwind classes
- **`packages/web/src/templates/dashboard.ts`** - Convert 20 inline style attributes to Tailwind classes
- **`packages/web/src/templates/profile.ts`** - Convert 15 inline style attributes to Tailwind classes
- **`packages/web/src/templates/verify.ts`** - Convert 23 inline style attributes to Tailwind classes
- **`packages/web/src/templates/error.ts`** - Convert 4 inline style attributes to Tailwind classes
- **`packages/server/src/index.ts`** - Add static file serving route for `/static/*`
- **`package.json`** (root) - Update build script to include CSS build

### New Files

- **`packages/web/tailwind.config.ts`** - Tailwind configuration with custom theme
- **`packages/web/postcss.config.js`** - PostCSS configuration
- **`packages/web/src/styles/main.css`** - Tailwind CSS entry file with directives
- **`packages/web/static/css/main.css`** - Generated output CSS (created by build)

## Implementation Phases

### Phase 1: Foundation

Set up Tailwind CSS tooling and configuration without changing any templates:
- Install dependencies
- Create Tailwind config with custom theme matching existing design tokens
- Create CSS entry file with Tailwind directives
- Add build script
- Verify CSS generation works

### Phase 2: Core Implementation

Add static file serving and convert the layout template:
- Add static file route handler to server
- Update layout.ts to link external CSS instead of embedded styles
- Verify the application still renders correctly with external CSS

### Phase 3: Template Migration

Convert all templates from inline styles to Tailwind classes:
- Convert each template file systematically
- Maintain visual parity with current design
- Remove all inline `style=""` attributes

### Phase 4: Integration & Polish

Final cleanup and optimization:
- Remove embedded CSS from layout.ts
- Test all pages visually
- Run all quality checks
- Optimize production CSS output

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Install Tailwind CSS Dependencies

In `packages/web/`, install required packages:

- Run: `cd packages/web && bun add -D tailwindcss postcss autoprefixer`
- This adds Tailwind CSS, PostCSS, and Autoprefixer as dev dependencies

### 2. Create Tailwind Configuration

Create `packages/web/tailwind.config.ts` with custom theme:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.ts"],
  theme: {
    extend: {
      colors: {
        // Map existing CSS custom properties to Tailwind
        bg: "#0a0a0a",
        surface: "#141414",
        border: "#2a2a2a",
        text: "#e5e5e5",
        "text-muted": "#737373",
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
        success: {
          DEFAULT: "#22c55e",
          bg: "rgba(34, 197, 94, 0.1)",
          border: "rgba(34, 197, 94, 0.2)",
        },
        warning: {
          DEFAULT: "#eab308",
          bg: "rgba(234, 179, 8, 0.1)",
          border: "rgba(234, 179, 8, 0.2)",
        },
        info: {
          DEFAULT: "rgb(59, 130, 246)",
          bg: "rgba(59, 130, 246, 0.1)",
          border: "rgba(59, 130, 246, 0.2)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      maxWidth: {
        container: "800px",
      },
    },
  },
  plugins: [],
};

export default config;
```

### 3. Create PostCSS Configuration

Create `packages/web/postcss.config.js`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 4. Create CSS Entry File

Create `packages/web/src/styles/main.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Base layer customizations */
@layer base {
  * {
    @apply box-border;
  }

  body {
    @apply font-sans bg-bg text-text leading-relaxed min-h-screen;
  }

  h1 {
    @apply text-4xl font-bold mb-4;
  }

  h2 {
    @apply text-2xl font-semibold mb-3;
  }

  h3 {
    @apply text-xl font-semibold mb-2;
  }

  p {
    @apply mb-4;
  }

  code {
    @apply font-mono bg-surface px-1.5 py-0.5 rounded text-sm;
  }
}

/* Component layer for reusable patterns */
@layer components {
  .btn {
    @apply inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium no-underline transition-all cursor-pointer border-none text-base;
  }

  .btn-primary {
    @apply bg-primary text-white hover:bg-primary-hover;
  }

  .btn-outline {
    @apply bg-transparent border border-border text-text hover:border-text-muted;
  }

  .badge {
    @apply inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium;
  }

  .badge-success {
    @apply bg-success-bg text-success border border-success-border;
  }

  .badge-warning {
    @apply bg-warning-bg text-warning border border-warning-border;
  }

  .badge-info {
    @apply bg-info-bg text-info border border-info-border;
  }

  .card {
    @apply bg-surface rounded-lg p-6;
  }

  .card-bordered {
    @apply card border border-border;
  }

  .stat-card {
    @apply bg-surface rounded-lg p-4 text-center;
  }

  .alert {
    @apply rounded-lg p-6 mb-8;
  }

  .alert-success {
    @apply bg-success-bg border border-success-border;
  }

  .alert-warning {
    @apply bg-warning-bg border border-warning-border;
  }
}
```

### 5. Create Static Directory Structure

Create the output directory for generated CSS:

- Run: `mkdir -p packages/web/static/css`
- Add `packages/web/static/css/.gitkeep` to track the directory

### 6. Update Web Package Build Script

Update `packages/web/package.json` to add CSS build:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build:css": "tailwindcss -i ./src/styles/main.css -o ./static/css/main.css --minify",
    "build:css:watch": "tailwindcss -i ./src/styles/main.css -o ./static/css/main.css --watch",
    "build": "bun run build:css"
  }
}
```

### 7. Update Root Package Build Script

Update root `package.json` to ensure CSS builds before server:

- The existing `"build": "bun run --filter '*' build"` will now include the web package CSS build

### 8. Add Static File Serving to Server

Modify `packages/server/src/index.ts` to serve static files:

- Add MIME type helper function after imports (around line 32):

```typescript
function getContentType(ext: string | undefined): string {
  const types: Record<string, string> = {
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
  };
  return types[ext ?? ""] ?? "application/octet-stream";
}
```

- Add static file route before the 404 handler (around line 380):

```typescript
// Static files: /static/*
const staticMatch = path.match(/^\/static\/(.+)$/);
if (staticMatch?.[1] && method === "GET") {
  const filePath = staticMatch[1].replace(/\.\./g, ""); // Prevent directory traversal
  const staticDir = import.meta.dir + "/../web/static/";
  const file = Bun.file(staticDir + filePath);

  if (await file.exists()) {
    const ext = filePath.split(".").pop()?.toLowerCase();
    return new Response(file, {
      headers: {
        "Content-Type": getContentType(ext),
        "Cache-Control": config.isDev ? "no-cache" : "public, max-age=31536000",
      },
    });
  }
}
```

### 9. Update Layout Template

Modify `packages/web/src/templates/layout.ts`:

- Replace the entire `<style>...</style>` block (lines 18-158) with:

```html
<link rel="stylesheet" href="/static/css/main.css">
```

- Update the body structure to use Tailwind classes:

```typescript
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
  <div class="max-w-container mx-auto p-8">
    <header class="border-b border-border pb-4 mb-8">
      <a href="/" class="text-2xl font-bold text-text no-underline">vets<span class="text-primary">.dev</span></a>
      <nav class="flex gap-6 mt-4">
        <a href="/" class="text-text-muted no-underline hover:text-text transition-colors">Home</a>
        <a href="/auth/github" class="text-text-muted no-underline hover:text-text transition-colors">Sign In</a>
      </nav>
    </header>
    <main class="min-h-[60vh]">
      ${content}
    </main>
    <footer class="border-t border-border pt-4 mt-8 text-text-muted text-sm">
      <p>&copy; ${new Date().getFullYear()} vets.dev — Verified credentials for veteran developers</p>
    </footer>
  </div>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@starfederation/datastar"></script>
</body>
</html>`;
```

### 10. Convert Home Template

Update `packages/web/src/templates/home.ts` to use Tailwind classes:

**Current inline styles to convert:**

| Line | Current Style | Tailwind Classes |
|------|--------------|------------------|
| 9 | `text-align: center; padding: 4rem 0;` | `text-center py-16` |
| 11 | `font-size: 1.25rem; max-width: 600px; margin: 0 auto 2rem;` | `text-xl max-w-xl mx-auto mb-8` |
| 15 | `display: flex; gap: 1rem; justify-content: center; margin-bottom: 3rem;` | `flex gap-4 justify-center mb-12` |
| 24 | `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: left; max-width: 700px; margin: 0 auto;` | `grid grid-cols-1 sm:grid-cols-2 gap-8 text-left max-w-2xl mx-auto` |
| 44 | `background: var(--color-surface); border-radius: 0.5rem; padding: 2rem; margin-top: 2rem;` | `card mt-8` |
| 46 | `padding-left: 1.5rem; color: var(--color-text-muted);` | `pl-6 text-text-muted` |
| 47-49 | `margin-bottom: 0.75rem;` | `mb-3` |

### 11. Convert Error Template

Update `packages/web/src/templates/error.ts` to use Tailwind classes:

| Line | Current Style | Tailwind Classes |
|------|--------------|------------------|
| 7, 21 | `text-align: center; padding: 4rem 0;` | `text-center py-16` |
| 9, 23 | `font-size: 1.25rem; margin-bottom: 2rem;` | `text-xl mb-8` |

### 12. Convert Dashboard Template

Update `packages/web/src/templates/dashboard.ts` to use Tailwind classes:

Key conversions:
- Section: `py-8` with Datastar attributes preserved
- User header flex: `flex items-center gap-6 mb-8`
- Avatar: `w-20 h-20 rounded-full border-2 border-border`
- Verified badge: `badge badge-success`
- Unverified badge: `badge badge-warning`
- Unverified alert box: `card-bordered mb-8`
- Stat grid: `grid grid-cols-3 gap-4 mb-8` (responsive: `sm:grid-cols-3`)
- Stat cards: `stat-card`
- Stat number: `text-4xl font-bold`
- Languages container: `mb-8`
- Language tags: `bg-surface px-3 py-1 rounded-full text-sm`
- Badge embed section: `card`
- Code block: `block p-4 bg-bg rounded break-all`
- Footer: `mt-8 pt-4 border-t border-border`

### 13. Convert Profile Template

Update `packages/web/src/templates/profile.ts` to use Tailwind classes:

Similar patterns to dashboard:
- Section: `py-8`
- User header: `flex items-center gap-6 mb-8`
- Avatar: `w-24 h-24 rounded-full border-2 border-border`
- Badge: `badge badge-success`
- Bio: `text-text-muted mt-2`
- Stat grid: `grid grid-cols-2 gap-4 mb-8`
- Stat cards: `stat-card`
- Languages: `mb-8`
- Language tags: `bg-surface px-3 py-1 rounded-full text-sm`
- Button group: `flex gap-4 flex-wrap`
- Verified since footer: `mt-8 pt-4 border-t border-border text-text-muted text-sm`

### 14. Convert Verify Template

Update `packages/web/src/templates/verify.ts` to use Tailwind classes:

- Section: `py-8`
- User header: `flex items-center gap-6 mb-8`
- Avatar: `w-20 h-20 rounded-full border-2 border-border`
- Already verified alert: `alert alert-success`
- Pending alert: `alert alert-warning`
- Info boxes: `card-bordered mb-8`
- Lists: `pl-6 text-text-muted`
- List items: `mb-2`
- Verification method grid: `grid gap-4`
- Method card: `card-bordered`
- Coming soon badge: `badge badge-info`
- Footer: `mt-8 pt-4 border-t border-border`

### 15. Run Build and Verify

Build CSS and verify all pages render correctly:

- Run: `bun run build` (builds CSS and server)
- Run: `bun run dev` and manually verify each page:
  - Home page (`/`)
  - Dashboard (`/dashboard`)
  - Profile page (`/:username`)
  - Verify page (`/verify`)
  - 404 page

### 16. Run Quality Checks

Execute all quality checks:

- Run: `bun run lint && bun run format && bun run tsc && bun run test && bun run build`

## Testing Strategy

### Visual Regression Testing

For each page, verify:
1. Colors match exactly (dark background, muted text, primary blue, success green, warning yellow)
2. Typography scale matches (h1 largest, proper font weights)
3. Spacing is consistent (padding, margins, gaps)
4. Button styles work correctly (primary filled blue, outline with border)
5. Badge styles render correctly (success green, warning yellow, info blue)
6. Responsive behavior works (grid columns adjust)
7. Hover states function (buttons, nav links)

### Functional Testing

1. Verify Datastar attributes still work (`data-show`, `data-text`, `data-on-load`)
2. Test all interactive elements (buttons, links, forms)
3. Verify external CSS loads correctly (check Network tab)
4. Test cache headers on static CSS file

### Build Testing

1. Verify `bun run build:css` generates minified CSS
2. Verify `bun run build:css:watch` works for development
3. Verify full build pipeline passes

## Acceptance Criteria

- [ ] All pages render with identical visual appearance to current design
- [ ] No inline `style=""` attributes remain in template files
- [ ] No embedded `<style>` block in layout.ts
- [ ] CSS file is served from `/static/css/main.css`
- [ ] CSS file is cached in production (Cache-Control header set)
- [ ] All Tailwind classes match the existing spacing/color system
- [ ] Datastar reactive attributes continue to function
- [ ] All quality checks pass: `bun run lint && bun run format && bun run tsc && bun run test && bun run build`
- [ ] No TypeScript errors
- [ ] CSS build generates minified output

## Validation Commands

Execute these commands to validate the task is complete:

- `bun run build:css` - Verify CSS builds without errors
- `bun run build` - Verify full build completes
- `bun run tsc` - Verify no TypeScript errors
- `bun run lint` - Verify no linting errors
- `bun run test` - Verify all tests pass
- `curl -I http://localhost:3000/static/css/main.css` - Verify CSS file is served with correct headers
- `bun run dev` and visually inspect all pages

## Notes

### Tailwind Class Reference

Common mappings from current CSS to Tailwind:

| Current CSS | Tailwind Class |
|-------------|----------------|
| `padding: 2rem` | `p-8` |
| `padding: 1.5rem` | `p-6` |
| `padding: 1rem` | `p-4` |
| `gap: 1.5rem` | `gap-6` |
| `gap: 1rem` | `gap-4` |
| `gap: 0.5rem` | `gap-2` |
| `margin-bottom: 2rem` | `mb-8` |
| `margin-bottom: 1rem` | `mb-4` |
| `border-radius: 0.5rem` | `rounded-lg` |
| `border-radius: 9999px` | `rounded-full` |
| `font-size: 2rem` | `text-4xl` |
| `font-size: 1.25rem` | `text-xl` |
| `font-size: 0.875rem` | `text-sm` |
| `font-size: 0.75rem` | `text-xs` |
| `font-weight: 700` | `font-bold` |
| `font-weight: 600` | `font-semibold` |
| `font-weight: 500` | `font-medium` |

### Dependencies to Add

```bash
cd packages/web
bun add -D tailwindcss postcss autoprefixer
```

### Tailwind Spacing Scale Reference

The existing codebase uses these spacing values which map to Tailwind:

| rem Value | Tailwind Unit |
|-----------|---------------|
| 0.25rem | 1 |
| 0.5rem | 2 |
| 0.75rem | 3 |
| 1rem | 4 |
| 1.5rem | 6 |
| 2rem | 8 |
| 3rem | 12 |
| 4rem | 16 |

### File Path for Static Assets

The server will serve static files from a path relative to the server's location. The path calculation:
- Server file: `packages/server/src/index.ts`
- Static dir: `packages/web/static/`
- Relative path: `/../web/static/`

This works because Bun's `import.meta.dir` gives the directory of the current file.
