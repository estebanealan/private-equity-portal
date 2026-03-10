# Staging Deploy Runbook

## 1. Objetivo

Levantar un entorno de `staging` con:

- Frontend + server routes en Vercel
- PostgreSQL + Redis en Railway
- DNS, CDN y WAF en Cloudflare

## 2. Prerrequisitos

- Dominio gestionado en Cloudflare
- Proyecto conectado en Vercel
- Proyecto con PostgreSQL (y opcional Redis) en Railway
- Variables de entorno listas

## 3. Variables de entorno

Variables mínimas para staging:

- `APP_URL`
- `DATABASE_URL`
- `AUTH_SECRET`
- `MFA_ENCRYPTION_KEY`

Recomendadas:

- `REDIS_URL`
- `MFA_ISSUER`
- `SENTRY_DSN`
- `R2_PUBLIC_BASE_URL`

Validar localmente con:

```bash
pnpm deploy:staging:check
```

## 4. Railway (data layer)

1. Crear servicio PostgreSQL (y Redis si aplica).
2. Copiar `DATABASE_URL` (y `REDIS_URL`) al entorno staging de Vercel.
3. Ejecutar migraciones contra la base de staging:

```bash
pnpm db:migrate
```

4. (Opcional) Cargar seed de staging:

```bash
pnpm db:seed
```

## 5. Vercel (app)

1. Crear proyecto desde este repo.
2. Configurar rama de staging (recomendado: `develop`).
3. Definir variables de entorno de staging en Vercel.
4. Verificar que `APP_URL` apunta al dominio final de staging.
5. Hacer deploy de la rama de staging.

Notas:

- `vercel.json` ya define headers de seguridad base y `no-store` para `/api/*`.
- Health endpoint disponible en `/health`.

## 6. Cloudflare (edge + seguridad)

### DNS

- Crear `CNAME` `staging` -> `<tu-proyecto>.vercel-dns.com`
- Proxy habilitado (nube naranja)

### SSL/TLS

- Mode: `Full (strict)`
- Minimum TLS: `1.3`
- HSTS: habilitado

### WAF mínimo recomendado

- Rate limit `10 req/min` para login/MFA
- Rate limit `100 req/min` para `/api/*`
- Challenge para tráfico automatizado sospechoso

### Cache rules

- `Cache bypass` para `/api/*`
- Cache largo para assets estáticos con hash

## 7. Smoke tests de staging

1. `GET /health` responde 200
2. Login admin -> setup/verificación MFA
3. Alta de movimiento en admin
4. Movimiento visible en dashboard cliente
5. Logout y bloqueo de rutas protegidas sin sesión

## 8. Rollback rápido

- Vercel: promover deployment previo
- Railway: rollback de deployment (si aplica) y/o restore de backup
- Cloudflare: pausar regla problemática o apuntar temporalmente a maintenance
