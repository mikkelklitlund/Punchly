# backend/Dockerfile
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY backend/package.json ./

COPY shared/package.json ../shared/ 

RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY backend ./
COPY shared ../shared/

RUN cd ../shared && npm install && npm run build

RUN cd ../app

RUN npx prisma generate

RUN npm run build

# Expose the application port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start"]
