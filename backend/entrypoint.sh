#!/bin/sh
set -e

# Wait for Postgres to be ready (retry migrations until they succeed)
echo "Waiting for database..."
until bun run db:migrate 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done

echo "Running seed..."
bun run db:seed

echo "Starting server..."
exec node dist/src/index.js
