# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY pentanotes-frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY pentanotes-frontend/src ./src
COPY pentanotes-frontend/public ./public
COPY pentanotes-frontend/tsconfig.json ./
COPY pentanotes-frontend/tailwind.config.js ./
COPY pentanotes-frontend/postcss.config.js ./

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the built app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "build", "-l", "3000"]
