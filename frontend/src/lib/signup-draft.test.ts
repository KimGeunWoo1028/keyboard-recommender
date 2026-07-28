import { afterEach, describe, expect, it } from "vitest";

import {
  SIGNUP_DRAFT_KEY,
  clearSignupDraft,
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
    expect(parseSignupStep("password")).toBe("password");
    expect(parseSignupStep("nickname")).toBe("nickname");
    expect(parseSignupStep("nope")).toBe("email");
    expect(parseSignupStep(null)).toBe("email");
  });

  it("guards wizard steps from URL + draft + in-memory password", () => {
    const draft = { email: "a@b.com", emailVerificationToken: "tok" };
    expect(resolveSignupStep({ urlStep: "password", draft: null, hasPassword: false })).toBe("email");
    expect(resolveSignupStep({ urlStep: "nickname", draft: null, hasPassword: false })).toBe("email");
    expect(resolveSignupStep({ urlStep: "nickname", draft, hasPassword: false })).toBe("password");
    expect(resolveSignupStep({ urlStep: "nickname", draft, hasPassword: true })).toBe("nickname");
    expect(resolveSignupStep({ urlStep: "password", draft, hasPassword: false })).toBe("password");
    expect(resolveSignupStep({ urlStep: "email", draft, hasPassword: false })).toBe("email");
  });

  it("round-trips draft without storing password", () => {
    writeSignupDraft({ email: " a@b.com ", emailVerificationToken: " tok " });
    expect(readSignupDraft()).toEqual({
      email: "a@b.com",
      emailVerificationToken: "tok",
    });
    const raw = window.sessionStorage.getItem(SIGNUP_DRAFT_KEY) ?? "";
    expect(raw).not.toMatch(/password/i);
  });

  it("builds signup and post-signup login hrefs", () => {
    expect(signupWizardHref("email")).toBe("/auth/signup?step=email");
    expect(signupWizardHref("password", "/results")).toBe(
      "/auth/signup?step=password&next=%2Fresults",
    );
    expect(loginAfterSignupHref("/mypage")).toBe("/auth?mode=login&signup=1&next=%2Fmypage");
  });
});
