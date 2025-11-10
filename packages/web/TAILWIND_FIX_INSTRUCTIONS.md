# Fix for Dialog Styling Issue

## Root Cause
The project is using Tailwind CSS v4.1.17, but the configuration and plugins are for Tailwind v3. Tailwind v4 has breaking changes:
- No longer uses `tailwind.config.ts` file
- Uses CSS-based `@theme` configuration
- Plugin ecosystem (including `tailwindcss-animate`) is not compatible

## Solution: Downgrade to Tailwind CSS v3

### Step 1: Update package.json

Replace these lines in `/home/weijun/calenote/packages/web/package.json`:

```json
"devDependencies": {
  "@tailwindcss/postcss": "^4",
  "tailwindcss": "^4"
}
```

WITH:

```json
"devDependencies": {
  "tailwindcss": "^3.4.1",
  "postcss": "^8.4.35",
  "autoprefixer": "^10.4.17"
}
```

### Step 2: Update postcss.config.mjs

Replace `/home/weijun/calenote/packages/web/postcss.config.mjs` with:

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

### Step 3: Reinstall dependencies

```bash
cd /home/weijun/calenote/packages/web
rm -rf node_modules package-lock.json
npm install
```

### Step 4: Restart dev server

```bash
npm run dev
```

## Why This Fixes The Issue

1. Tailwind v3 properly reads `tailwind.config.ts`
2. The `tailwindcss-animate` plugin will work correctly
3. All animation classes used by Dialog components will be generated:
   - `animate-in`, `animate-out`
   - `fade-in-0`, `fade-out-0`
   - `zoom-in-95`, `zoom-out-95`
   - `slide-in-from-*`, `slide-out-to-*`
4. CSS custom properties will work as expected

## Expected Result

After these changes, the Dialog/Modal components will:
- Show proper background overlay (bg-black/80)
- Display centered modal with border and shadow
- Have proper spacing and padding
- Show styled form inputs
- Display smooth animations on open/close
