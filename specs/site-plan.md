# Site Plan — vets.dev

## Objective

Build **vets.dev**, a production-grade identity and verification platform for U.S. military veterans who are software developers.

The MVP provides **public, verifiable credentials** at: <https://vets.dev/>

Each profile proves:

- GitHub identity (OAuth-verified)
- Veteran status (third-party verified)
- Developer activity (GitHub stats)

This is **not** a social network. It is an **identity & trust layer**.

---

## Architecture

### Stack

| Layer          | Technology                               |
|----------------|------------------------------------------|
| Runtime        | Bun                                      |
| Language       | TypeScript (strict mode)                 |
| Framework      | Effect (typed pipelines, error handling) |
| UI             | Datastar (SSE-driven HTML)               |
| Database       | PostgreSQL 16+                           |
| ORM/Migrations | Drizzle ORM                              |
| Session        | PostgreSQL-backed sessions               |
| Verification   | GovX                                     |

### Monorepo Structure

```sh
vets-dev/
├── packages/
│   ├── server/          # HTTP server, API, auth
│   ├── web/             # Templates, static assets
│   └── shared/          # Types, Effect utilities, constants
├── migrations/          # Drizzle migrations
├── scripts/             # Dev scripts, seed data
├── docker/              # Docker Compose for local dev
└── specs/               # This plan and future specs
```

### Principles

- Server is the source of truth
- Browser is a thin renderer (works without JS)
- All workflows modeled as typed Effect pipelines
- All state transitions are auditable and deterministic
- Zero PII storage (delegate to verification providers)

---

## Phase 1 — Foundation

### Task 1.1 — Repository & Environment

**Goal:** Bootable monorepo with all dependencies configured

**Deliverables:**

1. Initialize Bun workspace with `packages/server`, `packages/web`, `packages/shared`
2. Configure TypeScript with strict mode across all packages
3. Install dependencies:
   - `effect`, `@effect/schema`, `@effect/platform`
   - `drizzle-orm`, `drizzle-kit`
   - `postgres` (node-postgres driver)
   - `@starfederation/datastar`
4. Create `docker-compose.yml` with PostgreSQL 16
5. Create `.env.example` with required variables:

   ```sh
   DATABASE_URL=postgres://...
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   GOVX_CLIENT_ID=
   GOVX_CLIENT_SECRET=
   GOVX_REDIRECT_URI=
   SESSION_SECRET=
   ```

6. Add `bun run dev` script that starts server with hot reload

**Validation:**

```sh
docker compose up -d        # PostgreSQL starts
bun install                 # Dependencies install
bun run dev                 # Server boots on http://localhost:3000
curl http://localhost:3000  # Returns HTML
```

---

### Task 1.2 — Database Schema

**Goal:** Complete schema with proper constraints and indexes

**Schema:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT UNIQUE NOT NULL,
  github_username VARCHAR(39) NOT NULL,
  avatar_url TEXT,
  verified_veteran BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_github_username ON users(github_username);
CREATE INDEX idx_users_verified ON users(verified_veteran) WHERE verified_veteran = TRUE;

-- Profiles table (1:1 with users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  website VARCHAR(255),
  github_repos_count INT DEFAULT 0,
  github_stars_count INT DEFAULT 0,
  github_languages JSONB DEFAULT '[]',
  github_last_activity TIMESTAMPTZ,
  profile_cached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (PostgreSQL-backed sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Verification events (immutable audit log)
CREATE TABLE verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,          -- 'govx', 'sheerid', etc.
  provider_ref VARCHAR(255),              -- External reference ID
  status VARCHAR(20) NOT NULL,            -- 'pending', 'success', 'failed'
  idempotency_key VARCHAR(64) UNIQUE,     -- Prevent duplicate callbacks
  metadata JSONB DEFAULT '{}',            -- Non-PII metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_user ON verification_events(user_id);
CREATE INDEX idx_verification_idempotency ON verification_events(idempotency_key);

-- Audit log (immutable)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,           -- 'login', 'logout', 'verify_start', etc.
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

**Drizzle Schema Location:** `packages/shared/src/db/schema.ts`

**Validation:**

```sh
bun run db:generate         # Generates migration
bun run db:migrate          # Applies migration
bun run db:rollback         # Rollback works
psql $DATABASE_URL -c "\dt" # Tables exist
```

---

## Phase 2 — Identity

### Task 2.1 — GitHub OAuth

**Goal:** Users can authenticate via GitHub

**Endpoints:**

| Route                   | Method | Description              |
|-------------------------|--------|--------------------------|
| `/auth/github`          | GET    | Redirect to GitHub OAuth |
| `/auth/github/callback` | GET    | Handle OAuth callback    |
| `/logout`               | POST   | Destroy session          |

**OAuth Flow:**

1. User visits `/auth/github`
2. Generate cryptographic `state` parameter, store in cookie
3. Redirect to GitHub with `client_id`, `redirect_uri`, `state`, `scope=read:user`
4. GitHub redirects to `/auth/github/callback?code=...&state=...`
5. Validate `state` matches cookie (CSRF protection)
6. Exchange `code` for access token
7. Fetch GitHub user profile (`GET /user`)
8. Upsert user record in database
9. Create session, set secure cookie
10. Redirect to `/dashboard` or `/verify`

**Security Requirements:**

- `state` parameter: 32 bytes, cryptographically random
- Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`
- Token stored only in memory during exchange (never persisted)

**Effect Service:** `packages/server/src/services/GitHubAuth.ts`

**Validation:**

```sh
# Manual test flow
open http://localhost:3000/auth/github
# Complete OAuth
# Check: Session cookie set
# Check: User row created in database
# Check: Audit log entry for 'login'
```

---

### Task 2.2 — Profile Materializer

**Goal:** Fetch and cache GitHub developer stats

**Data to Fetch:**

- Public repository count
- Total stars received
- Top 5 languages used
- Last public activity timestamp

**Implementation:**

1. Create Effect service `GitHubProfile`
2. On login (and daily cron), fetch:
   - `GET /users/:username/repos?per_page=100`
   - Aggregate stats
3. Store in `profiles` table
4. Set `profile_cached_at` timestamp
5. Cache expires after 24 hours

**Rate Limiting:**

- GitHub API: 60 req/hr unauthenticated, 5000/hr with token
- Use user's OAuth token when available
- Queue refresh jobs to avoid bursts

**Effect Service:** `packages/server/src/services/GitHubProfile.ts`

**Validation:**

```sh
# After login, visit profile page
open http://localhost:3000/dashboard
# Check: Repo count displayed
# Check: Languages displayed
# Check: profiles.profile_cached_at is set
```

---

## Phase 3 — Veteran Verification

### Task 3.1 — GovX Integration

**Goal:** Verify veteran status via GovX

**Why GovX:**

- Trusted military verification provider
- OAuth-based integration
- No PII returned to our app (only verification status)
- Supports all branches of the U.S. military

**Endpoints:**

| Route                   | Method | Description               |
|-------------------------|--------|---------------------------|
| `/verify`               | GET    | Show verification options |
| `/verify/govx`          | GET    | Initiate GovX OAuth       |
| `/verify/govx/callback` | GET    | Handle GovX callback      |

**OAuth Flow:**

1. User visits `/verify/govx`
2. Generate OAuth request with:
   - Unique state parameter (for CSRF protection)
   - Client ID and redirect URI
3. Redirect to GovX authorization URL
4. User authenticates with GovX
5. GovX redirects to `/verify/govx/callback` with authorization code
6. Exchange code for access token
7. Fetch verification status from GovX API
8. Create `verification_event` record
9. Update user: `verified_veteran = true`, `verified_at = now()`
10. Redirect to profile with success message

**Security Requirements:**

- State parameter validation (CSRF protection)
- Request ID stored in session, expires in 5 minutes
- Idempotency key prevents duplicate processing

**Effect Service:** `packages/server/src/services/GovXVerification.ts`

**Validation:**

```sh
# With GovX sandbox credentials
open http://localhost:3000/verify/govx
# Complete GovX flow
# Check: verified_veteran = true
# Check: verification_events row created
# Check: Audit log entry for 'verify_success'
```

---

### Task 3.2 — Effect State Machine

**Goal:** Model user states with typed transitions

**States:**

```typescript
type UserState =
  | { _tag: "Unauthenticated" }
  | { _tag: "Authenticated"; userId: string; verified: false }
  | { _tag: "VerificationPending"; userId: string; requestId: string }
  | { _tag: "Verified"; userId: string; verifiedAt: Date }
```

**Transitions:**

```sh
Unauthenticated ──[github_login]──> Authenticated
Authenticated ──[start_verify]──> VerificationPending
VerificationPending ──[verify_success]──> Verified
VerificationPending ──[verify_fail]──> Authenticated
Authenticated ──[logout]──> Unauthenticated
Verified ──[logout]──> Unauthenticated
```

**Requirements:**

- All transitions logged to `audit_log`
- Invalid transitions return typed errors
- State reconstructable from audit log

**Effect Service:** `packages/shared/src/state/UserStateMachine.ts`

**Validation:**

```typescript
// Unit tests
test("cannot skip verification", () => {
  const state = { _tag: "Unauthenticated" };
  const result = transition(state, "verify_success");
  expect(result).toBeError("InvalidTransition");
});
```

---

## Phase 4 — Datastar UI

### Task 4.1 — Pages

**Goal:** Server-rendered pages with SSE updates

**Routes:**

| Route        | Description                       |
|--------------|-----------------------------------|
| `/`          | Landing page (public)             |
| `/:username` | Public profile page               |
| `/verify`    | Verification flow (authenticated) |
| `/dashboard` | User dashboard (authenticated)    |

**Template Location:** `packages/web/templates/`

**Requirements:**

- All pages work with JavaScript disabled
- Authenticated pages redirect to `/auth/github` if no session
- Public profile shows verification badge if verified
- Dashboard shows verification CTA if not verified

**Datastar Integration:**

```html
<!-- Example: Live verification status -->
<div data-on-load="@get('/api/sse/user')">
  <span data-text="$verified ? '✓ Verified' : 'Not Verified'"></span>
</div>
```

**Validation:**

```sh
# Test with JS disabled
curl http://localhost:3000/          # Returns complete HTML
curl http://localhost:3000/testuser  # Returns profile HTML
```

---

### Task 4.2 — SSE Event Model

**Goal:** Real-time UI updates via Server-Sent Events

**SSE Endpoints:**

| Endpoint                     | Events                          |
|------------------------------|---------------------------------|
| `/api/sse/user`              | `user:updated`, `user:verified` |
| `/api/sse/profile/:username` | `profile:updated`               |

**Event Payloads:**

```typescript
interface UserUpdatedEvent {
  type: "user:updated";
  data: {
    verified: boolean;
    verifiedAt: string | null;
  };
}

interface ProfileUpdatedEvent {
  type: "profile:updated";
  data: {
    repoCount: number;
    starCount: number;
    languages: string[];
  };
}
```

**Implementation:**

- Use Effect `Stream` for SSE
- Heartbeat every 30 seconds
- Client reconnects automatically (EventSource)
- Events triggered by database changes (LISTEN/NOTIFY)

**Effect Service:** `packages/server/src/services/SSEBroadcast.ts`

**Validation:**

```sh
# In browser console
const es = new EventSource('/api/sse/user');
es.onmessage = (e) => console.log(e.data);
# Trigger verification, observe event
```

---

## Phase 5 — Badge

### Task 5.1 — SVG Badge

**Goal:** Embeddable verification badge

**Endpoint:** `GET /badge/:username.svg`

**Badge Content:**

```sh
┌─────────────────────────────────────┐
│ ✓ Verified Veteran Developer        │
│ vets.dev/username                   │
│ Verified: Jan 2025                  │
└─────────────────────────────────────┘
```

**Requirements:**

- Returns 404 if user not verified
- SVG is self-contained (no external resources)
- Cache-Control: public, max-age=3600
- ETag for conditional requests
- Includes cryptographic signature for verification

**Signature Scheme:**

```typescript
const payload = `${username}:${verifiedAt.toISOString()}`;
const signature = hmac("sha256", BADGE_SECRET, payload).slice(0, 8);
// Embedded in SVG as data attribute
```

**Verification:** Anyone can verify badge authenticity at `/verify-badge?sig=...`

**Effect Service:** `packages/server/src/services/BadgeGenerator.ts`

**Validation:**

```markdown
<!-- In GitHub README -->
![Verified Veteran](https://vets.dev/badge/username.svg)
```

---

## Phase 6 — Hardening

### Task 6.1 — Security

**Goal:** Production-ready security posture

**Implementations:**

| Feature              | Implementation                                |
|----------------------|-----------------------------------------------|
| Rate Limiting        | 100 req/min per IP on auth endpoints          |
| CSRF                 | Double-submit cookie pattern                  |
| Session Hardening    | Rotate session ID on privilege change         |
| Idempotent Callbacks | Unique idempotency_key in verification_events |
| Replay Protection    | SAML request IDs expire in 5 minutes          |
| Input Validation     | Effect Schema on all inputs                   |

**Headers (all responses):**

```sh
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

**Validation:**

```sh
# Duplicate callback test
curl -X GET /verify/govx/callback?code=test&state=...
curl -X GET /verify/govx/callback?code=test&state=...  # Same payload
# Check: Only one verification_event created

# Rate limit test
for i in {1..150}; do curl http://localhost:3000/auth/github; done
# Check: Returns 429 after 100 requests
```

---

### Task 6.2 — Audit Trail

**Goal:** Complete, immutable history of all security events

**Logged Events:**

| Action            | Data                            |
|-------------------|---------------------------------|
| `login`           | user_id, ip, user_agent         |
| `logout`          | user_id, ip                     |
| `verify_start`    | user_id, provider               |
| `verify_success`  | user_id, provider, provider_ref |
| `verify_fail`     | user_id, provider, reason       |
| `badge_generated` | user_id, requester_ip           |
| `session_rotated` | user_id, reason                 |

**Query Interface:**

```sql
-- Reconstruct user's verification journey
SELECT * FROM audit_log
WHERE user_id = $1
ORDER BY created_at;
```

**Effect Service:** `packages/server/src/services/AuditLog.ts`

**Validation:**

```sh
# Complete user flow
# Check: All events present in audit_log
# Check: Events ordered correctly
# Check: Metadata includes relevant context
```

---

## Phase 7 — Acceptance

### Task 7.1 — End-to-End Tests

**Goal:** Automated verification of complete flows

**Test Scenarios:**

1. **New User Flow**
   - Visit landing page
   - Click "Sign in with GitHub"
   - Complete OAuth
   - Verify veteran status
   - View public profile
   - Embed badge in README

2. **Returning User Flow**
   - Visit site with existing session
   - View dashboard
   - Profile shows cached GitHub stats

3. **Public Visitor Flow**
   - Visit `/:username` without auth
   - See verified badge
   - Cannot access `/dashboard`

4. **Edge Cases**
   - OAuth state mismatch → error page
   - Duplicate verification callback → idempotent
   - Expired session → redirect to login
   - Invalid badge URL → 404

**Test Framework:** Playwright + Bun test runner

**Location:** `packages/server/tests/e2e/`

**Validation:**

```sh
bun run test:e2e
# All scenarios pass
```

---

## Launch Checklist

### Pre-Launch

- [ ] All E2E tests pass
- [ ] Security headers verified (Mozilla Observatory A+)
- [ ] SSL certificate configured (Let's Encrypt)
- [ ] Database backups configured
- [ ] Error monitoring (Sentry or similar)
- [ ] Uptime monitoring
- [ ] GovX production credentials obtained
- [ ] GitHub OAuth app in production mode

### Launch Criteria

- [ ] At least 5 veterans have profiles
- [ ] At least 1 badge embedded publicly
- [ ] All flows work without client-side JS
- [ ] State transitions are auditable
- [ ] Zero PII in our database

### Post-Launch

- [ ] Monitor error rates
- [ ] Review audit logs daily (first week)
- [ ] Gather user feedback
- [ ] Plan Phase 2 features

---

## Future Considerations (Out of Scope for MVP)

- Additional verification providers (SheerID as backup)
- API for third-party verification checks
- Badge customization options
- Profile analytics
- Community directory (opt-in)
- Integration with veteran job boards

---

## File Reference

| Path | Description |
|------|-------------|
| `packages/server/src/index.ts` | Server entrypoint |
| `packages/server/src/routes/` | HTTP route handlers |
| `packages/server/src/services/` | Effect services |
| `packages/shared/src/db/schema.ts` | Drizzle schema |
| `packages/shared/src/state/` | State machine |
| `packages/web/templates/` | HTML templates |
| `packages/web/static/` | CSS, images |
| `migrations/` | SQL migrations |
| `docker/docker-compose.yml` | Local dev services |

---

*vets.dev — Verified credentials for veteran developers*
