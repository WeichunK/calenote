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

# Ensure TypeScript is accessible from packages/web (needed for next.config.ts)
# In monorepo, TypeScript is hoisted to root but Next.js needs it in workspace context
RUN ln -sf ../../node_modules/typescript packages/web/node_modules/typescript

# Copy source code
COPY . .

# Build Next.js directly (skip bash script)
RUN npm run build --workspace=web

# Copy static assets to standalone (Next.js doesn't do this automatically)
RUN cp -r packages/web/public packages/web/.next/standalone/packages/web/ && \
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
