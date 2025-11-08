# Module Resolution Fix Summary

## Problem

Next.js 16.0.1 with Turbopack was unable to resolve `@calenote/shared` package imports, showing error:
```
Module not found: Can't resolve '@calenote/shared'
```

Despite having:
- TypeScript path aliases in `tsconfig.json`
- `transpilePackages` in `next.config.ts`
- Valid shared package structure

## Root Cause

**TypeScript path aliases alone are insufficient for Next.js/Turbopack runtime module resolution.**

The package needs to be physically present in `node_modules/@calenote/shared` for the bundler to resolve it. Path aliases only work for TypeScript type-checking, not for bundling.

## Solution

Implemented npm workspaces with automatic symlink creation.

## Files Changed

### 1. `/home/weijun/calenote/package.json` (NEW)

Created root workspace configuration:

```json
{
  "name": "calenote-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=web",
    "build": "npm run build --workspace=web",
    "backend": "cd app && uvicorn app.main:app --reload",
    "test": "pytest",
    "postinstall": "bash scripts/link-shared.sh"
  }
}
```

**Key changes:**
- Added `workspaces` field to enable npm workspaces
- Added `postinstall` script to create symlinks automatically

### 2. `/home/weijun/calenote/packages/web/package.json` (MODIFIED)

Added dependency reference to shared package:

```json
{
  "dependencies": {
    "@calenote/shared": "*",
    // ... other dependencies
  }
}
```

**Key changes:**
- Added `"@calenote/shared": "*"` to dependencies
- The `*` tells npm to use the local workspace version

### 3. `/home/weijun/calenote/packages/shared/package.json` (MODIFIED)

Added exports field for proper module resolution:

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

**Key changes:**
- Added `exports` field to support both default and deep imports
- This enables `import from '@calenote/shared'` and `import from '@calenote/shared/api/auth'`

### 4. `/home/weijun/calenote/packages/web/next.config.ts` (MODIFIED)

Updated to use Turbopack configuration instead of webpack:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@calenote/shared'],
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
};

export default nextConfig;
```

**Key changes:**
- Replaced `webpack` config with `turbopack` config (Next.js 16 uses Turbopack by default)
- Added `resolveExtensions` to tell Turbopack to resolve TypeScript files

### 5. `/home/weijun/calenote/packages/web/tsconfig.json` (MODIFIED)

Simplified path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Key changes:**
- Removed `@calenote/shared` path aliases (no longer needed with npm workspaces)
- The package is now resolved through `node_modules` instead of path mapping

### 6. `/home/weijun/calenote/scripts/link-shared.sh` (NEW)

Created postinstall script to create symlinks:

```bash
#!/bin/bash
echo "Linking @calenote/shared to web/node_modules..."
mkdir -p packages/web/node_modules/@calenote
ln -sf ../../../node_modules/@calenote/shared packages/web/node_modules/@calenote/shared
echo "Link created successfully!"
```

**Purpose:**
- Automatically creates symlink from `packages/web/node_modules/@calenote/shared` to root `node_modules/@calenote/shared`
- Runs after every `npm install`

### 7. `/home/weijun/calenote/packages/web/tailwind.config.ts` (FIXED)

Fixed unrelated TypeScript error:

```typescript
// Before
darkMode: ["class"],

// After
darkMode: "class",
```

## How It Works

1. **Install phase:**
   - `npm install` at root installs all dependencies
   - npm workspaces places `@calenote/shared` in root `node_modules/`
   - `postinstall` script creates symlink in `packages/web/node_modules/@calenote/shared`

2. **Development phase:**
   - Next.js resolves `import from '@calenote/shared'`
   - Follows symlink to root `node_modules/@calenote/shared`
   - Which points to `packages/shared/src/index.ts`
   - Turbopack compiles TypeScript on-the-fly

3. **Build phase:**
   - Same resolution process
   - `transpilePackages` ensures shared package is compiled
   - TypeScript types are checked
   - Production bundle includes compiled shared code

## Verification

### Successful Build Output

```bash
$ npm run build

   ▲ Next.js 16.0.1 (Turbopack)
   Creating an optimized production build ...

 ✓ Compiled successfully in 2.5s
   Running TypeScript ...
   Collecting page data ...
   Generating static pages (9/9)
   Finalizing page optimization ...

Route (app)
├ ○ /
├ ○ /calendar
├ ○ /entries
├ ○ /login
├ ○ /register
└ ○ /tasks

○  (Static)  prerendered as static content
```

No module resolution errors!

## Usage

### Setup (one-time)

```bash
cd /home/weijun/calenote
npm install
```

### Development

```bash
npm run dev
```

### After pulling changes

```bash
npm install
```

The postinstall script automatically maintains the symlink.

## Import Examples

All these imports now work correctly:

```typescript
// Default import (from index.ts)
import { authApi, LoginRequest, AuthResponse } from '@calenote/shared';

// Deep imports (specific modules)
import { authApi } from '@calenote/shared/api/auth';
import { LoginRequest } from '@calenote/shared/types/auth';
import { setTokenManagement } from '@calenote/shared/api/client';
```

## Files Using Shared Package

These files now successfully import from `@calenote/shared`:

1. `/home/weijun/calenote/packages/web/src/lib/api-setup.ts`
   - Imports: `setTokenManagement`

2. `/home/weijun/calenote/packages/web/src/lib/hooks/useAuth.ts`
   - Imports: `authApi`, `LoginRequest`, `RegisterRequest`

## Technical Deep Dive

### Why Symlinks?

npm workspaces by default hoists packages to the root `node_modules/`. However, Next.js/Turbopack looks for packages in the local `node_modules/` directory. The symlink bridges this gap without duplicating code.

### Why Not Just Path Aliases?

```
TypeScript Path Aliases:
✓ Type-checking
✓ IDE autocomplete
✗ Runtime resolution
✗ Bundler resolution

npm Workspaces + Symlinks:
✓ Type-checking
✓ IDE autocomplete
✓ Runtime resolution
✓ Bundler resolution
```

### Alternative Considered: Compiled Build

We could have:
1. Built `packages/shared` to a `dist/` folder
2. Set `"main": "dist/index.js"` in package.json
3. Added build step to shared package

**Why we didn't:**
- Adds complexity (build step, watch mode)
- Slower development iteration
- Less transparent (source maps needed)
- Our current approach is simpler for a monorepo

## Troubleshooting

### Issue: Module not found after npm install

**Solution:**
```bash
npm run postinstall
```

### Issue: Symlink broken

**Solution:**
```bash
rm -rf packages/web/node_modules/@calenote
bash scripts/link-shared.sh
```

### Issue: TypeScript errors in shared package

**Solution:**
```bash
cd packages/shared
npm run type-check
```

### Issue: Clean install needed

**Solution:**
```bash
rm -rf node_modules packages/*/node_modules
rm package-lock.json packages/*/package-lock.json
npm install
```

## Benefits of This Solution

1. **Zero configuration for developers** - postinstall handles setup
2. **Type-safe** - Full TypeScript support with proper types
3. **Fast** - No build step for shared package, instant updates
4. **Standard** - Uses npm workspaces (industry standard)
5. **Maintainable** - Clear structure, well-documented

## Related Documentation

- See `/home/weijun/calenote/MONOREPO_SETUP.md` for detailed monorepo guide
- See `/home/weijun/calenote/CLAUDE.md` for project-wide development guidelines
