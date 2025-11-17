# Zeabur Deployment Guide for Calenote

## WebSocket Configuration - CRITICAL

### Environment Variables Overview

The application requires **precise configuration** of environment variables for WebSocket connections to work in production:

#### Frontend (Next.js)
```bash
# ✅ CORRECT - Base URL without /ws path
NEXT_PUBLIC_API_URL=https://your-backend.zeabur.app/api/v1
NEXT_PUBLIC_WS_URL=wss://your-backend.zeabur.app

# ❌ WRONG - Do NOT include /ws path in WS_URL
NEXT_PUBLIC_WS_URL=wss://your-backend.zeabur.app/ws  # This will fail!
```

#### Backend (FastAPI)
```bash
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key-32-chars-minimum
BACKEND_CORS_ORIGINS=["https://your-frontend.zeabur.app"]
```

### How WebSocket URLs Are Constructed

1. **Environment Variable** (`NEXT_PUBLIC_WS_URL`):
   ```
   wss://calenote-backend.zeabur.app
   ```

2. **Client strips protocol and adds path**:
   ```javascript
   // In client.ts (line 43)
   const wsUrl = `wss://calenote-backend.zeabur.app/ws/calendar/{id}?token={token}`
   ```

3. **Final WebSocket URL**:
   ```
   wss://calenote-backend.zeabur.app/ws/calendar/24cb508f-9585-4205-9824-742af56e04ab?token=eyJ...
   ```

### Common Issues and Solutions

#### Issue 1: WebSocket 404 Not Found
**Symptom:** Console shows `WebSocket connection failed: 404`

**Cause:** Incorrect URL path (usually `/ws/ws/calendar/...`)

**Solution:**
- Ensure `NEXT_PUBLIC_WS_URL` does NOT include `/ws` path
- Update to: `wss://your-backend.zeabur.app` (without `/ws`)

#### Issue 2: WebSocket 1008 (Policy Violation)
**Symptom:** Connection closes immediately with code 1008

**Cause:** Authentication failure or missing calendar access

**Solution:**
- Check backend logs for specific error
- Verify JWT token is valid
- Ensure user has access to the calendar

#### Issue 3: CORS Errors
**Symptom:** Browser console shows CORS policy errors

**Cause:** Frontend domain not whitelisted in backend CORS

**Solution:**
```bash
# In backend environment variables
BACKEND_CORS_ORIGINS=["https://your-frontend.zeabur.app"]
```

#### Issue 4: Connection Drops After 60s
**Symptom:** WebSocket disconnects after ~60 seconds

**Cause:** Proxy/load balancer timeout

**Solution:**
- Backend now uses `--timeout-keep-alive 300` (5 minutes)
- Client sends ping every 30 seconds
- Ensure Zeabur proxy allows long-lived connections

## Deployment Steps

### Step 1: Update Repository
```bash
git add .
git commit -m "fix: correct WebSocket URL configuration for Zeabur"
git push origin main
```

### Step 2: Deploy to Zeabur

#### Option A: Using zeabur.yaml Template
1. Push code to GitHub
2. Import repository in Zeabur dashboard
3. Select "Use zeabur.yaml configuration"
4. Zeabur will automatically:
   - Deploy PostgreSQL, Redis, Backend, Frontend
   - Inject `${BACKEND_DOMAIN}` and `${FRONTEND_DOMAIN}` variables
   - Build Docker images with correct build arguments

#### Option B: Manual Service Creation
1. **Create PostgreSQL Service**
   - Template: PostgreSQL 15
   - Set database name: `calendar_db`
   - Set username: `calendar_user`

2. **Create Redis Service**
   - Template: Redis 7

3. **Create Backend Service**
   - Git URL: `https://github.com/WeichunK/calenote`
   - Branch: `main`
   - Dockerfile: `backend.Dockerfile`
   - Environment Variables:
     ```
     DATABASE_URL=${POSTGRES_CONNECTION_STRING}
     REDIS_URL=${REDIS_CONNECTION_STRING}
     SECRET_KEY=<generate with: openssl rand -hex 32>
     BACKEND_CORS_ORIGINS=["https://<your-frontend-domain>"]
     ```

4. **Create Frontend Service**
   - Git URL: `https://github.com/WeichunK/calenote`
   - Branch: `main`
   - Dockerfile: `Dockerfile`
   - Build Arguments:
     ```
     NEXT_PUBLIC_API_URL=https://<backend-domain>/api/v1
     NEXT_PUBLIC_WS_URL=wss://<backend-domain>
     ```

### Step 3: Verify Deployment

1. **Check Backend Health**
   ```bash
   curl https://your-backend.zeabur.app/health
   # Expected: {"status":"healthy"}
   ```

2. **Check API Docs**
   - Visit: `https://your-backend.zeabur.app/api/docs`
   - Should see Swagger UI

3. **Test WebSocket Connection**
   - Open browser DevTools Console
   - Visit your frontend: `https://your-frontend.zeabur.app`
   - Login with demo account
   - Look for console logs:
     ```
     [WS] Connecting to wss://your-backend.zeabur.app/ws/calendar/...
     [WS] Connected successfully
     [WS] Status: connecting → connected
     ```

4. **Test Real-time Sync**
   - Open two browser tabs
   - Create an entry in tab 1
   - Should appear instantly in tab 2

## Troubleshooting

### Enable Debug Logging

**Frontend:**
- Open browser DevTools Console
- All WebSocket events are logged with `[WS]` prefix
- Look for connection URL and status changes

**Backend:**
- Check Zeabur logs for backend service
- Look for:
  ```
  ✅ User {id} connected to calendar {id}
  ❌ WebSocket auth failed: {error}
  ❌ User {id} has no access to calendar {id}
  ```

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `WebSocket connection failed: 404` | Wrong URL path | Check `NEXT_PUBLIC_WS_URL` format |
| `WebSocket closed: code=1008` | Auth or access denied | Check token and calendar access |
| `WebSocket closed: code=1006` | Abnormal closure | Check network/proxy settings |
| `Insufficient resources` | Multiple connections | Fixed by singleton pattern |

### Verify Environment Variables at Runtime

Add temporary logging in production (remove after debugging):

**Frontend** (`packages/web/src/app/page.tsx`):
```typescript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL);
```

**Backend** (`app/main.py`):
```python
print(f"CORS Origins: {settings.BACKEND_CORS_ORIGINS}")
print(f"Environment: {settings.ENVIRONMENT}")
```

## Production Checklist

- [ ] `NEXT_PUBLIC_WS_URL` does NOT include `/ws` path
- [ ] `SECRET_KEY` is set to secure random value (32+ chars)
- [ ] `BACKEND_CORS_ORIGINS` includes frontend domain
- [ ] Backend Dockerfile uses `--timeout-keep-alive 300`
- [ ] PostgreSQL connection string is correct
- [ ] Redis connection string is correct
- [ ] Frontend builds successfully with correct env vars
- [ ] WebSocket connects successfully in production
- [ ] Real-time sync works between multiple tabs
- [ ] No CORS errors in browser console
- [ ] Backend health check returns 200

## Performance Optimization

### WebSocket Connection Pooling
- Client uses singleton pattern (one connection per calendar)
- Automatic reconnection with exponential backoff
- Heartbeat ping every 30 seconds

### Database Connection Pooling
```python
# Already configured in backend
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
```

### Redis Session Management
- Sessions stored in Redis for fast access
- Automatic cleanup of expired sessions

## Security Considerations

1. **JWT Tokens**
   - Access token expires in 30 minutes
   - Refresh token expires in 7 days
   - Tokens are validated on every WebSocket message

2. **Calendar Access Control**
   - User must have explicit access to calendar
   - Validated on WebSocket connection
   - Validated on every data change

3. **CORS**
   - Whitelist only specific frontend domains
   - Never use `["*"]` in production

4. **Environment Variables**
   - Never commit `.env` files to Git
   - Use Zeabur's secret management for sensitive values
   - Rotate `SECRET_KEY` regularly

## Support

If issues persist:
1. Check Zeabur service logs (Backend and Frontend)
2. Check browser DevTools Console and Network tab
3. Verify all environment variables are set correctly
4. Review this guide's troubleshooting section
