CREATE TYPE "public"."asset_status" AS ENUM('pipeline', 'active', 'exited');--> statement-breakpoint
CREATE TYPE "public"."movement_direction" AS ENUM('inflow', 'outflow', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'client');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" "asset_status" DEFAULT 'pipeline' NOT NULL,
	"sector_id" uuid NOT NULL,
	"region" varchar(80) NOT NULL,
	"summary" text NOT NULL,
	"irr_target" numeric(5, 2),
	"ticket_size_usd" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" uuid,
	"request_id" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"public_code" varchar(32) NOT NULL,
	"risk_profile" varchar(32) NOT NULL,
	"base_currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_profiles_public_code_unique" UNIQUE("public_code")
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_profile_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"direction" "movement_direction" NOT NULL,
	"amount_usd" numeric(14, 2) NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"notes" text,
	"recorded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_profile_id" uuid NOT NULL,
	"snapshot_date" timestamp with time zone NOT NULL,
	"nav_usd" numeric(14, 2) NOT NULL,
	"committed_usd" numeric(14, 2) NOT NULL,
	"distributed_usd" numeric(14, 2) NOT NULL,
	"irr_net" numeric(5, 2),
	"multiple_net" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sectors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'client' NOT NULL,
	"locale" varchar(5) DEFAULT 'es' NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret_encrypted" text,
	"mfa_enrolled_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_client_profile_id_client_profiles_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_client_profile_id_client_profiles_id_fk" FOREIGN KEY ("client_profile_id") REFERENCES "public"."client_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assets_sector_id" ON "assets" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "idx_assets_status" ON "assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_request_id" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_client_profiles_user_id" ON "client_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_movements_client_profile_id" ON "movements" USING btree ("client_profile_id");--> statement-breakpoint
CREATE INDEX "idx_movements_asset_id" ON "movements" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_movements_effective_at" ON "movements" USING btree ("effective_at");--> statement-breakpoint
CREATE INDEX "idx_portfolio_snapshots_client_date" ON "portfolio_snapshots" USING btree ("client_profile_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");