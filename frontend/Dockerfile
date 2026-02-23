FROM oven/bun:1 AS base
WORKDIR /app

# Install deps (cached layer)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# NEXT_PUBLIC_ vars must be available at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
