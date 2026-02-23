FROM oven/bun:1 AS base
WORKDIR /app

# Install deps (cached layer)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

EXPOSE 3001

# Migrate, seed, then start
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
