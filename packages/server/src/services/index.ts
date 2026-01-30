import { Layer } from "effect";
import { type Audit, AuditLive } from "./audit.js";
import { type GitHubOAuth, GitHubOAuthLive } from "./github-oauth.js";
import { type GitHubProfile, GitHubProfileLive } from "./github-profile.js";
import { type Session, SessionLive } from "./session.js";
import { type SSE, SSELive } from "./sse.js";
import { type Users, UsersLive } from "./user-repository.js";
import { type Verification, VerificationLive } from "./verification.js";

// Re-export service interfaces
export type { AuditAction, AuditLogParams, AuditService } from "./audit.js";
// Re-export service tags
// Re-export errors
export { Audit, AuditLogError, getClientInfo } from "./audit.js";
export type { GitHubOAuthService, GitHubUser } from "./github-oauth.js";
export {
  clearStateCookie,
  createStateCookie,
  GitHubOAuth,
  GitHubTokenError,
  GitHubUserFetchError,
  getStateCookie,
} from "./github-oauth.js";
export type { GitHubProfileService, ProfileStats } from "./github-profile.js";
export {
  GitHubProfile,
  GitHubProfileError,
  ProfileNotFoundError,
} from "./github-profile.js";
export type { SessionService, SessionUser } from "./session.js";
// Re-export cookie helpers (pure functions)
export {
  createLogoutCookie,
  createSessionCookie,
  getSessionCookie,
  Session,
  SessionError,
  SessionNotFoundError,
} from "./session.js";
export type { SSEService } from "./sse.js";
export { SSE, SSEError } from "./sse.js";
export type { UserRepository, UserWithProfile } from "./user-repository.js";
export {
  UserNotFoundError,
  UserRepositoryError,
  Users,
} from "./user-repository.js";
export type {
  CompletionResult,
  PendingVerification,
  VerificationProvider,
  VerificationResult,
  VerificationService,
} from "./verification.js";
export {
  DuplicateVerificationError,
  Verification,
  VerificationError,
  VerificationExpiredError,
  VerificationNotFoundError,
} from "./verification.js";

// Combined layer with all services
// SSELive depends on Users, so provide UsersLive to it
const SSEWithDeps = SSELive.pipe(Layer.provide(UsersLive));

export const ServicesLive = Layer.mergeAll(
  AuditLive,
  SessionLive,
  GitHubOAuthLive,
  GitHubProfileLive,
  SSEWithDeps,
  UsersLive,
  VerificationLive,
);

// Type for all services combined
export type Services =
  | Audit
  | Session
  | GitHubOAuth
  | GitHubProfile
  | SSE
  | Users
  | Verification;
