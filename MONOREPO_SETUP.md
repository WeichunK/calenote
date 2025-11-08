# Monorepo Setup Guide

This document explains how the `@calenote/shared` package is set up in the monorepo and how to maintain it.

## Structure

```
calenote/
├── package.json              # Root workspace configuration
├── scripts/
│   └── link-shared.sh        # Symlink creation script
└── packages/
    ├── shared/               # Shared package (types, API client, utils)
    │   ├── package.json
    │   └── src/
    │       └── index.ts
    └── web/                  # Next.js web application
        ├── package.json
        └── node_modules/
            └── @calenote/
                └── shared -> (symlink to root node_modules)
```

## How Module Resolution Works

1. **npm workspaces** installs `@calenote/shared` in the root `node_modules/`
2. **postinstall script** creates a symlink from `packages/web/node_modules/@calenote/shared` to the root installation
3. **Next.js/Turbopack** resolves the import from the symlinked location
4. **transpilePackages** in `next.config.ts` tells Next.js to compile the TypeScript from the shared package

## Root Cause of Original Issue

The error "Module not found: Can't resolve '@calenote/shared'" occurred because:

1. TypeScript path aliases (`tsconfig.json` paths) only work for TypeScript type-checking
2. Next.js/Turbopack needs the package to be physically present in `node_modules`
3. Without workspace setup, there was no package in `node_modules/@calenote/shared`

## Solution Components

### 1. Root package.json

```json
{
  "workspaces": ["packages/*"],
  "scripts": {
    "postinstall": "bash scripts/link-shared.sh"
  }
}
```

This enables npm workspaces and automatically creates symlinks after install.

### 2. Web package.json

```json
{
  "dependencies": {
    "@calenote/shared": "*"
  }
}
```

The `"*"` version tells npm to use the local workspace package.

### 3. Shared package.json

```json
{
  "name": "@calenote/shared",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  }
}
```

The `exports` field enables deep imports like `@calenote/shared/types/auth`.

### 4. next.config.ts

```typescript
{
  transpilePackages: ['@calenote/shared'],
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  }
}
```

This tells Next.js to:
- Compile TypeScript from the shared package
- Resolve `.ts` files as valid imports

### 5. scripts/link-shared.sh

```bash
#!/bin/bash
mkdir -p packages/web/node_modules/@calenote
ln -sf ../../../node_modules/@calenote/shared packages/web/node_modules/@calenote/shared
```

Creates the necessary symlink for Next.js to find the package.

## Development Workflow

### First-time Setup

```bash
cd /home/weijun/calenote
npm install
```

This will:
1. Install all dependencies
2. Set up workspace packages
3. Run postinstall to create symlinks

### After Pulling Changes

```bash
npm install
```

The postinstall script automatically runs.

### Adding Dependencies to Shared Package

```bash
cd packages/shared
npm install <package-name>
cd ../..
npm install  # Re-run postinstall
```

### Running the Web App

```bash
# From root
npm run dev

# Or from web directory
cd packages/web
npm run dev
```

## Importing from Shared Package

### Basic Import

```typescript
import { authApi, LoginRequest, AuthResponse } from '@calenote/shared';
```

### Deep Import (specific modules)

```typescript
import { authApi } from '@calenote/shared/api/auth';
import { LoginRequest } from '@calenote/shared/types/auth';
```

Both methods work due to the `exports` configuration.

## Troubleshooting

### "Module not found" Error

1. Check if symlink exists:
   ```bash
   ls -la packages/web/node_modules/@calenote/
   ```

2. If missing, run:
   ```bash
   npm run postinstall
   ```

3. If still broken, clean and reinstall:
   ```bash
   rm -rf packages/web/node_modules
   rm -rf node_modules
   npm install
   ```

### TypeScript Can't Find Types

1. Verify tsconfig.json doesn't have conflicting paths
2. Restart TypeScript server in your IDE
3. Run `npm run type-check` in the shared package

### Build Failures

1. Check that `transpilePackages` includes `@calenote/shared`
2. Verify `turbopack.resolveExtensions` includes `.ts`
3. Ensure shared package has no compilation errors

## Why Not Use TypeScript Path Aliases Only?

TypeScript path aliases (`paths` in `tsconfig.json`) work for:
- TypeScript type-checking
- IDE autocomplete

But they DON'T work for:
- Runtime module resolution in Next.js
- Turbopack/Webpack bundling
- Production builds

That's why we need the actual package in `node_modules`.

## Alternative Solutions (Not Used)

### 1. npm link (Manual)
- Requires manual linking on each machine
- Breaks easily with clean installs

### 2. Relative Imports
```typescript
import { authApi } from '../../shared/src/api/auth';
```
- Messy and error-prone
- Breaks when files move

### 3. Compiled Package
- Adds build step to shared package
- Slower development iteration
- More complex setup

Our solution balances simplicity with functionality for a monorepo setup.
