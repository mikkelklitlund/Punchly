# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Copy all package.json files
COPY package*.json ./
COPY frontend/package*.json frontend/
COPY shared/package*.json shared/

# Copy the source code of workspaces
COPY frontend/ frontend/
COPY shared/ shared/

# Install dependencies at root so workspaces are linked
RUN npm install

# Build frontend
RUN npm run build --workspace=shared
RUN npm run build --workspace=frontend

# Build backend
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json backend/
COPY shared/package*.json shared/
# This stage already correctly runs 'npm install' to link workspaces
RUN npm install
COPY shared/ shared/
COPY backend/ backend/

RUN npm run build --workspace=shared

ENV DATABASE_URL=file:./dev.db
RUN npx prisma generate --schema=backend/prisma/schema.prisma

RUN npm run build --workspace=backend

# Copy frontend into backend
COPY --from=frontend-builder /app/frontend/dist backend/public

RUN mkdir -p /app/backend/uploads
COPY ./backend/uploads/default-avatar.jpg /app/backend/uploads/

# Production image
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=backend-builder /app/backend /app/backend
COPY --from=backend-builder /app/shared /app/shared
COPY package*.json ./
COPY shared/package*.json shared/
COPY backend/package*.json backend/
RUN npm install --omit=dev

WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/src/index.js"]
