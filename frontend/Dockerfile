# Stage 1: Build Stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Install dependencies and build
COPY frontend/package.json ./
COPY shared/package.json ../shared/
RUN npm install --legacy-peer-deps

COPY frontend ./ 
COPY shared ../shared/
RUN cd ../shared && npm install && npm run build && cd ../app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built static files from the previous stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
