# Stage 1: Build Stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Copy the entire monorepo (root level)
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY shared/package.json shared/

# Install dependencies using npm workspaces
RUN npm install --legacy-peer-deps

# Copy source files
COPY frontend ./frontend
COPY shared ./shared

# Build the shared package first, then the frontend
RUN npm run build --workspace=shared
RUN npm run build --workspace=frontend

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built static files from the build stage
COPY --from=build /usr/src/app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
