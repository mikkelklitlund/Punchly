# Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY package*.json ./
COPY shared/package*.json ./shared/
RUN npm install --workspace=shared
COPY shared ./shared
RUN npm run build --workspace=shared

# Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist
RUN npm install --workspace=backend
COPY backend ./backend
RUN cd backend && npx prisma generate
RUN npm run build --workspace=backend

# Production image
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/shared/dist ./shared/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY package.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm install --omit=dev --workspaces

WORKDIR /app/backend
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]