# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy entire monorepo (root level)
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY shared/package.json shared/

# Install dependencies using workspaces
RUN npm install --workspaces

# Copy source code and build shared first
COPY backend ./backend
COPY shared ./shared
RUN npm run build --workspace=shared

# Build the backend
RUN npx prisma generate && npm run build --workspace=backend

# Stage 2: Production
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy root package.json which contains workspace configuration
COPY package.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Copy built output
COPY --from=build /usr/src/app/backend/dist ./backend/dist
COPY --from=build /usr/src/app/shared/dist ./shared/dist
COPY --from=build /usr/src/app/backend/prisma ./backend/prisma

# Install production dependencies preserving workspace structure
RUN npm install --omit=dev --workspaces && npm cache clean --force
RUN cd backend && npx prisma generate

EXPOSE 4000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && npm run start"]