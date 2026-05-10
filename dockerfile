# ============================================================
# Stage 1: Builder
# Install ALL dependencies (including devDeps) and prepare app
# ============================================================
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy ONLY package files first — Docker layer caching trick:
# If package.json hasn't changed, this layer (npm ci) is cached.
# Your entire dependency install is skipped on subsequent builds.
# This saves 30-60 seconds on every code-only change.
COPY package*.json ./

# npm ci = clean install, strictly follows package-lock.json
# --only=production = skip devDependencies
# We install prod-only here since we have no build step (no TypeScript, no bundler)
RUN npm ci --only=production

# ============================================================
# Stage 2: Production image
# Clean slate — only what the app needs to RUN
# ============================================================
FROM node:20-alpine AS production

# Create a non-root system user and group
# If your app is ever compromised, the attacker can't escalate to root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules from the builder stage
# The builder stage is DISCARDED after this — its layers don't exist in final image
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
# .dockerignore controls what actually gets copied (see below)
COPY . .

# CRITICAL: Remove the seeds directory from the production image
# Seeds contain hardcoded data, direct DB connections, and have no place in prod
RUN rm -rf seeds/

# Hand ownership to the non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user for all subsequent commands AND container runtime
USER appuser

# Tell Node this is production — disables dotenv, enables Express prod optimizations
ENV NODE_ENV=production

# Document which port the app listens on (doesn't publish it — just metadata)
EXPOSE 3000

# Health check: Docker daemon pings this every 30s
# If it fails 3 times, the container is marked unhealthy
# Orchestrators (Kubernetes, ECS) use this to route traffic away from bad containers
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# CMD vs ENTRYPOINT:
# CMD = default command, can be overridden at runtime
# We use the exec form (JSON array) — NOT shell form ("node app.js")
# Shell form spawns a /bin/sh process, which won't receive SIGTERM directly
# Exec form: Node IS PID 1 and receives signals directly
CMD ["node", "app.js"]