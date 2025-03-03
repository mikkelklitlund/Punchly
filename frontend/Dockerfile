# Stage 1: Build the shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
RUN npm install --workspace=shared --legacy-peer-deps
COPY shared ./shared
RUN npm run build --workspace=shared

# Stage 2: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist
RUN npm install --workspace=frontend --legacy-peer-deps
COPY frontend ./frontend
RUN npm run build --workspace=frontend

# Stage 3: Serve with Nginx
FROM nginx:alpine
# Copy built static files from the frontend build stage
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for a non-root user
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    mkdir -p /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/run/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Modify the nginx.conf to use a PID file in a directory the nginx user can access
RUN sed -i 's#pid.*#pid /var/run/nginx/nginx.pid;#' /etc/nginx/nginx.conf && \
    sed -i 's/user nginx;/#user nginx;/' /etc/nginx/nginx.conf

# Use the nginx user that already exists in the image
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]