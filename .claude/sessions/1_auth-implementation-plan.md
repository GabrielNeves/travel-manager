# Plan: Authentication (Phase 1, Step 3)

## Approach

Fastify-native auth using `@fastify/jwt` + `@fastify/cookie` with direct Google OAuth2 via `fetch()`. No Passport.js.

- **Access token:** JWT (15min), returned in response body, sent via `Authorization: Bearer` header
- **Refresh token:** JWT (7 days), stored as HttpOnly cookie scoped to `/api/auth`
- **Email verification:** Stubbed (flag set to `false` on register, `true` for Google users). Full email flow deferred.

## New Dependencies (apps/api)

```
@fastify/jwt @fastify/cookie bcryptjs zod fastify-plugin
```

## Environment Variables to Add

```env
JWT_SECRET=<random-64-char>
JWT_REFRESH_SECRET=<different-random-64-char>
GOOGLE_CLIENT_ID=<from GCP>
GOOGLE_CLIENT_SECRET=<from GCP>
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

## Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/lib/env.ts` | Zod-validated env config. All files import `env` instead of `process.env`. |
| `apps/api/src/lib/jwt.plugin.ts` | Fastify plugin registering `@fastify/cookie` + `@fastify/jwt`. Adds `request.jwtVerify()` and `reply.jwtSign()`. Uses `fastify-plugin` wrapper for encapsulation. |
| `apps/api/src/lib/auth-guard.ts` | `authGuard` preHandler that calls `request.jwtVerify()` and returns 401 on failure. |
| `apps/api/src/modules/auth/auth.schemas.ts` | Zod schemas for `register` (email, password, name) and `login` (email, password). Exported types. |
| `apps/api/src/modules/auth/auth.google.ts` | Three functions: `buildGoogleAuthUrl()`, `exchangeGoogleCode(code)`, `getGoogleProfile(accessToken)`. Pure `fetch()`, no dependencies. |
| `apps/api/src/modules/auth/auth.service.ts` | Business logic: `registerUser`, `loginUser`, `handleGoogleCallback`, `refreshAccessToken`, `getCurrentUser`, `generateTokens`. |
| `apps/api/src/modules/auth/auth.routes.ts` | Route handlers for all 7 endpoints (see below). Sets refresh token cookie on login/register/refresh. |
| `apps/api/src/modules/auth/auth.plugin.ts` | Entry point plugin: registers `auth.routes.ts` under `/api/auth` prefix. |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/index.ts` | Import and register `jwtPlugin` + `authPlugin`. Add `credentials: true` to CORS. Use `env` instead of `process.env`. |
| `apps/api/.env` | Add 5 auth env vars with generated secrets. |
| `.env.example` | Uncomment and document auth env vars. |

## API Endpoints

```
POST /api/auth/register          — Email/password signup → 201 { accessToken, user }
POST /api/auth/login             — Email/password login → 200 { accessToken, user }
GET  /api/auth/google            — Redirect to Google consent screen
GET  /api/auth/google/callback   — Exchange code → redirect to frontend with accessToken param
POST /api/auth/refresh           — Read refresh cookie → 200 { accessToken } (token rotation)
POST /api/auth/logout            — Clear refresh cookie → 200
GET  /api/auth/me                — Protected. Returns current user profile.
```

Google callback redirects to `{CORS_ORIGIN}/auth/callback?accessToken=xxx`. The frontend reads the token from the URL and stores it.

## Implementation Order

1. Install dependencies
2. Update `.env` and `.env.example` with auth vars
3. Create `lib/env.ts` (env validation)
4. Create `lib/jwt.plugin.ts` (JWT + cookie setup)
5. Create `lib/auth-guard.ts` (route protection)
6. Create `modules/auth/auth.schemas.ts` (validation)
7. Create `modules/auth/auth.google.ts` (OAuth helpers)
8. Create `modules/auth/auth.service.ts` (business logic)
9. Create `modules/auth/auth.routes.ts` (route handlers)
10. Create `modules/auth/auth.plugin.ts` (module entry)
11. Modify `index.ts` (register plugins, update CORS)

## Key Design Decisions

- **Single JWT instance, two secrets:** `@fastify/jwt` registered once with `JWT_SECRET`. Refresh tokens signed/verified using the `key` override parameter with `JWT_REFRESH_SECRET`.
- **Google callback → frontend redirect:** OAuth is a browser redirect flow, so the callback redirects to the frontend with the access token as a query param.
- **Cookie path `/api/auth`:** Refresh cookie only sent to auth endpoints, not all API calls.
- **`sameSite: 'lax'`:** Required for Google OAuth cross-site redirect.
- **Error convention:** Throw `Object.assign(new Error('msg'), { statusCode: N })` — Fastify respects `statusCode` automatically.
- **Account linking:** Google login with an existing email auto-links the Google account to that user.

## Verification

```bash
# Register
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"mypassword123","name":"Test User"}' \
  -c cookies.txt

# Login
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"mypassword123"}' \
  -c cookies.txt

# Get current user (protected)
curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh token
curl -s -X POST http://localhost:3000/api/auth/refresh -b cookies.txt

# Logout
curl -s -X POST http://localhost:3000/api/auth/logout -b cookies.txt

# Google OAuth (open in browser)
# http://localhost:3000/api/auth/google
```
