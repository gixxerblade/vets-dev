import { createHash, randomBytes } from "node:crypto";
import { db } from "@vets-dev/shared/db";
import { users, verificationEvents } from "@vets-dev/shared/db/schema";
import { and, eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";
import { Audit } from "./audit.js";

const VERIFICATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Types
export type VerificationProvider = "mock" | "govx";

export interface VerificationResult {
  readonly requestId: string;
  readonly redirectUrl: string | null;
}

export interface CompletionResult {
  readonly userId: string;
  readonly verified: boolean;
}

export interface PendingVerification {
  readonly userId: string;
  readonly createdAt: Date;
}

// Errors
export class VerificationError extends Data.TaggedError("VerificationError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class VerificationNotFoundError extends Data.TaggedError(
  "VerificationNotFoundError",
)<{
  readonly requestId: string;
}> {}

export class VerificationExpiredError extends Data.TaggedError(
  "VerificationExpiredError",
)<{
  readonly requestId: string;
  readonly expiredAt: Date;
}> {}

export class DuplicateVerificationError extends Data.TaggedError(
  "DuplicateVerificationError",
)<{
  readonly requestId: string;
}> {}

// Service interface
export interface VerificationService {
  readonly startVerification: (
    userId: string,
    provider: VerificationProvider,
  ) => Effect.Effect<VerificationResult, VerificationError, Audit>;

  readonly completeVerification: (
    requestId: string,
    success: boolean,
    providerRef?: string,
    metadata?: Record<string, unknown>,
  ) => Effect.Effect<
    CompletionResult,
    | VerificationError
    | VerificationNotFoundError
    | VerificationExpiredError
    | DuplicateVerificationError,
    Audit
  >;

  readonly getPendingVerification: (
    requestId: string,
  ) => Effect.Effect<
    PendingVerification | null,
    VerificationError | VerificationExpiredError
  >;
}

// Service tag
export class Verification extends Context.Tag("Verification")<
  Verification,
  VerificationService
>() {}

// Helpers
const generateRequestId = (): string => randomBytes(32).toString("hex");

const createIdempotencyKey = (requestId: string, success: boolean): string =>
  createHash("sha256").update(`${requestId}:${success}`).digest("hex");

// Service implementation
const makeVerificationService = (): VerificationService => ({
  startVerification: (userId, provider) =>
    Effect.gen(function* () {
      const requestId = generateRequestId();

      // Create pending verification event
      yield* Effect.tryPromise({
        try: () =>
          db.insert(verificationEvents).values({
            userId,
            provider,
            status: "pending",
            idempotencyKey: requestId,
            metadata: {
              startedAt: new Date().toISOString(),
            },
          }),
        catch: (error) =>
          new VerificationError({
            message: "Failed to create verification event",
            cause: error,
          }),
      });

      // Log audit event (catch and convert AuditLogError to VerificationError)
      const auditService = yield* Audit;
      yield* auditService
        .log({
          userId,
          action: "verify_start",
          metadata: { provider, requestId },
        })
        .pipe(
          Effect.mapError(
            (error) =>
              new VerificationError({
                message: "Failed to log verification start",
                cause: error,
              }),
          ),
        );

      // Mock provider returns no redirect URL (simulation mode)
      // GovX provider would return a redirect URL here
      const redirectUrl = provider === "govx" ? null : null; // TODO: Add GovX integration

      return {
        requestId,
        redirectUrl,
      };
    }),

  completeVerification: (requestId, success, providerRef, metadata = {}) =>
    Effect.gen(function* () {
      const idempotencyKey = createIdempotencyKey(requestId, success);

      // Find pending verification event
      const pendingEvents = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(verificationEvents)
            .where(
              and(
                eq(verificationEvents.idempotencyKey, requestId),
                eq(verificationEvents.status, "pending"),
              ),
            )
            .limit(1),
        catch: (error) =>
          new VerificationError({
            message: "Failed to query verification event",
            cause: error,
          }),
      });

      const pendingEvent = pendingEvents[0];
      if (!pendingEvent) {
        return yield* new VerificationNotFoundError({ requestId });
      }

      // Check if event has expired (5 minutes)
      const createdAt = pendingEvent.createdAt;
      if (!createdAt) {
        return yield* new VerificationError({
          message: "Verification event missing timestamp",
        });
      }

      const now = new Date();
      const elapsed = now.getTime() - createdAt.getTime();
      if (elapsed > VERIFICATION_TIMEOUT_MS) {
        return yield* new VerificationExpiredError({
          requestId,
          expiredAt: new Date(createdAt.getTime() + VERIFICATION_TIMEOUT_MS),
        });
      }

      const userId = pendingEvent.userId;
      if (!userId) {
        return yield* new VerificationError({
          message: "Verification event missing user ID",
        });
      }

      // Check for duplicate completion (idempotency)
      const existingCompletions = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(verificationEvents)
            .where(eq(verificationEvents.idempotencyKey, idempotencyKey))
            .limit(1),
        catch: (error) =>
          new VerificationError({
            message: "Failed to check for duplicate verification",
            cause: error,
          }),
      });

      if (existingCompletions.length > 0) {
        return yield* new DuplicateVerificationError({ requestId });
      }

      // Record completion event
      const status = success ? "success" : "failed";
      yield* Effect.tryPromise({
        try: () =>
          db.insert(verificationEvents).values({
            userId,
            provider: pendingEvent.provider,
            providerRef: providerRef ?? null,
            status,
            idempotencyKey,
            metadata: {
              ...metadata,
              completedAt: now.toISOString(),
            },
          }),
        catch: (error) =>
          new VerificationError({
            message: "Failed to record verification completion",
            cause: error,
          }),
      });

      // Update user record if verification succeeded
      if (success) {
        yield* Effect.tryPromise({
          try: () =>
            db
              .update(users)
              .set({
                verifiedVeteran: true,
                verifiedAt: now,
                updatedAt: now,
              })
              .where(eq(users.id, userId)),
          catch: (error) =>
            new VerificationError({
              message: "Failed to update user verification status",
              cause: error,
            }),
        });

        // Log successful verification (catch and convert AuditLogError)
        const auditService = yield* Audit;
        yield* auditService
          .log({
            userId,
            action: "verify_success",
            metadata: {
              provider: pendingEvent.provider,
              requestId,
              providerRef,
            },
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new VerificationError({
                  message: "Failed to log verification success",
                  cause: error,
                }),
            ),
          );
      } else {
        // Log failed verification (catch and convert AuditLogError)
        const auditService = yield* Audit;
        yield* auditService
          .log({
            userId,
            action: "verify_fail",
            metadata: {
              provider: pendingEvent.provider,
              requestId,
              reason: (metadata as { reason?: string }).reason ?? "unknown",
            },
          })
          .pipe(
            Effect.mapError(
              (error) =>
                new VerificationError({
                  message: "Failed to log verification failure",
                  cause: error,
                }),
            ),
          );
      }

      return {
        userId,
        verified: success,
      };
    }),

  getPendingVerification: (requestId) =>
    Effect.gen(function* () {
      // Find pending verification event
      const pendingEvents = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(verificationEvents)
            .where(
              and(
                eq(verificationEvents.idempotencyKey, requestId),
                eq(verificationEvents.status, "pending"),
              ),
            )
            .limit(1),
        catch: (error) =>
          new VerificationError({
            message: "Failed to query verification event",
            cause: error,
          }),
      });

      const pendingEvent = pendingEvents[0];
      if (!pendingEvent) {
        return null;
      }

      // Check if event has expired
      const createdAt = pendingEvent.createdAt;
      if (!createdAt) {
        return yield* new VerificationError({
          message: "Verification event missing timestamp",
        });
      }

      const now = new Date();
      const elapsed = now.getTime() - createdAt.getTime();
      if (elapsed > VERIFICATION_TIMEOUT_MS) {
        return yield* new VerificationExpiredError({
          requestId,
          expiredAt: new Date(createdAt.getTime() + VERIFICATION_TIMEOUT_MS),
        });
      }

      const userId = pendingEvent.userId;
      if (!userId) {
        return yield* new VerificationError({
          message: "Verification event missing user ID",
        });
      }

      return {
        userId,
        createdAt,
      };
    }),
});

// Layer - Audit service will be accessed within Effects, not at layer construction
export const VerificationLive = Layer.succeed(
  Verification,
  makeVerificationService(),
);
