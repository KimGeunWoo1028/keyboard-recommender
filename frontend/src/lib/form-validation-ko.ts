/**
 * Korean messages for native HTML5 constraint validation.
 * Pair with onInvalid (setCustomValidity) + onInput (clear) so English browser
 * bubbles are replaced and cleared when the user edits.
 */

export const KO_VALIDATION = {
  emailRequired: "이메일을 입력해 주세요.",
  emailInvalid: "올바른 이메일 주소를 입력해 주세요.",
  passwordRequired: "비밀번호를 입력해 주세요.",
  passwordConfirmRequired: "비밀번호 확인을 입력해 주세요.",
  passwordTooShort: "비밀번호는 8자 이상이어야 합니다.",
  passwordTooLong: "비밀번호는 20자 이하여야 합니다.",
  passwordMismatch: "비밀번호가 일치하지 않습니다.",
  displayNameRequired: "닉네임을 입력해 주세요.",
  nameRequired: "이름을 입력해 주세요.",
  termsRequired: "필수 약관에 동의해 주세요.",
  valueMissing: "필수 항목을 입력해 주세요.",
} as const;

export type ValidationFieldKind =
  | "email"
  | "password"
  | "confirmPassword"
  | "displayName"
  | "name"
  | "text";

type ValiditySource = Pick<
  HTMLInputElement,
  "validity" | "type" | "minLength" | "value" | "validationMessage"
>;

export function koreanValidityMessage(
  input: ValiditySource,
  kind: ValidationFieldKind = "text",
): string {
  const v = input.validity;
  if (v.valueMissing) {
    if (kind === "email" || input.type === "email") return KO_VALIDATION.emailRequired;
    if (kind === "password") return KO_VALIDATION.passwordRequired;
    if (kind === "confirmPassword") return KO_VALIDATION.passwordConfirmRequired;
    if (kind === "displayName") return KO_VALIDATION.displayNameRequired;
    if (kind === "name") return KO_VALIDATION.nameRequired;
    return KO_VALIDATION.valueMissing;
  }
  if (v.typeMismatch && (kind === "email" || input.type === "email")) {
    return KO_VALIDATION.emailInvalid;
  }
  if (v.tooShort) {
    if (kind === "password" || kind === "confirmPassword" || input.type === "password") {
      return KO_VALIDATION.passwordTooShort;
    }
    const min = input.minLength > 0 ? input.minLength : 1;
    return `${min}자 이상 입력해 주세요.`;
  }
  if (v.tooLong) {
    if (kind === "password" || kind === "confirmPassword" || input.type === "password") {
      return KO_VALIDATION.passwordTooLong;
    }
    return "입력 길이를 줄여 주세요.";
  }
  if (v.patternMismatch) {
    if (kind === "email") return KO_VALIDATION.emailInvalid;
    if (kind === "password" || kind === "confirmPassword") {
      return "비밀번호 형식을 확인해 주세요.";
    }
    return "입력 형식을 확인해 주세요.";
  }
  if (v.customError && input.validationMessage) {
    return input.validationMessage;
  }
  return KO_VALIDATION.valueMissing;
}

/** Clear then re-apply so the next invalid event shows Korean, not stale English. */
export function applyKoreanCustomValidity(
  el: HTMLInputElement,
  kind: ValidationFieldKind = "text",
): string {
  el.setCustomValidity("");
  if (el.validity.valid) return "";
  const message = koreanValidityMessage(el, kind);
  el.setCustomValidity(message);
  return message;
}

export function clearKoreanCustomValidity(el: HTMLInputElement): void {
  el.setCustomValidity("");
}

/**
 * Set match error on confirm field. Call before reportValidity / on submit.
 * Clears custom error when values match or confirm is empty (so valueMissing can win).
 */
export function syncPasswordMatchValidity(
  passwordEl: HTMLInputElement | null,
  confirmEl: HTMLInputElement | null,
): void {
  if (!confirmEl) return;
  const password = passwordEl?.value ?? "";
  const confirm = confirmEl.value;
  if (!confirm) {
    confirmEl.setCustomValidity("");
    return;
  }
  if (password !== confirm) {
    confirmEl.setCustomValidity(KO_VALIDATION.passwordMismatch);
  } else {
    confirmEl.setCustomValidity("");
  }
}
