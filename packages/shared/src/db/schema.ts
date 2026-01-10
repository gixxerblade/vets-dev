import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  bigint,
  integer,
  jsonb,
  inet,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    githubId: bigint("github_id", { mode: "number" }).unique().notNull(),
    githubUsername: varchar("github_username", { length: 39 }).notNull(),
    avatarUrl: text("avatar_url"),
    verifiedVeteran: boolean("verified_veteran").default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_users_github_username").on(table.githubUsername),
    index("idx_users_verified").on(table.verifiedVeteran),
  ]
);

// Profiles table (1:1 with users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  githubReposCount: integer("github_repos_count").default(0),
  githubStarsCount: integer("github_stars_count").default(0),
  githubLanguages: jsonb("github_languages").$type<string[]>().default([]),
  githubLastActivity: timestamp("github_last_activity", { withTimezone: true }),
  profileCachedAt: timestamp("profile_cached_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Sessions table (PostgreSQL-backed sessions)
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).unique().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_sessions_token").on(table.tokenHash),
    index("idx_sessions_expires").on(table.expiresAt),
  ]
);

// Verification events (immutable audit log)
export const verificationEvents = pgTable(
  "verification_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(), // 'idme', 'sheerid', etc.
    providerRef: varchar("provider_ref", { length: 255 }), // External reference ID
    status: varchar("status", { length: 20 }).notNull(), // 'pending', 'success', 'failed'
    idempotencyKey: varchar("idempotency_key", { length: 64 }).unique(), // Prevent duplicate callbacks
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}), // Non-PII metadata
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_verification_user").on(table.userId),
    uniqueIndex("idx_verification_idempotency").on(table.idempotencyKey),
  ]
);

// Audit log (immutable)
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(), // 'login', 'logout', 'verify_start', etc.
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_audit_user").on(table.userId),
    index("idx_audit_action").on(table.action),
    index("idx_audit_created").on(table.createdAt),
  ]
);

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationEvent = typeof verificationEvents.$inferSelect;
export type NewVerificationEvent = typeof verificationEvents.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
