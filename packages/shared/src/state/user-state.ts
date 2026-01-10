import { Effect, Data } from "effect";

// User state types
export type UserState =
  | { readonly _tag: "Unauthenticated" }
  | { readonly _tag: "Authenticated"; readonly userId: string; readonly verified: false }
  | { readonly _tag: "VerificationPending"; readonly userId: string; readonly requestId: string }
  | { readonly _tag: "Verified"; readonly userId: string; readonly verifiedAt: Date };

// State constructors
export const Unauthenticated: UserState = { _tag: "Unauthenticated" };

export const Authenticated = (userId: string): UserState => ({
  _tag: "Authenticated",
  userId,
  verified: false,
});

export const VerificationPending = (userId: string, requestId: string): UserState => ({
  _tag: "VerificationPending",
  userId,
  requestId,
});

export const Verified = (userId: string, verifiedAt: Date): UserState => ({
  _tag: "Verified",
  userId,
  verifiedAt,
});

// Transition events
export type StateEvent =
  | { readonly _tag: "GithubLogin"; readonly userId: string }
  | { readonly _tag: "StartVerify"; readonly requestId: string }
  | { readonly _tag: "VerifySuccess"; readonly verifiedAt: Date }
  | { readonly _tag: "VerifyFail"; readonly reason: string }
  | { readonly _tag: "Logout" };

// Errors
export class InvalidTransitionError extends Data.TaggedError("InvalidTransitionError")<{
  readonly from: UserState["_tag"];
  readonly event: StateEvent["_tag"];
}> {}

// State machine transition function
export const transition = (
  state: UserState,
  event: StateEvent
): Effect.Effect<UserState, InvalidTransitionError> => {
  switch (event._tag) {
    case "GithubLogin":
      if (state._tag === "Unauthenticated") {
        return Effect.succeed(Authenticated(event.userId));
      }
      break;

    case "StartVerify":
      if (state._tag === "Authenticated") {
        return Effect.succeed(VerificationPending(state.userId, event.requestId));
      }
      break;

    case "VerifySuccess":
      if (state._tag === "VerificationPending") {
        return Effect.succeed(Verified(state.userId, event.verifiedAt));
      }
      break;

    case "VerifyFail":
      if (state._tag === "VerificationPending") {
        return Effect.succeed(Authenticated(state.userId));
      }
      break;

    case "Logout":
      if (state._tag === "Authenticated" || state._tag === "Verified") {
        return Effect.succeed(Unauthenticated);
      }
      break;
  }

  return Effect.fail(
    new InvalidTransitionError({
      from: state._tag,
      event: event._tag,
    })
  );
};

// Helper to check if user is authenticated (in any authenticated state)
export const isAuthenticated = (state: UserState): boolean =>
  state._tag !== "Unauthenticated";

// Helper to check if user is verified
export const isVerified = (state: UserState): state is Extract<UserState, { _tag: "Verified" }> =>
  state._tag === "Verified";

// Get user ID from any authenticated state
export const getUserId = (state: UserState): string | null => {
  switch (state._tag) {
    case "Unauthenticated":
      return null;
    case "Authenticated":
    case "VerificationPending":
    case "Verified":
      return state.userId;
  }
};
