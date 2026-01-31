# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Travel Manager is a flight price tracking application for Brazilian travelers. It monitors flight prices and notifies users via WhatsApp, push notifications, and in-app alerts. Built as a fullstack TypeScript monorepo.

## Commands

```bash
# Development (starts both API and web concurrently via Turborepo)
pnpm dev

# Build all packages
pnpm build

# Lint (TypeScript type-checking across all packages)
pnpm lint

# Format code
pnpm format

# Database services
pnpm db:start          # docker compose up -d (PostgreSQL on 5433, Redis on 6379)
pnpm db:stop           # docker compose down

# API-specific (run from apps/api/)
pnpm --filter @travel-manager/api prisma:generate    # Generate Prisma client
pnpm --filter @travel-manager/api prisma:migrate     # Run migrations
pnpm --filter @travel-manager/api prisma:push        # Push schema to DB
pnpm --filter @travel-manager/api prisma:studio      # Open Prisma Studio GUI

# Run a single workspace
pnpm --filter @travel-manager/api dev
pnpm --filter @travel-manager/web dev
```

## Architecture

**Monorepo:** Turborepo + pnpm workspaces (Node 20)

- `apps/api` — Fastify 5 backend, Prisma 7 ORM with PostgreSQL adapter (`@prisma/adapter-pg` + `pg` pool). Entry point: `src/index.ts`. Dev server runs on port 3000 via `tsx watch`.
- `apps/web` — React 18 + Vite 6 frontend. Dev server on port 5173 with `/api/*` proxy to the backend. Path alias: `@/` → `./src/`.
- `packages/shared` — Shared TypeScript types and utility functions (e.g., `formatCurrency`, `formatDate`). Compiled to `dist/` and consumed by both apps.

**Database:** PostgreSQL 16 (Docker, mapped to host port **5433** to avoid conflicts). Prisma schema at `apps/api/prisma/schema.prisma` defines 8 models: User, Account, UserSettings, FlightAlert, PriceRecord, Notification, Purchase, plus enums for Language, TripType, DayShift, CheckFrequency, AlertStatus, NotificationChannel.

**Prisma 7.x requires a driver adapter** — the client is initialized in `apps/api/src/lib/prisma.ts` using `PrismaPg` adapter with a `pg.Pool`. Do not use the `prisma-client` generator; use `prisma-client-js`.

**Cache/Queue:** Redis 7 (Docker, port 6379). Reserved for BullMQ job scheduling (not yet implemented).

## Key Patterns

- All packages use ESM (`"type": "module"`). Use `.js` extensions in relative imports within compiled code.
- The web app build runs `tsc --noEmit` (type-check only) then `vite build`. The API build runs `prisma generate` then `tsc`.
- Environment variables live in `apps/api/.env` (not committed). See `.env.example` at the repo root for the template.
- The Vite dev server proxies `/api/*` requests to the backend, so the frontend can call API routes without CORS issues in development.

## PRD Reference

`PRD.md` at the repo root contains the full product requirements document including API endpoint specifications, database rationale, and a phased implementation roadmap. Consult it for feature requirements and architectural decisions.
