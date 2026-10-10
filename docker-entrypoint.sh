#!/bin/sh
set -e

# Default database path if not provided
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/canhgac.db"
fi

# Ensure data directory exists for SQLite storage
mkdir -p /app/data

echo "==> [Canh Gac] Preparing database schema with Prisma..."
npx prisma db push --skip-generate

# Function to handle shutdown
cleanup() {
  echo "==> [Canh Gac] Received shutdown signal, stopping processes..."
  if [ -n "$WORKER_PID" ]; then
    kill "$WORKER_PID" 2>/dev/null || true
  fi
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  exit 0
}

trap cleanup INT TERM

echo "==> [Canh Gac] Starting monitoring worker in background..."
npm run worker &
WORKER_PID=$!

echo "==> [Canh Gac] Starting web server on port ${PORT:-3000}..."
npm run start &
SERVER_PID=$!

# Keep container alive and wait for web server
wait "$SERVER_PID"
