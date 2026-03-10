#!/bin/bash
set -euo pipefail

echo "Installing dependencies with pnpm..."
pnpm install

echo "Starting local services..."
docker compose up -d

echo "Done. Copy .env.example to .env.local and run pnpm dev"
