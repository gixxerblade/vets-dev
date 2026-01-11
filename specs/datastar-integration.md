# Plan: Datastar Integration

## Task Description

Integrate Datastar into the vets-dev application to enable reactive, SSE-driven UI updates. The client library `@starfederation/datastar` is already installed but not used. This plan adds the server-side SDK, SSE endpoints, and updates templates with Datastar attributes for real-time reactivity.

## Objective

Enable Datastar-powered reactive UI that:

1. Works without JavaScript (progressive enhancement)
2. Provides real-time updates via SSE when JS is available
3. Uses typed Effect services for SSE stream management
4. Demonstrates the full Datastar loop on the dashboard and public profile pages

## Problem Statement

The current implementation uses pure server-rendered HTML with no client-side reactivity. While `@starfederation/datastar` is installed in the web package, it's not being used because:

- The Datastar client script is not loaded in the layout
- No `data-*` attributes exist on HTML elements
- No SSE endpoints exist on the server
- The server-side SDK (`@starfederation/datastar-sdk`) is not installed

## Solution Approach

1. **Add server-side SDK** - Install `@starfederation/datastar-sdk` for Bun/web runtime
2. **Load client script** - Add Datastar JS to the layout template
3. **Create SSE service** - Effect-based service for SSE stream management with Datastar SDK
4. **Add SSE endpoints** - `/api/sse/user` and `/api/sse/profile/:username`
5. **Update templates** - Add `data-on-load`, `data-text`, `data-signals` attributes
6. **Progressive enhancement** - Ensure all pages work without JS, enhance with SSE

## Relevant Files

### Existing Files to Modify

- `packages/web/src/templates/layout.ts` - Add Datastar client script and base signals
- `packages/web/src/templates/dashboard.ts` - Add reactive Datastar attributes
- `packages/web/src/templates/profile.ts` - Add SSE connection for live profile updates
- `packages/web/src/templates/verify.ts` - Add live verification status polling
- `packages/server/src/index.ts` - Add SSE route handlers
- `packages/server/src/services/index.ts` - Export new SSE service
- `packages/server/package.json` - Add `@starfederation/datastar-sdk` dependency

### New Files

- `packages/server/src/services/sse.ts` - Effect service for SSE stream management using Datastar SDK

## Implementation Phases

### Phase 1: Foundation

- Install `@starfederation/datastar-sdk` in server package
- Add Datastar client script to layout template
- Create basic SSE service structure

### Phase 2: Core Implementation

- Implement SSE endpoints for user and profile data
- Add Datastar attributes to dashboard template
- Wire up verification status live updates

### Phase 3: Integration & Polish

- Add SSE to public profile page
- Implement heartbeat/keepalive for streams
- Test progressive enhancement (JS disabled)

## Step by Step Tasks

### 1. Install Datastar SDK in Server Package

- Run `bun add @starfederation/datastar-sdk` in `packages/server/`
- Verify the package is available: `import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web"`

### 2. Add Datastar Client Script to Layout

Update `packages/web/src/templates/layout.ts`:

- Add Datastar script tag before closing `</body>` using the bundled file or CDN
- Option A (CDN): `<script type="module" src="https://cdn.jsdelivr.net/npm/@starfederation/datastar"></script>`
- Option B (local): Serve from `/static/datastar.js` after copying from node_modules
- Add a root `data-signals` attribute on the body or main container for global state

Example addition:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@starfederation/datastar"></script>
```

### 3. Create SSE Service

Create `packages/server/src/services/sse.ts`:

- Define `SSE` Effect service tag
- Implement `SSEService` interface with methods:
  - `streamUser(userId: string, request: Request): Effect<Response>`
  - `streamProfile(username: string, request: Request): Effect<Response>`
- Use `ServerSentEventGenerator` from `@starfederation/datastar-sdk/web`
- Implement SSE response helpers using Datastar SDK methods:
  - `patchSignals()` - Update client-side state
  - `patchElements()` - Update DOM fragments
- Add 30-second heartbeat for keepalive

Example service structure:

```typescript
import { Context, Effect, Layer } from "effect";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/web";

export interface SSEService {
  streamUser(userId: string, request: Request): Effect.Effect<Response, SSEError>;
  streamProfile(username: string, request: Request): Effect.Effect<Response, SSEError>;
}

export class SSE extends Context.Tag("SSE")<SSE, SSEService>() {}
```

### 4. Add SSE Endpoints to Server

Update `packages/server/src/index.ts`:

- Add route: `GET /api/sse/user` - Streams current user's data (requires auth)
- Add route: `GET /api/sse/profile/:username` - Streams public profile data
- Wire up to SSE service
- Return proper SSE headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`

Example route pattern:

```typescript
if (path === "/api/sse/user" && method === "GET") {
  return await runEffect(handleSSEUser(request));
}
```

### 5. Update Dashboard Template with Datastar Attributes

Update `packages/web/src/templates/dashboard.ts`:

- Add `data-signals` to define initial state from server render:

  ```html
  <div data-signals="{verified: false, repoCount: 0, starCount: 0}">
  ```

- Add `data-on-load` to connect to SSE:

  ```html
  <div data-on-load="@get('/api/sse/user')">
  ```

- Add `data-text` bindings for reactive values:

  ```html
  <span data-text="$repoCount">42</span>
  ```

- Add `data-show` for conditional rendering:

  ```html
  <div data-show="$verified">Verified!</div>
  ```

### 6. Update Verify Page for Live Status Updates

Update `packages/web/src/templates/verify.ts`:

- Add SSE connection for verification status polling
- Use `data-show` to toggle between pending/verified states
- When verification completes, SSE pushes update and UI reacts

### 7. Update Public Profile Template

Update `packages/web/src/templates/profile.ts`:

- Add SSE connection: `data-on-load="@get('/api/sse/profile/${username}')"`
- Bind profile stats to reactive signals
- Stats can update live if profile is refreshed in background

### 8. Export SSE Service from Index

Update `packages/server/src/services/index.ts`:

- Import and export SSE service
- Add SSELive to ServicesLive layer

### 9. Validate Implementation

- Test with JavaScript disabled: all pages render correctly
- Test with JavaScript enabled: SSE connects and updates flow
- Check Network tab: SSE stream shows `text/event-stream` content type
- Verify heartbeat: connection stays alive > 30 seconds

## Testing Strategy

### Unit Tests

- SSE service correctly formats Datastar events
- Signal patching produces valid SSE format

### Integration Tests

- `/api/sse/user` requires authentication (redirects if no session)
- `/api/sse/profile/:username` returns 404 for non-existent users
- SSE stream closes cleanly on client disconnect

### Manual Tests

1. Load dashboard, open Network tab, verify SSE connection
2. Disable JavaScript, reload - page still displays user data
3. On verify page, complete verification, see live status update
4. Open profile in one tab, trigger profile refresh, see stats update

## Acceptance Criteria

- [ ] Datastar client script loads on all pages
- [ ] `GET /api/sse/user` returns SSE stream with user data
- [ ] `GET /api/sse/profile/:username` returns SSE stream with profile data
- [ ] Dashboard displays reactive repo/star counts via `data-text`
- [ ] Verify page shows live verification status via `data-show`
- [ ] All pages work correctly with JavaScript disabled
- [ ] SSE streams include heartbeat every 30 seconds
- [ ] No TypeScript errors: `bun run tsc`
- [ ] Linting passes: `bun run lint`
- [ ] Build succeeds: `bun run build`

## Validation Commands

Execute these commands to validate the task is complete:

- `cd packages/server && bun add @starfederation/datastar-sdk` - Install SDK
- `bun run lint && bun run format && bun run tsc && bun run build` - All checks pass
- `bun run dev` - Server starts without errors
- `curl -N http://localhost:3000/api/sse/user -H "Cookie: session=..." | head -20` - SSE stream responds
- Open browser DevTools > Network, filter "eventsource", verify connection on dashboard

## Notes

### Datastar Attribute Reference

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-signals` | Define reactive state | `data-signals="{count: 0}"` |
| `data-on-load` | Trigger action on mount | `data-on-load="@get('/api/sse/user')"` |
| `data-text` | Bind text content | `data-text="$count"` |
| `data-show` | Conditional visibility | `data-show="$verified"` |
| `data-class` | Conditional classes | `data-class="{'active': $selected}"` |

### SSE Event Format (Datastar SDK)

The SDK handles formatting. Key methods:

- `sse.patchSignals({count: 42})` - Updates client signals
- `sse.patchElements([{selector: '#stats', html: '<div>...</div>'}])` - Updates DOM

### Progressive Enhancement Pattern

```html
<!-- Server renders actual value, Datastar updates it reactively -->
<span data-text="$repoCount">${user.profile?.githubReposCount ?? 0}</span>
```

The initial value comes from server render. When SSE connects, Datastar updates reactively. If JS is disabled, user sees server-rendered value.

### Future Considerations

- PostgreSQL LISTEN/NOTIFY for real-time database events
- Redis pub/sub for multi-instance deployments
- Rate limiting on SSE endpoints
