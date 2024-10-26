# frontend/Dockerfile
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY frontend/package.json ./

COPY shared/package.json ../shared/ 

RUN npm install --legacy-peer-deps

COPY frontend ./
COPY shared ../shared/

RUN cd ../shared && npm install && npm run build

RUN cd ../app

# Build the application
RUN npm run build

# Expose the application port
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview"]
