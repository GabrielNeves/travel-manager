# Plan: User Settings & Profile Pages (Phase 1 Final Step)

## Overview

Build functional Settings and Profile pages, replacing the current skeleton placeholders. This requires new backend API endpoints (settings CRUD + profile update) and two frontend pages with forms.

## Scope

- **Profile page** → User model fields: name, phone, language, country, timezone (email read-only)
- **Settings page** → UserSettings model fields: notification channels, historical low alerts, default check frequency

## API Design

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/settings` | Get user's notification & alert settings |
| `PUT` | `/api/settings` | Update settings (partial) |
| `PATCH` | `/api/auth/me` | Update profile fields (partial) |

**`PUT /api/settings` body:**
```json
{ "notifyInApp?": true, "notifyWhatsApp?": false, "notifyPush?": false,
  "notifyOnHistoricalLow?": true, "defaultCheckFrequency?": "HOURS_6" }
```

**`PATCH /api/auth/me` body:**
```json
{ "name?": "string", "phone?": "string|null", "language?": "PT_BR|EN_US",
  "country?": "string", "timezone?": "string" }
```

## Files to Create

| File | Description |
|------|-------------|
| `apps/api/src/modules/settings/settings.schemas.ts` | Zod validation for settings update |
| `apps/api/src/modules/settings/settings.service.ts` | Prisma get/update UserSettings |
| `apps/api/src/modules/settings/settings.routes.ts` | GET + PUT `/api/settings` |
| `apps/api/src/modules/settings/settings.plugin.ts` | Fastify plugin registration |
| `apps/web/src/hooks/use-settings.ts` | TanStack Query hooks: `useSettings()` + `useProfile()` |

## Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Register `settingsPlugin` |
| `apps/api/src/modules/auth/auth.schemas.ts` | Add `updateProfileSchema` |
| `apps/api/src/modules/auth/auth.service.ts` | Add `updateProfile()` function |
| `apps/api/src/modules/auth/auth.routes.ts` | Add `PATCH /me` route |
| `apps/web/src/pages/settings.tsx` | Replace skeleton → functional settings form |
| `apps/web/src/pages/profile.tsx` | Replace skeleton → functional profile form |

## Implementation Steps

### Step 1: Install shadcn components
```bash
cd apps/web && pnpm dlx shadcn@latest add switch select -y
```
Adds `Switch` (notification toggles) and `Select` (dropdowns for language, timezone, frequency).

### Step 2: Backend — Settings module (4 new files)
1. `settings.schemas.ts` — Zod schema with `updateSettingsSchema` (all fields optional booleans/enum)
2. `settings.service.ts` — `getUserSettings(userId)` and `updateUserSettings(userId, input)` using Prisma
3. `settings.routes.ts` — Protected routes with `authGuard`, Zod validation via `safeParse()`
4. `settings.plugin.ts` — Registers routes with prefix `/api/settings`

### Step 3: Backend — Profile update (modify 3 existing files)
1. `auth.schemas.ts` — Add `updateProfileSchema` (name, phone, language enum, country, timezone)
2. `auth.service.ts` — Add `updateProfile(userId, input)` with Prisma user update
3. `auth.routes.ts` — Add `PATCH /me` protected route after existing `GET /me`

### Step 4: Backend — Register settings plugin
Add `import settingsPlugin` and `fastify.register(settingsPlugin)` to `apps/api/src/index.ts`.

### Step 5: Frontend — Data hooks
Create `apps/web/src/hooks/use-settings.ts`:
- `useSettings()` — `useQuery` for GET, `useMutation` for PUT `/api/settings`
- `useProfile()` — `useQuery` for GET `/auth/me`, `useMutation` for PATCH `/auth/me`

### Step 6: Frontend — Settings page
Replace placeholder with two Card sections:
- **Notification Preferences** — 4 Switch toggles (in-app, WhatsApp, push, historical low). Save-on-change pattern (each toggle fires PUT immediately with toast feedback).
- **Default Alert Settings** — Select dropdown for check frequency. Save-on-change.
- Show Skeleton while loading, toast on success/error.

### Step 7: Frontend — Profile page
Replace placeholder with two Card sections:
- **Personal Information** — Email (read-only Input), Name (Input), WhatsApp Number (Input)
- **Regional Settings** — Language (Select: PT_BR/EN_US), Country (Select: BR + common options), Timezone (Select: Brazilian timezones)
- Traditional form with "Save Changes" submit button, Zod validation, field-level errors.
- Pre-fill with data from `useProfile()` query. Also update the Zustand auth store user name after profile save so the sidebar reflects changes immediately.

### Step 8: Build & verify
`pnpm build` — zero TypeScript errors across all packages.

## UX Decisions

- **Settings: save-on-change** — Toggles and selects save immediately (no submit button). Standard for boolean preferences.
- **Profile: submit button** — Text fields need review before committing. Uses "Save Changes" button with loading state.
- **Profile updates Zustand store** — After PATCH succeeds, update `useAuthStore` user name so sidebar `NavUser` reflects the change without reload.

## Verification

1. `pnpm build` passes with zero errors
2. Navigate to `/settings` — loads current settings from API, no skeletons
3. Toggle "WhatsApp Notifications" on → toast "Settings updated" → refresh → toggle persists
4. Change frequency to "Every 3 hours" → saves immediately → persists
5. Navigate to `/profile` — form pre-fills with user data from `/auth/me`
6. Email field is read-only
7. Change name → click "Save Changes" → toast "Profile updated" → sidebar shows new name
8. Submit with empty name → field-level error appears
9. Change language to "English (US)" → save → persists across refresh
10. All endpoints return 401 without valid Bearer token
