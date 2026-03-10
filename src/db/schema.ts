import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestampColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const userRoleEnum = pgEnum("user_role", ["super_admin", "admin", "client"]);
export const movementDirectionEnum = pgEnum("movement_direction", [
  "inflow",
  "outflow",
  "transfer",
]);
export const assetStatusEnum = pgEnum("asset_status", ["pipeline", "active", "exited"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("client"),
    locale: varchar("locale", { length: 5 }).notNull().default("es"),
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    mfaSecretEncrypted: text("mfa_secret_encrypted"),
    mfaEnrolledAt: timestamp("mfa_enrolled_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestampColumns,
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
  }),
);

export const clientProfiles = pgTable(
  "client_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    publicCode: varchar("public_code", { length: 32 }).notNull().unique(),
    riskProfile: varchar("risk_profile", { length: 32 }).notNull(),
    baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("USD"),
    ...timestampColumns,
  },
  (table) => ({
    userIdx: index("idx_client_profiles_user_id").on(table.userId),
  }),
);

export const sectors = pgTable("sectors", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  ...timestampColumns,
});

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    status: assetStatusEnum("status").notNull().default("pipeline"),
    sectorId: uuid("sector_id")
      .notNull()
      .references(() => sectors.id),
    region: varchar("region", { length: 80 }).notNull(),
    summary: text("summary").notNull(),
    irrTarget: numeric("irr_target", { precision: 5, scale: 2 }),
    ticketSizeUsd: integer("ticket_size_usd"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    ...timestampColumns,
  },
  (table) => ({
    sectorIdx: index("idx_assets_sector_id").on(table.sectorId),
    statusIdx: index("idx_assets_status").on(table.status),
  }),
);

export const movements = pgTable(
  "movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientProfileId: uuid("client_profile_id")
      .notNull()
      .references(() => clientProfiles.id),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    direction: movementDirectionEnum("direction").notNull(),
    amountUsd: numeric("amount_usd", { precision: 14, scale: 2 }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    recordedByUserId: uuid("recorded_by_user_id")
      .notNull()
      .references(() => users.id),
    ...timestampColumns,
  },
  (table) => ({
    clientIdx: index("idx_movements_client_profile_id").on(table.clientProfileId),
    assetIdx: index("idx_movements_asset_id").on(table.assetId),
    effectiveAtIdx: index("idx_movements_effective_at").on(table.effectiveAt),
  }),
);

export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientProfileId: uuid("client_profile_id")
      .notNull()
      .references(() => clientProfiles.id),
    snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull(),
    navUsd: numeric("nav_usd", { precision: 14, scale: 2 }).notNull(),
    committedUsd: numeric("committed_usd", { precision: 14, scale: 2 }).notNull(),
    distributedUsd: numeric("distributed_usd", { precision: 14, scale: 2 }).notNull(),
    irrNet: numeric("irr_net", { precision: 5, scale: 2 }),
    multipleNet: numeric("multiple_net", { precision: 6, scale: 2 }),
    ...timestampColumns,
  },
  (table) => ({
    snapshotIdx: index("idx_portfolio_snapshots_client_date").on(
      table.clientProfileId,
      table.snapshotDate,
    ),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }).notNull(),
    entityId: uuid("entity_id"),
    requestId: varchar("request_id", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    ...timestampColumns,
  },
  (table) => ({
    actionIdx: index("idx_audit_logs_action").on(table.action),
    requestIdx: index("idx_audit_logs_request_id").on(table.requestId),
  }),
);
