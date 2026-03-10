# Private Equity Portal

> Plataforma corporativa multilenguaje para private equity con sitio publico, panel administrativo y dashboard de clientes.

## Stack

| Layer | Technology | Hosting |
| --- | --- | --- |
| Frontend | Next.js App Router | Vercel |
| Backend | Hono + Route Handlers | Vercel |
| Database | PostgreSQL 16 | Railway |
| Cache | Redis 7 | Railway |
| Assets | Cloudflare R2 | Cloudflare |
| CDN / WAF | Cloudflare | Cloudflare |

## Product Surfaces

- Public site for firm, sectors, assets, and trust content.
- Admin dashboard for internal operations and movement registration.
- Client portal for interactive investment visibility.

## Local Development

```bash
cp .env.example .env.local
docker compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Staging Deploy

- Runbook completo: `docs/deploy/staging-runbook.md`
- Validación de variables antes de deploy:

```bash
pnpm deploy:staging:check
```

- Health endpoint para readiness/liveness:

```text
/health
```

## Key Decisions

- Spanish-first i18n with English and German from day one.
- Banking-grade hardening path: MFA, role separation, audit logs, strict sessions.
- One product surface with separated protected areas to avoid fragmented UX.

## Current Scope

This scaffold includes:

- App Router structure
- i18n foundations
- design tokens and shared styles
- Drizzle schema + migrations + development seed
- security and environment utilities
- public/admin/client entry pages
