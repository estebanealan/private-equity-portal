BEGIN;

INSERT INTO users (
  id,
  email,
  full_name,
  password_hash,
  role,
  locale,
  mfa_enabled,
  mfa_secret_encrypted,
  mfa_enrolled_at,
  last_login_at,
  deleted_at
)
VALUES
  (
    '11111111-1111-7111-8111-111111111111',
    'admin@aurelia.test',
    'Elena Vargas',
    '$2b$12$KVAwXdFvwRJEr8OAILIi.OJanaMhKHxgUa2/iCeZAIoOB0gmeQJVy',
    'admin',
    'es',
    false,
    NULL,
    NULL,
    NULL,
    NULL
  ),
  (
    '22222222-2222-7222-8222-222222222222',
    'client@aurelia.test',
    'Martin Keller',
    '$2b$12$ZOwC/WL2r.0kLQf.fEz6neBnZNuPi9mG6HVOtTuHvMoKfatQs3XO6',
    'client',
    'es',
    false,
    NULL,
    NULL,
    NULL,
    NULL
  )
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  locale = EXCLUDED.locale,
  deleted_at = NULL,
  updated_at = now();

INSERT INTO client_profiles (
  id,
  user_id,
  public_code,
  risk_profile,
  base_currency
)
VALUES (
  '33333333-3333-7333-8333-333333333333',
  '22222222-2222-7222-8222-222222222222',
  'AK-014',
  'balanced',
  'USD'
)
ON CONFLICT (public_code) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  risk_profile = EXCLUDED.risk_profile,
  base_currency = EXCLUDED.base_currency,
  updated_at = now();

INSERT INTO sectors (
  id,
  slug,
  name,
  description
)
VALUES
  (
    '44444444-4444-7444-8444-444444444441',
    'energy-transition',
    'Energy',
    'Long-term infrastructure and energy transition strategies.'
  ),
  (
    '44444444-4444-7444-8444-444444444442',
    'core-infrastructure',
    'Infrastructure',
    'Core and value-add infrastructure across strategic regions.'
  ),
  (
    '44444444-4444-7444-8444-444444444443',
    'logistics-growth',
    'Logistics',
    'Logistics and supply chain growth opportunities.'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO assets (
  id,
  slug,
  name,
  status,
  sector_id,
  region,
  summary,
  irr_target,
  ticket_size_usd,
  metadata
)
VALUES
  (
    '55555555-5555-7555-8555-555555555551',
    'northwind-energy-i',
    'Northwind Energy I',
    'active',
    '44444444-4444-7444-8444-444444444441',
    'Europe',
    'Operational renewable platform with contracted cash flows.',
    14.50,
    3000000,
    '{"vintage": 2024, "currency": "USD"}'::jsonb
  ),
  (
    '55555555-5555-7555-8555-555555555552',
    'pacific-infrastructure-ii',
    'Pacific Infrastructure II',
    'active',
    '44444444-4444-7444-8444-444444444442',
    'LatAm',
    'Diversified core infrastructure vehicle with inflation linkage.',
    13.10,
    2500000,
    '{"vintage": 2023, "currency": "USD"}'::jsonb
  ),
  (
    '55555555-5555-7555-8555-555555555553',
    'atlas-logistics-growth',
    'Atlas Logistics Growth',
    'active',
    '44444444-4444-7444-8444-444444444443',
    'North America',
    'Middle-market logistics scale-up with digital optimization.',
    15.20,
    1800000,
    '{"vintage": 2025, "currency": "USD"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  sector_id = EXCLUDED.sector_id,
  region = EXCLUDED.region,
  summary = EXCLUDED.summary,
  irr_target = EXCLUDED.irr_target,
  ticket_size_usd = EXCLUDED.ticket_size_usd,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO movements (
  id,
  client_profile_id,
  asset_id,
  direction,
  amount_usd,
  effective_at,
  notes,
  recorded_by_user_id
)
VALUES
  (
    '66666666-6666-7666-8666-666666666661',
    '33333333-3333-7333-8333-333333333333',
    '55555555-5555-7555-8555-555555555551',
    'inflow',
    3500000,
    '2026-02-12T15:00:00.000Z'::timestamptz,
    'Capital call settled',
    '11111111-1111-7111-8111-111111111111'
  ),
  (
    '66666666-6666-7666-8666-666666666662',
    '33333333-3333-7333-8333-333333333333',
    '55555555-5555-7555-8555-555555555552',
    'inflow',
    2500000,
    '2026-01-08T15:00:00.000Z'::timestamptz,
    'Commitment deployment',
    '11111111-1111-7111-8111-111111111111'
  ),
  (
    '66666666-6666-7666-8666-666666666663',
    '33333333-3333-7333-8333-333333333333',
    '55555555-5555-7555-8555-555555555553',
    'outflow',
    900000,
    '2026-03-03T15:00:00.000Z'::timestamptz,
    'Distribution',
    '11111111-1111-7111-8111-111111111111'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO portfolio_snapshots (
  id,
  client_profile_id,
  snapshot_date,
  nav_usd,
  committed_usd,
  distributed_usd,
  irr_net,
  multiple_net
)
VALUES (
  '77777777-7777-7777-8777-777777777771',
  '33333333-3333-7333-8333-333333333333',
  '2026-03-01T00:00:00.000Z'::timestamptz,
  18400000,
  22000000,
  3100000,
  14.80,
  1.42
)
ON CONFLICT (id) DO UPDATE
SET
  nav_usd = EXCLUDED.nav_usd,
  committed_usd = EXCLUDED.committed_usd,
  distributed_usd = EXCLUDED.distributed_usd,
  irr_net = EXCLUDED.irr_net,
  multiple_net = EXCLUDED.multiple_net,
  updated_at = now();

COMMIT;
