# Full-Stack LLM App — Build Plan

## Project Structure

```
olamchat/
├── docker-compose.yml          # Postgres, Redis (infra only)
│
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   └── signup/
│   ├── components/
│   │   ├── Chat.tsx            # Main chat view
│   │   ├── Sidebar.tsx         # Conversation list
│   │   ├── MessageBubble.tsx   # Single message display
│   │   └── SettingsPanel.tsx   # Model, temperature, system prompt
│   ├── hooks/
│   │   ├── api.ts              # SWR hooks (server data)
│   │   └── useStream.ts        # SSE streaming
│   ├── store/
│   │   └── chat.ts             # Zustand (client + streaming state)
│   ├── lib/
│   │   └── api.ts              # Mutation functions (POST, DELETE)
│   └── package.json
│
├── server/                     # Fastify API
│   ├── src/
│   │   ├── index.ts            # Entry point — starts the server
│   │   ├── app.ts              # App factory — builds Fastify instance
│   │   ├── config.ts           # Environment config
│   │   ├── plugins/            # Infrastructure wiring
│   │   │   ├── db.ts           # Drizzle + Postgres connection
│   │   │   ├── redis.ts        # Redis client
│   │   │   ├── auth.ts         # JWT verification decorator
│   │   │   └── cors.ts         # CORS config
│   │   ├── routes/             # Thin HTTP layer — validate, delegate, respond
│   │   │   ├── auth.ts
│   │   │   ├── conversations.ts
│   │   │   ├── messages.ts
│   │   │   ├── stream.ts       # SSE endpoint
│   │   │   └── models.ts
│   │   ├── services/           # Business logic — no HTTP, no Fastify
│   │   │   ├── conversation.service.ts
│   │   │   ├── message.service.ts
│   │   │   └── auth.service.ts
│   │   ├── lib/                # Shared utilities
│   │   │   ├── queue.ts        # BullMQ queue setup
│   │   │   ├── errors.ts       # Custom error classes
│   │   │   └── types.ts        # Shared TypeScript types
│   │   └── db/
│   │       ├── schema.ts       # Drizzle schema (tables, relations, indexes)
│   │       ├── index.ts        # DB connection export
│   │       └── migrations/
│   ├── drizzle.config.ts
│   └── package.json
│
├── worker/                     # LLM worker process
│   ├── src/
│   │   ├── index.ts            # Worker entry point
│   │   ├── processor.ts        # Job processing logic
│   │   └── ollama.ts           # Ollama HTTP client + streaming
│   └── package.json
│
└── README.md
```

**Architecture**: Routes → Services → DB. Routes are thin (HTTP only),
services hold logic (no HTTP), DB schema is structural (no logic).
Frontend state: SWR for server data, Zustand for streaming + client state.

---

## Phase 1 — Proof of Life
- [ ] Install Ollama, pull model, verify `curl` to `/v1/chat/completions` works
- [ ] Scaffold Next.js app with TypeScript
- [ ] Build minimal chat UI — message list + input box, hardcoded messages
- [ ] Set up Zustand store with `messages`, `sendMessage`, wire input to store

## Phase 2 — Backend Foundation
- [ ] Scaffold Fastify/Express server, health check endpoint
- [ ] Set up Postgres + Prisma/Drizzle — `users`, `conversations`, `messages` tables
- [ ] Build REST endpoints: `POST /conversations`, `GET /conversations`, `GET /conversations/:id/messages`
- [ ] Connect frontend to backend — load conversations, display in sidebar

## Phase 3 — Inference Pipeline
- [ ] Install Redis, set up BullMQ with `inference` queue
- [ ] `POST /conversations/:id/messages` — save user message, enqueue job
- [ ] Write worker: pull from queue → call Ollama (non-streaming) → save response to Postgres
- [ ] Test full loop: send message → worker processes → refresh → see response

## Phase 4 — Streaming
- [ ] Add SSE endpoint: `GET /conversations/:id/stream` subscribing to Redis Pub/Sub
- [ ] Modify worker to stream from Ollama, publish each token to Redis Pub/Sub
- [ ] Frontend consumes SSE via `EventSource` or `fetch` readable stream
- [ ] Add `streamingContent` + `isStreaming` to Zustand, render tokens live
- [ ] On stream finish: worker saves to Postgres, frontend moves streaming content into messages array

## Phase 5 — Auth
- [ ] Signup/login endpoints, bcrypt passwords, JWT tokens
- [ ] Auth middleware on API routes
- [ ] Login/signup pages on frontend, token storage, attach to requests
- [ ] Scope conversations to authenticated user

## Phase 6 — Polish & Features
- [ ] Auto-generate conversation titles
- [ ] Model selection dropdown in UI
- [ ] Settings panel: system prompt, temperature, max tokens
- [ ] Error handling: Ollama down, worker crash mid-stream, send while streaming
- [ ] Stop generation button

## Phase 7 — Production Concerns (Optional)
- [ ] Swap Ollama for vLLM, verify nothing breaks
- [ ] Rate limiting with Redis
- [ ] Multiple workers, observe job distribution
- [ ] Dockerize everything in `docker-compose.yml`
