# backend/Dockerfile

# Stage 1: Build Stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY backend/package.json ./
COPY shared/package.json ../shared/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files and build
COPY backend ./
COPY shared ../shared/

# Build the shared module first, then generate Prisma files and build backend
RUN cd ../shared && npm install && npm run build && cd ../app
RUN npx prisma generate
RUN npm run build

# Stage 2: Production Stage
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy only the built backend and shared library from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/shared/dist ../shared
COPY --from=build /usr/src/app/prisma ./prisma

# Copy only necessary production files
COPY backend/package.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force
RUN npx prisma generate

# Expose the application port
EXPOSE 4000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
