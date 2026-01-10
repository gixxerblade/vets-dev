import { db } from "@vets-dev/shared/db";
import { auditLog } from "@vets-dev/shared/db/schema";
import { Context, Data, Effect, Layer } from "effect";

// Audit action types
export type AuditAction =
  | "login"
  | "logout"
  | "verify_start"
  | "verify_success"
  | "verify_fail"
  | "badge_generated"
  | "session_rotated"
  | "profile_updated";

// Audit log entry params
export interface AuditLogParams {
  readonly userId: string | null;
  readonly action: AuditAction;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
  readonly metadata?: Record<string, unknown>;
}

// Errors
export class AuditLogError extends Data.TaggedError("AuditLogError")<{
  readonly cause: unknown;
}> {}

// Service interface
export interface AuditService {
  readonly log: (params: AuditLogParams) => Effect.Effect<void, AuditLogError>;
}

// Service tag
export class Audit extends Context.Tag("Audit")<Audit, AuditService>() {}

// Service implementation
const makeAuditService = (): AuditService => ({
  log: (params) =>
    Effect.tryPromise({
      try: () =>
        db.insert(auditLog).values({
          userId: params.userId,
          action: params.action,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          metadata: params.metadata ?? {},
        }),
      catch: (error) => new AuditLogError({ cause: error }),
    }).pipe(Effect.asVoid),
});

// Layer
export const AuditLive = Layer.succeed(Audit, makeAuditService());

// Helper to extract client info from request (pure function)
export const getClientInfo = (
  request: Request,
): {
  ipAddress: string | null;
  userAgent: string | null;
} => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() ?? realIp ?? null;
  const userAgent = request.headers.get("user-agent");
  return { ipAddress, userAgent };
};
