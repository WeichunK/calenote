# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install bash (needed for postinstall scripts)
RUN apk add --no-cache bash

# Copy package files, lockfile, and scripts (needed for postinstall)
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
COPY scripts ./scripts

# Install dependencies (use ci for faster, reproducible builds)
# Note: bash is installed above for postinstall scripts
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Ensure TypeScript is accessible from packages/web (needed for next.config.ts)
# In monorepo, TypeScript is hoisted to root but Next.js needs it in workspace context
# IMPORTANT: Must be AFTER COPY to avoid being overwritten
# Use cp -r instead of symlink to avoid symlink issues in Docker
RUN mkdir -p packages/web/node_modules && \
    cp -r node_modules/typescript packages/web/node_modules/

# Build arguments for Next.js environment variables
ARG NEXT_PUBLIC_API_URL=https://calenote-backend.zeabur.app/api/v1
ARG NEXT_PUBLIC_WS_URL=wss://calenote-backend.zeabur.app/ws

# Set environment variables for build time
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build Next.js directly (skip bash script)
RUN npm run build --workspace=web

# Debug: Check standalone structure
RUN ls -la packages/web/.next/ || true
RUN ls -la packages/web/.next/standalone/ || true

# Create necessary directories and copy static assets
RUN mkdir -p packages/web/.next/standalone/packages/web/.next && \
    cp -r packages/web/public packages/web/.next/standalone/packages/web/ && \
    cp -r packages/web/.next/static packages/web/.next/standalone/packages/web/.next/

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy the entire standalone directory (which now includes static and public)
COPY --from=builder /app/packages/web/.next/standalone ./

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "packages/web/server.js"]
