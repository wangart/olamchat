FROM oven/bun:1 AS base
WORKDIR /app

# Install deps for both worker and backend (worker imports backend schema)
COPY backend/package.json backend/bun.lock ./backend/
COPY worker/package.json worker/bun.lock ./worker/
RUN cd backend && bun install --frozen-lockfile
RUN cd worker && bun install --frozen-lockfile

# Copy source
COPY backend/ ./backend/
COPY worker/ ./worker/

CMD ["bun", "worker/src/index.ts"]
