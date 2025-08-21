# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Build stage
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production
RUN npm install -g pnpm

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
