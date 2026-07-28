import { afterEach, describe, expect, it } from "vitest";

import {
  SIGNUP_DRAFT_KEY,
  clearSignupDraft,
  formatCooldownMmSs,
  loginAfterSignupHref,
  parseSignupStep,
  readSignupDraft,
  resolveSignupStep,
  signupWizardHref,
  writeSignupDraft,
} from "@/lib/signup-draft";

describe("signup-draft helpers", () => {
  afterEach(() => {
    clearSignupDraft();
  });

  it("parses known steps and defaults unknown to email", () => {
    expect(parseSignupStep("verify")).toBe("verify");
    expect(parseSignupStep("password")).toBe("password");
    expect(parseSignupStep("nickname")).toBe("nickname");
    expect(parseSignupStep("nope")).toBe("email");
    expect(parseSignupStep(null)).toBe("email");
  });

  it("guards wizard steps from URL + draft + in-memory password", () => {
    const pending = { email: "a@b.com", codeSentAt: 1 };
    const verified = { email: "a@b.com", emailVerificationToken: "tok" };
    expect(resolveSignupStep({ urlStep: "verify", draft: null, hasPassword: false })).toBe("email");
    expect(resolveSignupStep({ urlStep: "verify", draft: pending, hasPassword: false })).toBe("verify");
    expect(resolveSignupStep({ urlStep: "password", draft: pending, hasPassword: false })).toBe("verify");
    expect(resolveSignupStep({ urlStep: "password", draft: verified, hasPassword: false })).toBe("password");
    expect(resolveSignupStep({ urlStep: "nickname", draft: verified, hasPassword: false })).toBe("password");
    expect(resolveSignupStep({ urlStep: "nickname", draft: verified, hasPassword: true })).toBe("nickname");
    expect(resolveSignupStep({ urlStep: "email", draft: pending, hasPassword: false })).toBe("email");
  });

  it("round-trips draft without storing password", () => {
    writeSignupDraft({ email: " a@b.com ", emailVerificationToken: " tok ", codeSentAt: 99 });
    expect(readSignupDraft()).toEqual({
      email: "a@b.com",
      emailVerificationToken: "tok",
      codeSentAt: 99,
    });
    const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY) ?? "";
    expect(raw).not.toMatch(/password/i);
  });

  it("builds signup and post-signup login hrefs", () => {
    expect(signupWizardHref("email")).toBe("/auth/signup?step=email");
    expect(signupWizardHref("verify", "/results")).toBe("/auth/signup?step=verify&next=%2Fresults");
    expect(loginAfterSignupHref("/mypage")).toBe("/auth?mode=login&signup=1&next=%2Fmypage");
  });

  it("formats resend cooldown", () => {
    expect(formatCooldownMmSs(119)).toBe("1:59");
    expect(formatCooldownMmSs(5)).toBe("0:05");
  });
});
