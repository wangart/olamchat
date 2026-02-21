# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Olamchat is a real-time chat application with LLM integration using Ollama (qwen3:8b model). It uses a queue-based architecture with SSE token streaming. See `build_plan.md` for the phased implementation roadmap.

## Architecture

Four main layers communicate via the following flow:

1. **Client (Next.js + Zustand)** — Chat UI with optimistic updates, SSE client for streaming tokens
2. **API Server (Fastify)** — REST endpoints, JWT auth, SSE streaming endpoint, BullMQ producer, Redis Pub/Sub subscriber
3. **LLM Worker** — BullMQ consumer, builds prompts from conversation history, streams from Ollama, publishes tokens to Redis Pub/Sub, writes completed responses to DB
4. **Data Layer** — PostgreSQL (messages, conversations), Redis (BullMQ job queue, Pub/Sub channels `stream:{conversationId}`, sessions/cache), Ollama (localhost:11434, OpenAI-compatible API)

**Message flow:** User sends message → API stores in Postgres + enqueues BullMQ job → API opens SSE + subscribes to Redis channel → Worker dequeues, builds prompt, streams from Ollama → Worker publishes tokens to Redis → API relays via SSE to client → Zustand accumulates tokens → On completion, full response saved to Postgres.

See `architecture.mermaid` and `sequence-flow.mermaid` for detailed diagrams.

## Frontend

All commands run from the `frontend/` directory. Uses **Bun** as package manager.

```bash
bun dev        # Dev server on localhost:3000
bun run build  # Production build
bun run lint   # ESLint
```

- Next.js 16 with React 19 (Pages Router), TypeScript 5 (strict, path alias `@/*` → `./src/*`)
- Tailwind CSS v4 via PostCSS, shadcn/ui components, Sonner for toasts
- SWR for server data fetching, Zustand for client/streaming state
- Mutations in `src/lib/api.ts` use `useSWRMutation` with optimistic updates
- API response types mirrored in `src/types/api.ts` — keep in sync with backend schema

## Backend

All commands run from the `backend/` directory. Uses **Bun** as package manager.

```bash
bun dev           # Dev server on localhost:3001 (tsx watch)
bun run build     # TypeScript compile to dist/
bun run db:push   # Push schema directly to DB (use for dev validation)
bun run db:generate  # Generate migration SQL from schema
bun run db:migrate   # Run pending migrations
bun run db:seed      # Seed default data (idempotent)
bun run db:reset     # Migrate + seed in one command
```

- Fastify with `fastify-type-provider-zod` — use Zod schemas directly in route `schema` options
- Drizzle ORM with postgres.js driver, schema files in `src/db/*.ts`
- Schema barrel export in `src/db/schema.ts` — must export all tables, relations, and enums
- Inferred types via `$inferSelect` / `$inferInsert` on table definitions
- Route structure: `routes/` (thin HTTP layer) → `services/` (business logic, no HTTP)
- Fastify request augmentation for auth in `src/types/fastify.d.ts`

## Database

- PostgreSQL on localhost:5432, database `llmapp` (user: postgres, pass: postgres)
- Redis on localhost:6379
- Both run via Docker containers

### Drizzle workflow
1. Edit schema files in `src/db/*.ts`
2. `bun run db:push` to validate against local DB (catches ordering/dependency issues)
3. `bun run db:generate` to create migration SQL (may prompt interactively for renames)
4. `bun run db:migrate` to apply
5. After nuke: `bun run db:reset` (migrate + seed)

### Common gotchas
- `db:generate` can miss `pgEnum` in generated SQL — if it does, use glob `'./src/db/*.ts'` in `drizzle.config.ts` temporarily
- Always create all dependent schema files before generating migrations (e.g., create the models table before adding a FK to it)
- `db:generate` may require interactive input (column rename prompts) — run outside sandboxed environments

## Infrastructure

Docker containers for data stores:
```bash
docker run -d --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17
docker run -d --name redis -p 6379:6379 redis:7
```

## Preferences

- User is learning — explain concepts and trade-offs when asked, guide through steps rather than just implementing
- Test changes before confirming they work (e.g., run build, hit endpoint, verify DB state)
- Use Bun as the package manager for both frontend and backend
- Keep frontend types in `src/types/api.ts` manually synced with backend Drizzle schema
- Prefer Zod for validation (with fastify-type-provider-zod bridge), not raw JSON Schema
- Seed script should be idempotent (use `onConflictDoNothing`)
