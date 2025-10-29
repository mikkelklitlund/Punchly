# ----------
# Frontend + Shared + Backend Build on Debian (no musl issues)
# ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Enable corepack for correct workspace behavior
RUN corepack enable

# Copy dependency manifests (cache-friendly)
COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/
COPY shared/package*.json shared/

# Install all workspace dependencies
RUN npm ci --workspaces

# Copy full workspace sources
COPY frontend/ frontend/
COPY backend/ backend/
COPY shared/ shared/

# Build shared + frontend + backend
RUN npm run build --workspace=shared
RUN npm run build --workspace=frontend

# Prisma client generation
ENV DATABASE_URL=file:./dev.db
RUN npx prisma generate --schema=backend/prisma/schema.prisma

RUN npm run build --workspace=backend

# Move built frontend to backend's public folder
RUN mkdir -p backend/public && \
    cp -r frontend/dist/* backend/public/


# ----------
# Production Runtime (small Debian image)
# ----------
FROM node:22-bookworm-slim AS prod
WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL (Prisma requirement)
RUN apt-get update -y && apt-get install -y openssl

# Copy only necessary manifests
COPY package*.json ./
COPY backend/package*.json backend/
COPY shared/package*.json shared/

# Install production dependencies only
RUN npm ci --workspaces --omit=dev

# Copy Prisma schema BEFORE generating client
COPY --from=builder /app/backend/prisma /app/backend/prisma

# Generate Prisma client in production stage
RUN npx prisma generate --schema=backend/prisma/schema.prisma

# Copy built backend + shared from builder
COPY --from=builder /app/backend/dist /app/backend/dist
COPY --from=builder /app/shared /app/shared
COPY --from=builder /app/backend/public /app/backend/public

# Guarantee uploads dir exists
RUN mkdir -p backend/uploads

WORKDIR /app/backend
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/src/index.js"]