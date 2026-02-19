# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Olamchat is a real-time chat application with LLM integration using Ollama (qwen3:8b model). It uses a queue-based architecture with SSE token streaming.

## Architecture

Four main layers communicate via the following flow:

1. **Client (Next.js + Zustand)** — Chat UI with optimistic updates, SSE client for streaming tokens
2. **API Server (Fastify)** — REST endpoints, JWT auth, SSE streaming endpoint, BullMQ producer, Redis Pub/Sub subscriber
3. **LLM Worker** — BullMQ consumer, builds prompts from conversation history, streams from Ollama, publishes tokens to Redis Pub/Sub, writes completed responses to DB
4. **Data Layer** — PostgreSQL (messages, conversations), Redis (BullMQ job queue, Pub/Sub channels `stream:{conversationId}`, sessions/cache), Ollama (localhost:11434, OpenAI-compatible API)

**Message flow:** User sends message → API stores in Postgres + enqueues BullMQ job → API opens SSE + subscribes to Redis channel → Worker dequeues, builds prompt, streams from Ollama → Worker publishes tokens to Redis → API relays via SSE to client → Zustand accumulates tokens → On completion, full response saved to Postgres.

See `architecture.mermaid` and `sequence-flow.mermaid` for detailed diagrams.

## Current State

The frontend is scaffolded with Next.js boilerplate. The `backend/` and `model/` directories are empty placeholders awaiting implementation.

## Frontend Commands

All commands run from the `frontend/` directory. Uses **Bun** as package manager (`bun.lock`).

```bash
bun dev        # Dev server on localhost:3000
bun run build  # Production build
bun run start  # Production server
bun run lint   # ESLint
```

## Frontend Tech Stack

- Next.js 16 with React 19 (Pages Router)
- TypeScript 5 (strict mode, path alias `@/*` → `./src/*`)
- Tailwind CSS v4 via PostCSS
- Geist font from Vercel
