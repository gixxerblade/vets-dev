import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import {
  Authenticated,
  Unauthenticated,
  VerificationPending,
  Verified,
  getUserId,
  isAuthenticated,
  isVerified,
  transition,
} from "../user-state.js";

describe("User State Machine", () => {
  describe("State Constructors", () => {
    test("Authenticated should create correct state", () => {
      const state = Authenticated("user-123");
      expect(state).toEqual({
        _tag: "Authenticated",
        userId: "user-123",
        verified: false,
      });
    });

    test("VerificationPending should create correct state", () => {
      const state = VerificationPending("user-123", "request-456");
      expect(state).toEqual({
        _tag: "VerificationPending",
        userId: "user-123",
        requestId: "request-456",
      });
    });

    test("Verified should create correct state", () => {
      const verifiedAt = new Date("2024-01-01T00:00:00Z");
      const state = Verified("user-123", verifiedAt);
      expect(state).toEqual({
        _tag: "Verified",
        userId: "user-123",
        verifiedAt,
      });
    });
  });

  describe("State Transitions", () => {
    test("GithubLogin: Unauthenticated -> Authenticated", async () => {
      const result = await Effect.runPromise(
        transition(Unauthenticated, {
          _tag: "GithubLogin",
          userId: "user-123",
        }),
      );

      expect(result._tag).toBe("Authenticated");
      expect(result).toMatchObject({ userId: "user-123" });
    });

    test("StartVerify: Authenticated -> VerificationPending", async () => {
      const state = Authenticated("user-123");
      const result = await Effect.runPromise(
        transition(state, {
          _tag: "StartVerify",
          requestId: "request-456",
        }),
      );

      expect(result._tag).toBe("VerificationPending");
      expect(result).toMatchObject({
        userId: "user-123",
        requestId: "request-456",
      });
    });

    test("VerifySuccess: VerificationPending -> Verified", async () => {
      const state = VerificationPending("user-123", "request-456");
      const verifiedAt = new Date();
      const result = await Effect.runPromise(
        transition(state, {
          _tag: "VerifySuccess",
          verifiedAt,
        }),
      );

      expect(result._tag).toBe("Verified");
      expect(result).toMatchObject({
        userId: "user-123",
        verifiedAt,
      });
    });

    test("VerifyFail: VerificationPending -> Authenticated", async () => {
      const state = VerificationPending("user-123", "request-456");
      const result = await Effect.runPromise(
        transition(state, {
          _tag: "VerifyFail",
          reason: "DD-214 invalid",
        }),
      );

      expect(result._tag).toBe("Authenticated");
      expect(result).toMatchObject({ userId: "user-123" });
    });

    test("Logout: Authenticated -> Unauthenticated", async () => {
      const state = Authenticated("user-123");
      const result = await Effect.runPromise(
        transition(state, { _tag: "Logout" }),
      );

      expect(result._tag).toBe("Unauthenticated");
    });

    test("Logout: Verified -> Unauthenticated", async () => {
      const state = Verified("user-123", new Date());
      const result = await Effect.runPromise(
        transition(state, { _tag: "Logout" }),
      );

      expect(result._tag).toBe("Unauthenticated");
    });

    test("Invalid transition should fail with InvalidTransitionError", async () => {
      const state = Unauthenticated;
      const effect = transition(state, {
        _tag: "StartVerify",
        requestId: "123",
      });

      await expect(Effect.runPromise(effect)).rejects.toThrow();
    });
  });

  describe("Helper Functions", () => {
    test("isAuthenticated should return false for Unauthenticated", () => {
      expect(isAuthenticated(Unauthenticated)).toBe(false);
    });

    test("isAuthenticated should return true for Authenticated", () => {
      expect(isAuthenticated(Authenticated("user-123"))).toBe(true);
    });

    test("isAuthenticated should return true for VerificationPending", () => {
      expect(
        isAuthenticated(VerificationPending("user-123", "request-456")),
      ).toBe(true);
    });

    test("isAuthenticated should return true for Verified", () => {
      expect(isAuthenticated(Verified("user-123", new Date()))).toBe(true);
    });

    test("isVerified should return true only for Verified state", () => {
      expect(isVerified(Unauthenticated)).toBe(false);
      expect(isVerified(Authenticated("user-123"))).toBe(false);
      expect(isVerified(VerificationPending("user-123", "request-456"))).toBe(
        false,
      );
      expect(isVerified(Verified("user-123", new Date()))).toBe(true);
    });

    test("getUserId should return null for Unauthenticated", () => {
      expect(getUserId(Unauthenticated)).toBeNull();
    });

    test("getUserId should return userId for Authenticated", () => {
      expect(getUserId(Authenticated("user-123"))).toBe("user-123");
    });

    test("getUserId should return userId for VerificationPending", () => {
      expect(getUserId(VerificationPending("user-123", "request-456"))).toBe(
        "user-123",
      );
    });

    test("getUserId should return userId for Verified", () => {
      expect(getUserId(Verified("user-123", new Date()))).toBe("user-123");
    });
  });
});
