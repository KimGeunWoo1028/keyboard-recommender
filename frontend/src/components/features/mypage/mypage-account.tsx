"use client";

import { Check, LogOut, Pencil, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { MyPageSectionCard } from "@/components/features/mypage/mypage-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkDisplayNameAvailability,
  changePassword,
  clearAvatar,
  deleteAccount,
  logout,
  logoutAllSessions,
  sendAccountDeletionCode,
  sendPasswordChangeCode,
  type AccountSecuritySummary,
  type AuthUser,
  updateDisplayName,
  uploadAvatar,
  verifyAccountDeletionCode,
  verifyPasswordChangeCode,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { formatAbsoluteDateTime } from "@/lib/date-time";
import { resolveAvatarSrc } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = {
  user: AuthUser;
  securitySummary: AccountSecuritySummary | null;
  onUserChanged: (user: AuthUser) => void;
};

const DELETE_CONFIRM_WORD = "탈퇴";
const DELETE_WARNING =
  "탈퇴하면 계정·프로필·저장한 결과 접근 권한이 즉시 사라집니다. 탈퇴 후에는 같은 이메일로 다시 가입할 수 있습니다.";
function validateDisplayName(value: string): string | null {
  const v = value.trim();
  if (!v) return "닉네임을 입력해 주세요.";
  if (v.length < 2) return "닉네임은 2자 이상이어야 합니다.";
  if (!/^[가-힣A-Za-z]/.test(v)) return "닉네임은 한글 또는 영문으로 시작해야 합니다.";
  return null;
}

function isPasswordPolicyValid(value: string): boolean {
  if (!/^[\x21-\x7E]{8,20}$/.test(value)) return false;
  if (!/[A-Za-z]/.test(value)) return false;
  if (!/\d/.test(value)) return false;
  if (!/[^A-Za-z0-9]/.test(value)) return false;
  return true;
}

function isRetryableDisplayNameCheckError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504);
}

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:bg-transparent hover:text-ca-on-surface"
      aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
      onClick={onToggle}
    >
      {visible ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
          <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-3.17 4.59" />
          <path d="M6.61 6.61A11.8 11.8 0 0 0 1 12c1.04 2.94 3.1 5.2 5.74 6.46" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </Button>
  );
}

/** Label + password input with eye toggle anchored to the input only (not the label). */
function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <PasswordVisibilityToggle visible={visible} onToggle={onToggleVisible} />
      </div>
    </div>
  );
}

export function MyPageAccount({ user, securitySummary, onUserChanged }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editNickname, setEditNickname] = useState(false);
  const [openPasswordPanel, setOpenPasswordPanel] = useState(false);
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);
  const [displayNameAvailable, setDisplayNameAvailable] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordCodeSent, setPasswordCodeSent] = useState(false);
  const [passwordCode, setPasswordCode] = useState("");
  const [sendingPasswordCode, setSendingPasswordCode] = useState(false);
  const [verifyingPasswordCode, setVerifyingPasswordCode] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordVerificationToken, setPasswordVerificationToken] = useState<string | null>(null);
  const [securityActionBusy, setSecurityActionBusy] = useState<"none" | "logout" | "logout_all">("none");
  const [openDeletePanel, setOpenDeletePanel] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteCodeSent, setDeleteCodeSent] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [sendingDeleteCode, setSendingDeleteCode] = useState(false);
  const [verifyingDeleteCode, setVerifyingDeleteCode] = useState(false);
  const [deleteVerified, setDeleteVerified] = useState(false);
  const [deleteVerificationToken, setDeleteVerificationToken] = useState<string | null>(null);

  const passwordMatches = useMemo(
    () => confirmPassword.length > 0 && confirmPassword === newPassword,
    [confirmPassword, newPassword],
  );
  const avatarSrc = resolveAvatarSrc(user.avatar_url);
  const hasCustomAvatar = Boolean(user.avatar_url?.trim());

  return (
    <div className="max-w-lg space-y-6">
      <MyPageSectionCard title="프로필" className="rounded-xl">
        <div className="flex items-center gap-4 border-b border-ca-outline-variant/30 pb-4">
          <button
            type="button"
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-ca-outline-variant/50 bg-ca-surface-container/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            disabled={updatingAvatar}
            aria-label="프로필 사진 변경"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote API avatar + local default */}
            <img
              src={avatarSrc}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
              decoding="async"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ca-base/0 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:bg-ca-base/35 group-hover:opacity-100 group-focus-visible:bg-ca-base/35 group-focus-visible:opacity-100">
              변경
            </span>
          </button>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
                disabled={updatingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {updatingAvatar ? "업로드 중..." : "사진 변경"}
              </button>
              {hasCustomAvatar ? (
                <button
                  type="button"
                  className="text-sm text-ca-on-surface-variant hover:text-ca-on-surface hover:underline disabled:opacity-50"
                  disabled={updatingAvatar}
                  onClick={() => {
                    setAvatarMessage(null);
                    setUpdatingAvatar(true);
                    void clearAvatar()
                      .then((updated) => {
                        onUserChanged(updated);
                        setAvatarMessage("기본 프로필 사진으로 되돌렸습니다.");
                      })
                      .catch((e) => {
                        setAvatarMessage(e instanceof Error ? e.message : "프로필 사진 삭제에 실패했습니다.");
                      })
                      .finally(() => setUpdatingAvatar(false));
                  }}
                >
                  기본으로
                </button>
              ) : null}
            </div>
            <p className="text-xs text-ca-on-surface-variant">JPEG, PNG, WebP · 최대 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setAvatarMessage(null);
                if (file.size > 5 * 1024 * 1024) {
                  setAvatarMessage("이미지는 5MB 이하여야 합니다.");
                  return;
                }
                setUpdatingAvatar(true);
                void uploadAvatar(file)
                  .then((updated) => {
                    onUserChanged(updated);
                    setAvatarMessage("프로필 사진이 변경되었습니다.");
                  })
                  .catch((err) => {
                    setAvatarMessage(err instanceof Error ? err.message : "프로필 사진 업로드에 실패했습니다.");
                  })
                  .finally(() => setUpdatingAvatar(false));
              }}
            />
            {avatarMessage ? <p className="text-xs text-ca-on-surface-variant">{avatarMessage}</p> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mypage-nickname-display" className="text-xs font-semibold uppercase tracking-wider text-ca-on-surface-variant">
              닉네임
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="mypage-nickname-display"
                value={editNickname ? displayName : user.display_name?.trim() || ""}
                disabled={!editNickname}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setDisplayNameAvailable(false);
                  setDisplayNameMessage(null);
                }}
                placeholder="표시할 닉네임"
                className="disabled:bg-[rgb(248_248_252)] dark:disabled:bg-ca-surface-container-low"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                aria-label={editNickname ? "닉네임 저장" : "닉네임 수정"}
                disabled={updatingName}
                onClick={() => {
                  if (!editNickname) {
                    setDisplayName(user.display_name ?? "");
                    setDisplayNameAvailable(false);
                    setDisplayNameMessage(null);
                    setEditNickname(true);
                    return;
                  }
                  const err = validateDisplayName(displayName);
                  if (err) {
                    setDisplayNameMessage(err);
                    return;
                  }
                  if (
                    !displayNameAvailable &&
                    displayName.trim().toLowerCase() !== (user.display_name ?? "").trim().toLowerCase()
                  ) {
                    setDisplayNameMessage("닉네임 중복 확인을 먼저 해주세요.");
                    return;
                  }
                  setUpdatingName(true);
                  void updateDisplayName(displayName.trim())
                    .then((updated) => {
                      onUserChanged(updated);
                      setDisplayNameMessage("닉네임이 변경되었습니다.");
                      setDisplayNameAvailable(false);
                      setEditNickname(false);
                    })
                    .catch((e) => {
                      if (e instanceof ApiError && e.status === 409) {
                        setDisplayNameMessage("이미 사용중입니다.");
                      } else {
                        setDisplayNameMessage(e instanceof Error ? e.message : "닉네임 변경에 실패했습니다.");
                      }
                    })
                    .finally(() => setUpdatingName(false));
                }}
              >
                {editNickname ? <Check className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
              </Button>
            </div>
            {editNickname ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const err = validateDisplayName(displayName);
                    if (err) {
                      setDisplayNameMessage(err);
                      setDisplayNameAvailable(false);
                      return;
                    }
                    void checkDisplayNameAvailability(displayName.trim())
                      .then((res) => {
                        if (
                          res.available ||
                          displayName.trim().toLowerCase() === (user.display_name ?? "").trim().toLowerCase()
                        ) {
                          setDisplayNameAvailable(true);
                          setDisplayNameMessage("사용 가능한 닉네임입니다.");
                        } else {
                          setDisplayNameAvailable(false);
                          setDisplayNameMessage("이미 사용중입니다.");
                        }
                      })
                      .catch((e) => {
                        setDisplayNameAvailable(false);
                        if (isRetryableDisplayNameCheckError(e)) {
                          setDisplayNameMessage("지금은 중복 확인이 어렵습니다. 잠시 후 다시 시도해 주세요.");
                          return;
                        }
                        setDisplayNameMessage(e instanceof Error ? e.message : "중복 확인에 실패했습니다.");
                      });
                  }}
                >
                  중복 확인
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditNickname(false);
                    setDisplayName(user.display_name ?? "");
                    setDisplayNameAvailable(false);
                    setDisplayNameMessage(null);
                  }}
                >
                  취소
                </Button>
              </div>
            ) : null}
            {displayNameMessage ? <p className="text-xs text-ca-on-surface-variant">{displayNameMessage}</p> : null}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ca-on-surface-variant">이메일</p>
            <p className="truncate text-sm text-ca-on-surface">{user.email}</p>
          </div>
        </div>
      </MyPageSectionCard>

      <MyPageSectionCard title="보안" className="rounded-xl">
        {securitySummary?.last_login_at ? (
          <p className="text-xs text-ca-on-surface-variant">
            최근 로그인 · {formatAbsoluteDateTime(securitySummary.last_login_at, { includeSeconds: true })}
          </p>
        ) : null}

        {!openPasswordPanel ? (
          <Button
            variant="outline"
            className="border-border font-semibold text-primary hover:border-primary"
            onClick={() => {
              setOpenPasswordPanel(true);
              setPasswordMessage(null);
            }}
          >
            비밀번호 변경 이메일 보내기
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ca-on-surface">비밀번호 변경</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpenPasswordPanel(false);
                  setPasswordMessage(null);
                }}
              >
                닫기
              </Button>
            </div>
            <p className="text-xs text-ca-on-surface-variant">
              가입 이메일(<span className="font-medium text-ca-on-surface">{user.email}</span>)로 인증번호를
              받은 뒤, 비밀번호를 변경할 수 있습니다.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="mypage-password-code">비밀번호 변경 인증번호</Label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-full shrink-0 sm:w-auto"
                  loading={sendingPasswordCode}
                  disabled={passwordVerified || securityActionBusy !== "none"}
                  onClick={() => {
                    setPasswordMessage(null);
                    setPasswordVerified(false);
                    setPasswordVerificationToken(null);
                    setPasswordCode("");
                    setSendingPasswordCode(true);
                    void sendPasswordChangeCode()
                      .then((res) => {
                        setPasswordCodeSent(true);
                        if (res.delivery === "smtp" || res.delivery === "resend") {
                          setPasswordMessage("인증번호를 이메일로 보냈습니다.");
                        } else {
                          setPasswordMessage("인증번호 요청이 접수되었습니다. 메일 도착까지 잠시 기다려 주세요.");
                        }
                      })
                      .catch((e) => {
                        setPasswordMessage(e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.");
                      })
                      .finally(() => setSendingPasswordCode(false));
                  }}
                >
                  {passwordCodeSent ? "인증번호 재발송" : "인증번호 발송"}
                </Button>
                <Input
                  id="mypage-password-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={passwordCode}
                  onChange={(e) => {
                    setPasswordCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (passwordVerified) {
                      setPasswordVerified(false);
                      setPasswordVerificationToken(null);
                    }
                  }}
                  placeholder="6자리 숫자"
                  className="min-w-0 flex-1"
                  disabled={!passwordCodeSent || passwordVerified}
                  autoComplete="one-time-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 min-w-[5.5rem] shrink-0"
                  loading={verifyingPasswordCode}
                  disabled={!passwordCodeSent || passwordVerified || securityActionBusy !== "none"}
                  onClick={() => {
                    setPasswordMessage(null);
                    if (!/^\d{6}$/.test(passwordCode)) {
                      setPasswordMessage("인증번호 6자리를 입력해 주세요.");
                      return;
                    }
                    setVerifyingPasswordCode(true);
                    void verifyPasswordChangeCode(passwordCode)
                      .then((res) => {
                        setPasswordVerified(true);
                        setPasswordVerificationToken(res.verification_token);
                        setPasswordMessage("이메일 인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.");
                      })
                      .catch((e) => {
                        if (e instanceof ApiError && e.status === 400) {
                          setPasswordMessage("인증번호가 올바르지 않거나 만료되었습니다.");
                        } else {
                          setPasswordMessage(e instanceof Error ? e.message : "인증 확인에 실패했습니다.");
                        }
                      })
                      .finally(() => setVerifyingPasswordCode(false));
                  }}
                >
                  {passwordVerified ? "인증 완료" : "인증 확인"}
                </Button>
              </div>
            </div>
            <PasswordField
              id="mypage-current-password"
              label="현재 비밀번호"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrentPassword}
              onToggleVisible={() => setShowCurrentPassword((v) => !v)}
              placeholder="현재 비밀번호"
              disabled={!passwordVerified}
              autoComplete="current-password"
            />
            <PasswordField
              id="mypage-new-password"
              label="새 비밀번호"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              onToggleVisible={() => setShowNewPassword((v) => !v)}
              placeholder="새 비밀번호"
              disabled={!passwordVerified}
              autoComplete="new-password"
            />
            <PasswordField
              id="mypage-confirm-password"
              label="새 비밀번호 확인"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((v) => !v)}
              placeholder="새 비밀번호 다시 입력"
              disabled={!passwordVerified}
              autoComplete="new-password"
            />
            <div className="space-y-1 text-xs">
              <p className="text-ca-on-surface-variant">
                <span className={isPasswordPolicyValid(newPassword) ? "text-success" : "text-destructive"}>
                  {isPasswordPolicyValid(newPassword) ? "✓" : "✗"}
                </span>{" "}
                8~20자, 영문/숫자/특수문자 포함
              </p>
              <p className="text-ca-on-surface-variant">
                <span className={passwordMatches ? "text-success" : "text-destructive"}>{passwordMatches ? "✓" : "✗"}</span>{" "}
                비밀번호 확인 일치
              </p>
            </div>
            <Button
              loading={updatingPassword}
              disabled={!passwordVerified || !passwordVerificationToken}
              onClick={() => {
                setPasswordMessage(null);
                if (!passwordVerificationToken) {
                  setPasswordMessage("이메일 인증을 먼저 완료해 주세요.");
                  return;
                }
                if (!currentPassword) {
                  setPasswordMessage("현재 비밀번호를 입력해 주세요.");
                  return;
                }
                if (!isPasswordPolicyValid(newPassword)) {
                  setPasswordMessage("새 비밀번호 형식을 확인해 주세요.");
                  return;
                }
                if (!passwordMatches) {
                  setPasswordMessage("새 비밀번호 확인이 일치하지 않습니다.");
                  return;
                }
                setUpdatingPassword(true);
                void changePassword({
                  current_password: currentPassword,
                  new_password: newPassword,
                  verification_token: passwordVerificationToken,
                })
                  .then(() => {
                    setPasswordMessage("비밀번호가 변경되었습니다.");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordCode("");
                    setPasswordCodeSent(false);
                    setPasswordVerified(false);
                    setPasswordVerificationToken(null);
                    setOpenPasswordPanel(false);
                  })
                  .catch((e) => {
                    if (e instanceof ApiError && e.status === 401) {
                      setPasswordMessage("현재 비밀번호가 올바르지 않습니다.");
                    } else if (e instanceof ApiError && e.status === 400) {
                      setPasswordMessage("이메일 인증이 만료되었거나 유효하지 않습니다. 인증번호를 다시 받아 주세요.");
                      setPasswordVerified(false);
                      setPasswordVerificationToken(null);
                    } else {
                      setPasswordMessage(e instanceof Error ? e.message : "비밀번호 변경에 실패했습니다.");
                    }
                  })
                  .finally(() => setUpdatingPassword(false));
              }}
            >
              비밀번호 변경
            </Button>
            {passwordMessage ? <p className="text-xs text-ca-on-surface-variant">{passwordMessage}</p> : null}
          </div>
        )}
      </MyPageSectionCard>

      <MyPageSectionCard title="계정 관리" className="rounded-xl">
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            className={cn(
              "justify-start gap-2 border-border text-ca-on-surface-variant hover:border-primary hover:text-primary",
            )}
            disabled={securityActionBusy !== "none"}
            onClick={() => {
              setSecurityActionBusy("logout");
              void logout().finally(() => {
                router.push("/");
                router.refresh();
              });
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {securityActionBusy === "logout" ? "로그아웃 중..." : "로그아웃"}
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-ca-on-surface-variant hover:text-primary"
            disabled={securityActionBusy !== "none"}
            onClick={() => {
              setSecurityActionBusy("logout_all");
              void logoutAllSessions().finally(() => {
                router.push("/");
                router.refresh();
              });
            }}
          >
            {securityActionBusy === "logout_all" ? "처리 중..." : "전체 세션 로그아웃"}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "justify-start gap-2 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive",
            )}
            disabled={securityActionBusy !== "none" || deletingAccount}
            onClick={() => {
              setOpenDeletePanel((prev) => !prev);
              setDeleteMessage(null);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            계정 삭제
          </Button>
        </div>

        {openDeletePanel ? (
          <div className="mt-4 space-y-3 rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/30 p-3">
            <p className="text-sm text-ca-on-surface-variant">{DELETE_WARNING}</p>
            <p className="text-xs text-ca-on-surface-variant">
              가입 이메일(<span className="font-medium text-ca-on-surface">{user.email}</span>)로 인증번호를
              받은 뒤, 비밀번호와 함께 탈퇴를 완료합니다.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="mypage-delete-code">탈퇴 인증번호</Label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-full shrink-0 sm:w-auto"
                  loading={sendingDeleteCode}
                  disabled={deleteVerified || securityActionBusy !== "none"}
                  onClick={() => {
                    setDeleteMessage(null);
                    setDeleteVerified(false);
                    setDeleteVerificationToken(null);
                    setDeleteCode("");
                    setSendingDeleteCode(true);
                    void sendAccountDeletionCode()
                      .then((res) => {
                        setDeleteCodeSent(true);
                        if (res.delivery === "smtp" || res.delivery === "resend") {
                          setDeleteMessage("인증번호를 이메일로 보냈습니다.");
                        } else {
                          setDeleteMessage("인증번호 요청이 접수되었습니다. 메일 도착까지 잠시 기다려 주세요.");
                        }
                      })
                      .catch((e) => {
                        setDeleteMessage(e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.");
                      })
                      .finally(() => setSendingDeleteCode(false));
                  }}
                >
                  {deleteCodeSent ? "인증번호 재발송" : "인증번호 발송"}
                </Button>
                <Input
                  id="mypage-delete-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={deleteCode}
                  onChange={(e) => {
                    setDeleteCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (deleteVerified) {
                      setDeleteVerified(false);
                      setDeleteVerificationToken(null);
                    }
                  }}
                  placeholder="6자리 숫자"
                  className="min-w-0 flex-1"
                  disabled={!deleteCodeSent || deleteVerified}
                  autoComplete="one-time-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 min-w-[5.5rem] shrink-0"
                  loading={verifyingDeleteCode}
                  disabled={!deleteCodeSent || deleteVerified || securityActionBusy !== "none"}
                  onClick={() => {
                    setDeleteMessage(null);
                    if (!/^\d{6}$/.test(deleteCode)) {
                      setDeleteMessage("인증번호 6자리를 입력해 주세요.");
                      return;
                    }
                    setVerifyingDeleteCode(true);
                    void verifyAccountDeletionCode(deleteCode)
                      .then((res) => {
                        setDeleteVerified(true);
                        setDeleteVerificationToken(res.verification_token);
                        setDeleteMessage("이메일 인증이 완료되었습니다. 비밀번호를 입력해 탈퇴를 완료하세요.");
                      })
                      .catch((e) => {
                        if (e instanceof ApiError && e.status === 400) {
                          setDeleteMessage("인증번호가 올바르지 않거나 만료되었습니다.");
                        } else {
                          setDeleteMessage(e instanceof Error ? e.message : "인증 확인에 실패했습니다.");
                        }
                      })
                      .finally(() => setVerifyingDeleteCode(false));
                  }}
                >
                  {deleteVerified ? "인증 완료" : "인증 확인"}
                </Button>
              </div>
            </div>
            <PasswordField
              id="mypage-delete-password"
              label="현재 비밀번호"
              value={deletePassword}
              onChange={setDeletePassword}
              visible={showDeletePassword}
              onToggleVisible={() => setShowDeletePassword((v) => !v)}
              placeholder="현재 비밀번호"
              autoComplete="current-password"
              disabled={!deleteVerified}
            />
            <div className="space-y-1.5">
              <Label htmlFor="mypage-delete-confirm">탈퇴 확인 문구</Label>
              <Input
                id="mypage-delete-confirm"
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={`«${DELETE_CONFIRM_WORD}» 입력`}
                autoComplete="off"
                disabled={!deleteVerified}
              />
            </div>
            <p className="text-xs text-ca-on-surface-variant">
              <span className={deleteConfirm === DELETE_CONFIRM_WORD ? "text-success" : "text-destructive"}>
                {deleteConfirm === DELETE_CONFIRM_WORD ? "✓" : "✗"}
              </span>{" "}
              «{DELETE_CONFIRM_WORD}» 입력 확인
            </p>
            <Button
              variant="destructive"
              disabled={deletingAccount || !deleteVerified || securityActionBusy !== "none"}
              onClick={() => {
                setDeleteMessage(null);
                if (!deleteVerificationToken) {
                  setDeleteMessage("이메일 인증을 먼저 완료해 주세요.");
                  return;
                }
                if (!deletePassword) {
                  setDeleteMessage("비밀번호를 입력해 주세요.");
                  return;
                }
                if (deleteConfirm !== DELETE_CONFIRM_WORD) {
                  setDeleteMessage(`확인 문구로 «${DELETE_CONFIRM_WORD}»를 입력해 주세요.`);
                  return;
                }
                setDeletingAccount(true);
                void deleteAccount({
                  password: deletePassword,
                  verification_token: deleteVerificationToken,
                })
                  .then(() => {
                    window.location.assign("/account-deleted");
                  })
                  .catch((e) => {
                    if (e instanceof ApiError && e.status === 401) {
                      setDeleteMessage("비밀번호가 올바르지 않습니다.");
                    } else if (e instanceof ApiError && e.status === 400) {
                      setDeleteMessage("이메일 인증이 만료되었거나 유효하지 않습니다. 인증번호를 다시 받아 주세요.");
                      setDeleteVerified(false);
                      setDeleteVerificationToken(null);
                    } else {
                      setDeleteMessage(e instanceof Error ? e.message : "회원탈퇴에 실패했습니다.");
                    }
                  })
                  .finally(() => setDeletingAccount(false));
              }}
            >
              {deletingAccount ? "탈퇴 처리 중..." : "계정 영구 삭제"}
            </Button>
            {deleteMessage ? <p className="text-xs text-ca-on-surface-variant">{deleteMessage}</p> : null}
          </div>
        ) : null}
      </MyPageSectionCard>
    </div>
  );
}
