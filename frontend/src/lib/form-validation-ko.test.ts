import { describe, expect, it } from "vitest";

import {
  applyKoreanCustomValidity,
  clearKoreanCustomValidity,
  KO_VALIDATION,
  koreanValidityMessage,
  syncPasswordMatchValidity,
} from "./form-validation-ko";

function fakeInput(partial: {
  value?: string;
  type?: string;
  minLength?: number;
  required?: boolean;
  validity: Partial<ValidityState>;
  validationMessage?: string;
}): HTMLInputElement {
  const validity = {
    valueMissing: false,
    typeMismatch: false,
    tooShort: false,
    tooLong: false,
    patternMismatch: false,
    customError: false,
    valid: true,
    badInput: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    ...partial.validity,
  } as ValidityState;

  let custom = "";
  return {
    value: partial.value ?? "",
    type: partial.type ?? "text",
    minLength: partial.minLength ?? -1,
    required: partial.required ?? false,
    validity,
    get validationMessage() {
      return custom || partial.validationMessage || "";
    },
    setCustomValidity(message: string) {
      custom = message;
    },
  } as HTMLInputElement;
}

describe("koreanValidityMessage", () => {
  it("maps email required / type mismatch", () => {
    expect(
      koreanValidityMessage(
        fakeInput({ type: "email", validity: { valueMissing: true, valid: false } }),
        "email",
      ),
    ).toBe(KO_VALIDATION.emailRequired);
    expect(
      koreanValidityMessage(
        fakeInput({ type: "email", validity: { typeMismatch: true, valid: false } }),
        "email",
      ),
    ).toBe(KO_VALIDATION.emailInvalid);
  });

  it("maps password required and length", () => {
    expect(
      koreanValidityMessage(
        fakeInput({ type: "password", validity: { valueMissing: true, valid: false } }),
        "password",
      ),
    ).toBe(KO_VALIDATION.passwordRequired);
    expect(
      koreanValidityMessage(
        fakeInput({ type: "password", minLength: 8, validity: { tooShort: true, valid: false } }),
        "password",
      ),
    ).toBe(KO_VALIDATION.passwordTooShort);
  });

  it("maps display name and confirm password required", () => {
    expect(
      koreanValidityMessage(
        fakeInput({ validity: { valueMissing: true, valid: false } }),
        "displayName",
      ),
    ).toBe(KO_VALIDATION.displayNameRequired);
    expect(
      koreanValidityMessage(
        fakeInput({ type: "password", validity: { valueMissing: true, valid: false } }),
        "confirmPassword",
      ),
    ).toBe(KO_VALIDATION.passwordConfirmRequired);
  });
});

describe("applyKoreanCustomValidity / clear", () => {
  it("sets Korean custom validity and clears on edit path", () => {
    const el = fakeInput({
      type: "email",
      validity: { valueMissing: true, valid: false },
    });
    const msg = applyKoreanCustomValidity(el, "email");
    expect(msg).toBe(KO_VALIDATION.emailRequired);
    expect(el.validationMessage).toBe(KO_VALIDATION.emailRequired);
    clearKoreanCustomValidity(el);
    expect(el.validationMessage).toBe("");
  });
});

describe("syncPasswordMatchValidity", () => {
  it("flags mismatch and clears when matching", () => {
    const password = fakeInput({ value: "Password1!", validity: { valid: true } });
    const confirm = fakeInput({ value: "Password2!", validity: { valid: true } });
    syncPasswordMatchValidity(password, confirm);
    expect(confirm.validationMessage).toBe(KO_VALIDATION.passwordMismatch);
    confirm.value = "Password1!";
    syncPasswordMatchValidity(password, confirm);
    expect(confirm.validationMessage).toBe("");
  });
});
