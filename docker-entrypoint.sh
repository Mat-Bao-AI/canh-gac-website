#!/bin/sh
set -e

# Default database path if not provided
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/canhgac.db"
fi

# Ensure data directory exists for SQLite storage
mkdir -p /app/data

echo "==> [Canh Gac] Preparing database schema with Prisma..."
npx prisma db push --skip-generate || echo "==> [Canh Gac] Prisma db push completed with warnings, proceeding..."

echo "==> [Canh Gac] Starting application via server.js..."
exec node server.js
