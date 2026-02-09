# Plan: Basic UI Structure with shadcn/UI (Phase 1)

## Approach

Set up the frontend foundation: Tailwind CSS v4, shadcn/ui components, React Router v7, TanStack Query, Zustand auth store, and an app shell with sidebar layout. Auth pages (login, register) will be fully functional with the existing backend. All other pages are placeholders.

## What's Included Now vs. Deferred

**Included (unblocks all future work):**
- Tailwind CSS v4 + shadcn/ui (styling foundation)
- React Router v7 (routing)
- TanStack Query (server state — needed for auth `/me` query and all future API calls)
- Zustand (auth store — access token in memory, user state)
- Zod (form validation matching backend schemas)
- HTTP client with auth interceptor (auto-attaches Bearer token, handles 401 refresh)
- App shell with sidebar + header layout
- Functional auth pages: Login, Register, Google OAuth callback
- Placeholder pages: Dashboard, Flight Alerts, Notifications, Settings, Profile, 404

**Deferred:**
- React Hook Form → Phase 2 (flight alert forms)
- i18next → Phase 4 (internationalization)
- Recharts → Phase 3 (price history charts)
- Framer Motion → Phase 4 (animations)
- React Day Picker → Phase 2 (date pickers)

## Dependencies

**Production:** `react-router`, `@tanstack/react-query`, `zustand`, `zod`, `sonner`
**Dev:** `@tailwindcss/vite`, `tailwindcss`
**Auto-installed by shadcn:** `tailwind-merge`, `clsx`, `class-variance-authority`, `lucide-react`, various `@radix-ui/*` primitives

## Folder Structure

```
apps/web/src/
  components/
    ui/                    # shadcn components (auto-generated)
    layout/
      app-layout.tsx       # SidebarProvider + Sidebar + SidebarInset + Header + Outlet
      app-sidebar.tsx      # Sidebar: header (logo), nav items, user footer
      nav-main.tsx         # Dashboard, Alerts, Notifications, Settings nav items
      nav-user.tsx         # User dropdown (profile, logout) in sidebar footer
      app-header.tsx       # SidebarTrigger + Separator + Breadcrumb
  pages/
    auth/
      layout.tsx           # Centered layout for auth pages (no sidebar)
      login.tsx            # Login form with email/password + Google OAuth
      register.tsx         # Register form with name/email/password
      callback.tsx         # Google OAuth callback handler
    dashboard.tsx          # Placeholder
    alerts/
      index.tsx            # Placeholder
    notifications.tsx      # Placeholder
    settings.tsx           # Placeholder
    profile.tsx            # Placeholder
    not-found.tsx          # 404 page
  lib/
    utils.ts               # cn() utility (auto-created by shadcn)
    api-client.ts          # Fetch wrapper with auth interceptor
    query-client.ts        # TanStack Query client config
  hooks/
    use-auth.ts            # Auth hook combining Zustand store + TanStack Query mutations
  stores/
    auth-store.ts          # Zustand store: accessToken, user, setAuth, clearAuth
  routes.tsx               # React Router route definitions
  App.tsx                  # Root: QueryClientProvider + AuthInitializer + RouterProvider + Toaster
  main.tsx                 # Entry point (unchanged)
  index.css                # Tailwind v4 import + shadcn theme vars
```

## Implementation Order

| # | Step | Details |
|---|------|---------|
| 1 | Install Tailwind CSS v4 | `pnpm add -D @tailwindcss/vite tailwindcss` in apps/web. Add `tailwindcss()` plugin to `vite.config.ts`. Replace `index.css` with `@import "tailwindcss"`. |
| 2 | Initialize shadcn/ui | Run `pnpm dlx shadcn@latest init` from apps/web. Creates `components.json` and `src/lib/utils.ts`. |
| 3 | Add shadcn components | `pnpm dlx shadcn@latest add sidebar button card input field label sonner dropdown-menu avatar separator breadcrumb skeleton collapsible` |
| 4 | Install runtime deps | `pnpm add react-router @tanstack/react-query zustand zod sonner` in apps/web |
| 5 | Create auth store | `src/stores/auth-store.ts` — Zustand store with `accessToken`, `user`, `isInitializing`, `setAuth()`, `setAccessToken()`, `clearAuth()`, `setInitialized()` |
| 6 | Create API client | `src/lib/api-client.ts` — Fetch wrapper that attaches Bearer token from auth store, handles 401 by attempting refresh, retries once, clears auth on failure |
| 7 | Create query client | `src/lib/query-client.ts` — TanStack QueryClient with 5min staleTime, retry: 1 |
| 8 | Create auth hook | `src/hooks/use-auth.ts` — Combines Zustand store with TanStack Query: `useQuery` for `/auth/me`, `useMutation` for login/register/logout, `initAuth` for silent refresh on startup |
| 9 | Create layout components | `app-layout.tsx`, `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx`, `app-header.tsx` — Sidebar shell using shadcn sidebar components with React Router `NavLink` for active states |
| 10 | Create auth pages | `layout.tsx` (centered, redirects if authenticated), `login.tsx`, `register.tsx`, `callback.tsx` (reads accessToken from URL params after Google OAuth redirect) |
| 11 | Create placeholder pages | Dashboard, Alerts, Notifications, Settings, Profile, 404 — each with title + skeleton cards |
| 12 | Create routes | `src/routes.tsx` — `createBrowserRouter` with public `/auth/*` routes and protected `/*` routes. `ProtectedRoute` wrapper redirects to login if unauthenticated. |
| 13 | Update App.tsx | Replace with `QueryClientProvider` + `AuthInitializer` (silent refresh on mount) + `RouterProvider` + `Toaster` |
| 14 | Build & verify | `pnpm build` to catch TypeScript errors. Manual test: register → login → navigate sidebar → logout → protected route redirect |

## Key Design Decisions

- **Access token in memory only (Zustand store):** Not stored in localStorage (XSS risk). On page reload, `AuthInitializer` calls `POST /api/auth/refresh` using the HttpOnly cookie to restore the session.
- **`isInitializing` flag in auth store:** Set `true` on startup, `false` after first refresh attempt resolves. `ProtectedRoute` shows a loading spinner until initialization completes, preventing flash of login page.
- **API client auto-refresh:** On 401 response, the client attempts `POST /api/auth/refresh`, updates the store with the new access token, and retries the original request once. If refresh fails, clears auth and the user sees the login page.
- **Auth types duplicated on frontend:** `AuthResponse`, `MeResponse`, `AuthUser` interfaces defined in `src/lib/api-client.ts` matching backend schemas. Will move to `packages/shared` later.
- **React Router v7:** Import everything from `react-router` (not `react-router-dom`). Uses `createBrowserRouter` + `RouterProvider`.
- **Google OAuth callback:** Backend redirects to `/auth/callback?accessToken=xxx`. The callback page reads the token, stores it, fetches `/auth/me`, then navigates to `/`. URL params are cleared after reading.
- **Sidebar navigation:** Uses shadcn's `Sidebar` component with `NavLink` from React Router for active state. Flat navigation (no collapsible sub-menus) for now.

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/vite.config.ts` | Add `@tailwindcss/vite` plugin |
| `apps/web/src/index.css` | Replace with Tailwind v4 import + shadcn theme (done by shadcn init) |
| `apps/web/src/App.tsx` | Rewrite with providers and router |
| `apps/web/package.json` | New dependencies (via pnpm add commands) |

## Verification

1. `pnpm build` passes with no TypeScript errors
2. `pnpm dev` — web app loads at localhost:5173
3. Unauthenticated user is redirected to `/auth/login`
4. Register a new user → redirected to dashboard with sidebar visible
5. Logout → redirected to login page
6. Login → dashboard loads, sidebar shows user name/email
7. Navigate sidebar links (Dashboard, Alerts, Notifications, Settings) → placeholder pages render
8. Refresh the page while logged in → session persists (silent refresh works)
9. Click Google sign-in button → redirects to Google (if OAuth configured)
