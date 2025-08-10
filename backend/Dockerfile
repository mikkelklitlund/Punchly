# ---------- Build args ----------
ARG NODE_IMAGE=node:22-alpine

# ---------- 1) Base for builds (dev deps) ----------
FROM ${NODE_IMAGE} AS base
WORKDIR /app

# Install only what's needed for build steps
# (Prisma on Alpine uses linux-musl binaries; no extra packages needed)
# RUN apk add --no-cache openssl curl  # uncomment if your app/tooling needs them

# Copy only manifests first for better caching
COPY package*.json ./
COPY shared/package*.json shared/
COPY backend/package*.json backend/

# Install workspace deps with lockfile for reproducibility
# This installs all deps (including dev) but nothing else is copied yet -> great cache hit rate.
RUN npm ci

# ---------- 2) Build shared + backend ----------
FROM base AS builder
WORKDIR /app

# Now copy sources
COPY shared/ shared/
COPY backend/ backend/

# Build shared first (so backend can import it)
RUN npm run build --workspace=shared

# Generate Prisma client for backend (types needed for TS build)
# If prisma needs DATABASE_URL at generate time and you don't want a real DB, use a file: URL
ENV DATABASE_URL=file:./dev.db
RUN npm run prisma:generate --workspace=backend || (cd backend && npx prisma generate)

# Build backend (produces backend/dist)
RUN npm run build --workspace=backend

# ---------- 3) Production image ----------
FROM ${NODE_IMAGE} AS production
WORKDIR /app

ENV NODE_ENV=production
# Optional: set timezone so logs have expected zone
# ENV TZ=UTC

# Copy only what runtime needs
COPY package*.json ./
COPY shared/package*.json shared/
COPY backend/package*.json backend/

# Install production deps only for all workspaces
# (keeps node_modules small; no dev deps)
RUN npm ci --omit=dev

# Copy compiled code and prisma schema
COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/backend/prisma backend/prisma

# Generate Prisma client in the final image so the binary matches the target platform
# (safe even if it already exists; uses node_modules/@prisma/engines from this image)
RUN cd backend && npx prisma generate

# Drop privileges (the official node image has user `node`)
USER node

WORKDIR /app/backend
EXPOSE 4000

# On start: run migrations then start the server
# If you prefer running migrations in a one-shot "migrate" service, change CMD to just `node dist/src/index.js`
CMD sh -c "npx prisma migrate deploy && node dist/src/index.js"
