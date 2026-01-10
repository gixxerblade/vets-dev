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
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/false bunjs

# Copy dependencies and built artifacts
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./

# Set ownership and switch to non-root user
RUN chown -R bunjs:nodejs /app
USER bunjs

# Railway injects PORT environment variable
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]
