param()

$ErrorActionPreference = "Stop"

Write-Host "Installing dependencies with pnpm..." -ForegroundColor Cyan
pnpm.cmd install

Write-Host "Starting local services..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Done. Copy .env.example to .env.local and run pnpm dev" -ForegroundColor Green
