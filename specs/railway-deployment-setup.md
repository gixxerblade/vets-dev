# Railway Deployment Setup for vets-dev

## Problem Statement

The vets-dev application needs to be deployed on Railway. The application is a Bun-based monorepo that requires:

1. A Dockerfile for containerization (Railway auto-detects Dockerfiles)
2. PostgreSQL database provisioning
3. Environment variables and secrets configuration
4. Health checks for zero-downtime deployments

## Objectives

1. Create a multi-stage Dockerfile optimized for Bun and the monorepo structure
2. Deploy to Railway with automatic Dockerfile detection
3. Provision PostgreSQL database using Railway templates
4. Configure environment variables and secrets
5. Implement health checks for deployment readiness
6. Document deployment and maintenance procedures

## Technical Approach

### Application Architecture Analysis

The vets-dev application is a Bun-based monorepo with:

- **Server** (`packages/server`): Bun HTTP server using Effect framework
- **Web** (`packages/web`): Frontend templates using Datastar
- **Shared** (`packages/shared`): Database models with Drizzle ORM

**Key Dependencies:**

- Runtime: Bun (not Node.js)
- Database: PostgreSQL
- Port: 3000 (configurable via PORT env var)
- Build output: `packages/server/dist/index.js`

**Environment Requirements:**

- DATABASE_URL
- GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET
- SESSION_SECRET
- BADGE_SECRET
- IDME_* variables for SAML (Phase 3)
- PORT, HOST, NODE_ENV

## Implementation Plan

### Phase 1: Create Dockerfile

**File:** `/Dockerfile`

Create a multi-stage Dockerfile that Railway will automatically detect:

1. **Base Stage**: Use official Bun image
   - Start with `oven/bun:1` as base image
   - Set working directory to `/app`
   - Copy package files for dependency caching

2. **Dependencies Stage**: Install all dependencies
   - Copy root `package.json` and `bun.lock`
   - Copy all workspace package.json files
   - Run `bun install --frozen-lockfile` for reproducible builds
   - Use layer caching to speed up rebuilds

3. **Build Stage**: Compile the application
   - Copy all source code
   - Run TypeScript compilation if needed
   - Build the server package: `bun run build`

4. **Production Stage**: Create minimal runtime image
   - Start from `oven/bun:1-slim` for smaller image size
   - Copy only production dependencies
   - Copy built artifacts from build stage
   - Set non-root user for security
   - Expose port 3000
   - Set CMD to run the production server

**Complete Dockerfile:**

```dockerfile
# Base stage with Bun
FROM oven/bun:1 AS base
WORKDIR /app

# Dependencies stage - install all dependencies
FROM base AS dependencies
COPY package.json bun.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Build stage - compile TypeScript and build
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/server/node_modules ./packages/server/node_modules 2>/dev/null || true
COPY --from=dependencies /app/packages/web/node_modules ./packages/web/node_modules 2>/dev/null || true
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY . .
RUN bun run build

# Production stage - minimal runtime image
FROM oven/bun:1-slim AS production
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs

# Copy dependencies and built artifacts
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./

# Set ownership and switch to non-root user
RUN chown -R bunjs:nodejs /app
USER bunjs

# Railway injects PORT environment variable
EXPOSE 3000

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the server
CMD ["bun", "run", "start"]
```

### Phase 2: Create .dockerignore

**File:** `/.dockerignore`

Exclude files that shouldn't be in the Docker image:

```dockerignore
# Dependencies - will be installed fresh
node_modules

# Git
.git
.gitignore

# Environment files - secrets managed via Railway
.env
.env.*
!.env.example

# Development files
.vscode
.idea
*.log
logs/

# Build artifacts (will be generated fresh)
dist/
packages/*/dist/

# Documentation and specs
*.md
specs/
ai_docs/
PHASE_*.md

# Docker files (not needed in image)
docker/
docker-compose*.yml
Dockerfile*
.dockerignore

# Claude configuration
.claude/

# Test files
**/*.test.ts
**/*.spec.ts
**/__tests__/
coverage/

# OS files
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
```

### Phase 3: Railway Project Setup

**Actions:**

1. **Install Railway CLI**

   ```bash
   # macOS
   brew install railway

   # or via npm
   npm i -g @railway/cli

   # or via shell script
   bash <(curl -fsSL cli.new)
   ```

2. **Authenticate with Railway**

   ```bash
   railway login
   ```

3. **Initialize Project**

   ```bash
   # Create new Railway project
   railway init

   # Or link to existing project
   railway link
   ```

4. **Link Service to Directory**

   ```bash
   railway service
   ```

   Select or create a service for the vets-dev application.

### Phase 4: Database Setup

**Actions:**

1. **Add PostgreSQL Database**

   ```bash
   railway add --database postgres
   ```

   Or via the Railway dashboard:
   - Click "New" button on project canvas
   - Select "Database" → "PostgreSQL"
   - Railway will provision and configure the database

2. **Database Connection**
   Railway automatically provides these variables:
   - `DATABASE_URL` - Full connection string
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual connection parameters

   The `DATABASE_URL` format: `postgresql://user:password@host:port/database`

3. **Reference Variables**
   In your service, create a reference variable to use the database URL:

   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   ```

   Railway's template syntax links your service to the database.

### Phase 5: Environment Variables Configuration

**Via Railway Dashboard:**

Navigate to your service → Variables tab, then add:

**Required Variables:**

```
NODE_ENV = production
PORT = 3000
HOST = 0.0.0.0

# Reference to PostgreSQL service
DATABASE_URL = ${{Postgres.DATABASE_URL}}
```

**Secrets (mark as sealed for extra security):**

```
GITHUB_CLIENT_ID = your_client_id
GITHUB_CLIENT_SECRET = your_client_secret
SESSION_SECRET = <generate-32-byte-random-string>
BADGE_SECRET = <generate-32-byte-random-string>
```

**Generate Secrets Locally:**

```bash
# Generate random secrets
openssl rand -hex 32  # For SESSION_SECRET
openssl rand -hex 32  # For BADGE_SECRET
```

**Via Railway CLI:**

```bash
# Set variables using the CLI
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=3000"
railway variables --set "HOST=0.0.0.0"
railway variables --set "GITHUB_CLIENT_ID=your_client_id"
railway variables --set "GITHUB_CLIENT_SECRET=your_client_secret"
railway variables --set "SESSION_SECRET=$(openssl rand -hex 32)"
railway variables --set "BADGE_SECRET=$(openssl rand -hex 32)"
```

**ID.me SAML Variables (Phase 3 - when ready):**

```
IDME_ENTITY_ID = your_entity_id
IDME_SSO_URL = your_sso_url
IDME_CERTIFICATE = your_certificate
```

### Phase 6: Health Check Configuration

Railway performs health checks to ensure zero-downtime deployments.

**Requirements:**

1. Your application must expose an endpoint returning HTTP 200 when ready
2. The existing `/health` endpoint in the server satisfies this requirement

**Server Health Endpoint (already implemented in `packages/server/src/index.ts:298-303`):**

```typescript
if (path === "/health") {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

**Health Check Timeout:**

- Default: 300 seconds (5 minutes)
- Can be adjusted via `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` environment variable

**Configuration via Variable:**

```
RAILWAY_HEALTHCHECK_TIMEOUT_SEC = 120
```

### Phase 7: Deployment

**Option A: Deploy via CLI (Recommended for first deployment)**

```bash
# Navigate to project root
cd /path/to/vets-dev

# Link project if not already linked
railway link

# Deploy with live logs
railway up

# Or deploy in detached mode
railway up --detach
```

**Option B: GitHub Integration (Recommended for ongoing deployments)**

1. In Railway dashboard, click your service
2. Go to Settings → Source
3. Connect your GitHub repository
4. Select the branch to deploy (e.g., `main`)
5. Railway will auto-deploy on every push to that branch

**Option C: Deploy Local Directory**

```bash
# Create empty service first, then:
railway up
```

### Phase 8: Database Migrations

**Run migrations after deployment:**

```bash
# SSH into the running service
railway ssh

# Inside the container, run migrations
bun run --filter @vets-dev/shared db:migrate

# Or run directly without interactive session
railway ssh -- bun run --filter @vets-dev/shared db:migrate
```

**Alternative: Run migrations locally with Railway variables:**

```bash
# This uses Railway's environment variables locally
railway run bun run --filter @vets-dev/shared db:migrate
```

### Phase 9: Public Networking

**Generate a Public Domain:**

Via CLI:

```bash
railway domain
```

Via Dashboard:

1. Click on your service
2. Go to Settings → Networking
3. Click "Generate Domain" for a `*.railway.app` domain
4. Or add a custom domain

**Custom Domain Setup:**

1. Add your domain in Railway dashboard
2. Configure DNS records as instructed:
   - CNAME record pointing to Railway
   - Or A record for apex domains

### Phase 10: Testing and Validation

**Post-Deployment Checks:**

1. **Health Endpoint**

   ```bash
   curl https://your-app.railway.app/health
   ```

   Expected: `{"status":"ok","timestamp":"..."}`

2. **View Logs**

   ```bash
   railway logs
   ```

3. **Check Service Status**

   ```bash
   railway status
   ```

4. **Database Connectivity**

   ```bash
   # Connect to database shell
   railway connect postgres

   # Or via SSH
   railway ssh -- bun run --filter @vets-dev/shared db:studio
   ```

5. **Test OAuth Flow**
   - Navigate to your deployed app
   - Click "Sign in with GitHub"
   - Verify callback URL works

### Phase 11: Monitoring and Maintenance

**View Metrics and Logs:**

```bash
# View logs
railway logs

# Open dashboard
railway open
```

**Redeploy without Code Changes:**

```bash
railway redeploy
```

**Rollback to Previous Deployment:**

```bash
railway down  # Remove most recent deployment
```

**Scale the Service:**
Railway offers automatic vertical scaling. For horizontal scaling:

- Enable replicas in service settings
- Configure via dashboard

## Potential Challenges and Solutions

### Challenge 1: Monorepo Workspace Resolution

**Problem:** Bun workspaces need proper resolution during build

**Solution:**

- Copy all package.json files before installing dependencies
- Use workspace:* notation to ensure proper linking
- Run build from root directory to access all workspaces

### Challenge 2: Database Migration Timing

**Problem:** App may start before migrations complete

**Solution:**

- Run migrations manually after first deployment
- Or use `railway run` locally before deploying
- Railway doesn't have a built-in release command like Fly.io

### Challenge 3: Static Assets Serving

**Problem:** Frontend assets in packages/web/static/* need to be accessible

**Solution:**

- Ensure packages/web is copied to production image
- Server code imports from @vets-dev/web which resolves static exports
- Test asset paths after deployment

### Challenge 4: PORT Environment Variable

**Problem:** Railway injects PORT dynamically

**Solution:**

- The app already uses `config.port` which reads from `PORT` env var
- Ensure HOST=0.0.0.0 for Railway networking
- Railway sets PORT automatically, don't hardcode it

### Challenge 5: Database Connection

**Problem:** Different connection string format than local

**Solution:**

- Use Railway's reference variables: `${{Postgres.DATABASE_URL}}`
- Format is compatible: `postgresql://user:pass@host:port/db`
- No code changes needed

### Challenge 6: Health Check Failures

**Problem:** Deployment fails if health check doesn't pass in time

**Solution:**

- Verify `/health` endpoint returns 200
- Increase timeout if needed: `RAILWAY_HEALTHCHECK_TIMEOUT_SEC=180`
- Check logs for startup errors

## Testing Strategy

### Local Docker Testing

Before deploying to Railway, test the Dockerfile locally:

```bash
# Build the image
docker build -t vets-dev .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://..." \
  -e GITHUB_CLIENT_ID="..." \
  -e GITHUB_CLIENT_SECRET="..." \
  -e SESSION_SECRET="..." \
  -e BADGE_SECRET="..." \
  -e NODE_ENV="production" \
  -e PORT="3000" \
  -e HOST="0.0.0.0" \
  vets-dev

# Test the health endpoint
curl http://localhost:3000/health
```

### Local Development with Railway Variables

```bash
# Run locally with Railway's production variables
railway run bun run dev
```

### Integration Testing

1. Test OAuth flow with GitHub
2. Verify database operations (CRUD)
3. Test session management
4. Verify health checks respond correctly
5. Test error handling (500, 404 pages)

## Success Criteria

The deployment is successful when:

1. ✅ Dockerfile is detected and builds successfully on Railway
2. ✅ PostgreSQL database is provisioned and connected
3. ✅ All environment variables are configured
4. ✅ Health check endpoint returns 200 OK
5. ✅ Application is accessible at generated Railway domain
6. ✅ GitHub OAuth flow completes successfully
7. ✅ Database migrations run successfully
8. ✅ Logs show no errors during startup
9. ✅ HTTPS is enabled automatically

## Validation Commands

After implementation, validate the deployment with:

```bash
# Deploy the application
railway up

# Check service status
railway status

# View deployment logs
railway logs

# Test health endpoint
curl https://$(railway domain)/health

# SSH into service to verify
railway ssh -- env | grep DATABASE

# Run database migrations
railway ssh -- bun run --filter @vets-dev/shared db:migrate

# Connect to database directly
railway connect postgres
```

Expected results:

- Deploy completes without errors
- Status shows service running
- Health endpoint returns JSON with status "ok"
- Logs show successful startup
- Database connection works
- Migrations complete successfully

## Relevant Files

### Documentation

- `ai_docs/railway-documentation.md` - Complete Railway deployment documentation covering Dockerfile detection, database setup, variables, health checks, and CLI usage

### Application Structure

- `package.json:1-25` - Root package.json with workspace configuration and build scripts
- `packages/server/package.json:1-27` - Server package with build and start scripts
- `packages/server/src/index.ts:287-398` - Main server entry point with Bun.serve(), health endpoint at lines 298-303
- `packages/web/package.json:1-20` - Web package with frontend templates
- `packages/shared/package.json:1-28` - Shared package with database configuration and migration scripts
- `.env.example:1-23` - Example environment variables needed for deployment

### Configuration Files (to be created)

- `Dockerfile` - Multi-stage Docker build configuration
- `.dockerignore` - Files to exclude from Docker build

### Existing Infrastructure

- `docker/docker-compose.yml:1-21` - Local PostgreSQL setup (reference for production DB config)

## Implementation Notes

1. **Read the Railway documentation** at `ai_docs/railway-documentation.md` before starting to understand Railway's deployment model

2. **Review the server entry point** at `packages/server/src/index.ts:287-398`:
   - The app listens on port from config (defaults to 3000)
   - Health check is available at `/health` endpoint (lines 298-303)
   - Uses Bun.serve() not Node.js HTTP server

3. **Railway Auto-Detection**:
   - Railway automatically detects Dockerfiles in the root directory
   - No additional configuration file (like fly.toml) is needed
   - Build and start commands come from the Dockerfile

4. **Environment Variables**:
   - Use Railway's reference syntax `${{Service.VAR}}` to link services
   - Sealed variables provide extra security for secrets
   - PORT is injected automatically by Railway

5. **Database considerations**:
   - Uses Drizzle ORM with PostgreSQL
   - Migration command: `bun run --filter @vets-dev/shared db:migrate`
   - Reference PostgreSQL service using `${{Postgres.DATABASE_URL}}`

6. **Monorepo structure**:
   - Uses Bun workspaces
   - Server depends on @vets-dev/shared and @vets-dev/web
   - All dependencies must be installed at root level

## Post-Deployment Configuration

### Update GitHub OAuth App

Update GitHub OAuth app settings with your Railway domain:

- Authorization callback URL: `https://your-app.railway.app/auth/github/callback`
- Homepage URL: `https://your-app.railway.app`

### Custom Domain Setup

1. Add domain in Railway dashboard → Service → Settings → Networking
2. Configure DNS:
   - Subdomain: Add CNAME record pointing to your Railway app
   - Apex domain: Use Railway's instructions for A records

### ID.me SAML Configuration (Phase 3)

When implementing Phase 3, update SAML settings with production URLs.

## Cost Estimates

**Railway Pricing (Pay-as-you-go):**

- Compute: ~$0.000463/minute (~$20/month for always-on)
- PostgreSQL: Same compute pricing
- Bandwidth: $0.10/GB after free tier
- Total: ~$20-40/month for low-traffic app

**Free Tier (Hobby Plan):**

- $5/month credit
- Suitable for testing and small projects

## Additional Resources

- [Railway Documentation](https://docs.railway.com/)
- [Railway CLI Reference](https://docs.railway.com/reference/cli-api)
- [Bun Documentation](https://bun.sh/docs)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
