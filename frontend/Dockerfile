# Build shared
FROM node:22-alpine AS shared-builder
WORKDIR /app
COPY package*.json ./
COPY shared/package*.json shared/
RUN npm ci --workspace=shared
COPY shared/ shared/
RUN npm run build --workspace=shared

# Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json frontend/
COPY shared/package*.json shared/
RUN npm ci --workspace=frontend
COPY shared/ shared/
COPY frontend/ frontend/
COPY --from=shared-builder /app/shared/dist shared/dist
RUN npm run build --workspace=frontend

# Serve with Nginx on port 80 (root)
FROM nginx:alpine
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
