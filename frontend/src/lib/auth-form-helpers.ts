import { ApiError } from "@/lib/api/client";

export function friendlyAuthErrorMessage(mode: "login" | "signup", err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "네트워크 연결을 확인하고 다시 시도해 주세요.";
  }
  const raw = (err.message || "").toLowerCase();
  if (mode === "signup") {
    if (err.status === 409 || raw.includes("already exists")) {
      return "이미 가입된 이메일입니다.";
    }
    if (raw.includes("email verification")) {
      return "이메일 인증을 먼저 완료해 주세요.";
    }
    if (raw.includes("verification code")) {
      return "인증번호를 다시 확인해 주세요.";
    }
    if (err.status === 422) {
      if (raw.includes("password")) return "비밀번호는 8~20자, 영문/숫자/특수문자를 모두 포함해야 합니다.";
      if (raw.includes("email")) return "이메일 형식을 확인해 주세요.";
      return "입력값을 다시 확인해 주세요.";
    }
  }
  if (mode === "login") {
    if (err.status === 401 || raw.includes("invalid email or password")) {
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    }
    if (err.status === 422) return "이메일/비밀번호 형식을 확인해 주세요.";
  }
  if (err.status >= 500) return "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  return err.message || "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
}

export function isRetryableDisplayNameCheckError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504);
}

export function isPasswordPolicyValid(value: string): boolean {
  if (!/^[\x21-\x7E]{8,20}$/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

export function validateDisplayName(value: string): { valid: boolean; message: string } {
  const v = value.trim();
  if (!v) return { valid: false, message: "닉네임을 먼저 입력해 주세요." };
  if (v.length < 2) {
    return { valid: false, message: "닉네임은 2자 이상이어야 합니다." };
  }
  // First character must be Hangul or Latin — not a digit or symbol.
  if (!/^[가-힣A-Za-z]/.test(v)) {
    return { valid: false, message: "닉네임은 한글 또는 영문으로 시작해야 합니다." };
  }
  return { valid: true, message: "" };
}
