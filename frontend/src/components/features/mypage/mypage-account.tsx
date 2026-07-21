"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { MyPageSectionCard } from "@/components/features/mypage/mypage-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { resolveAvatarSrc } from "@/lib/avatar";

type Props = {
  user: AuthUser;
  securitySummary: AccountSecuritySummary | null;
  onUserChanged: (user: AuthUser) => void;
};

const DELETE_CONFIRM_WORD = "탈퇴";
const DELETE_WARNING =
  "탈퇴하면 계정·프로필·저장한 빌드 접근 권한이 즉시 사라집니다. 탈퇴 후에는 같은 이메일로 다시 가입할 수 있습니다.";

function validateDisplayName(value: string): string | null {
  const v = value.trim();
  if (!v) return "닉네임을 입력해 주세요.";
  const hasHangul = /[가-힣]/.test(v);
  const hasLatin = /[A-Za-z]/.test(v);
  if (hasHangul && !hasLatin && v.length < 2) return "한국어 닉네임은 2자 이상이어야 합니다.";
  if (hasLatin && !hasHangul && v.length < 3) return "영어 닉네임은 3자 이상이어야 합니다.";
  if (v.length < 3 && (hasHangul || hasLatin)) return "닉네임은 3자 이상이어야 합니다.";
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
      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-ca-on-surface-variant hover:text-ca-on-surface"
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

export function MyPageAccount({ user, securitySummary, onUserChanged }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openNicknamePanel, setOpenNicknamePanel] = useState(false);
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
    <div className="space-y-4">
      <MyPageSectionCard eyebrow="PROFILE" title="프로필" description="프로필 사진과 표시 이름을 확인·수정합니다.">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-ca-outline-variant/50 bg-ca-surface-container/60">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote API avatar + local default */}
            <img
              src={avatarSrc}
              alt=""
              width={96}
              height={96}
              className="h-full w-full object-cover"
              decoding="async"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-label text-ca-label-sm font-medium text-ca-secondary">프로필 사진</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={updatingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {updatingAvatar ? "업로드 중..." : "사진 올리기"}
              </Button>
              {hasCustomAvatar ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
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
                </Button>
              ) : null}
            </div>
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
            <p className="text-xs text-ca-on-surface-variant">JPEG, PNG, WebP · 최대 5MB</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-ca-outline-variant/30 pt-4">
          <div>
            <p className="font-label text-ca-label-sm font-medium text-ca-secondary">이메일</p>
            <p className="mt-1 truncate text-sm text-ca-on-surface">{user.email}</p>
          </div>
          <div>
            <p className="font-label text-ca-label-sm font-medium text-ca-secondary">닉네임</p>
            <p className="mt-1 text-sm text-ca-on-surface">{user.display_name?.trim() || "-"}</p>
          </div>
        </div>

        <Button
          variant={openNicknamePanel ? "primary" : "outline"}
          className="mt-2 w-full justify-between"
          onClick={() => setOpenNicknamePanel((prev) => !prev)}
        >
          닉네임 변경
          <span>{openNicknamePanel ? "▲" : "▼"}</span>
        </Button>
        {openNicknamePanel ? (
          <div className="space-y-2 rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/30 p-3">
            <Input
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setDisplayNameAvailable(false);
                setDisplayNameMessage(null);
              }}
              placeholder="닉네임 입력란"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-10 whitespace-nowrap px-4"
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
                className="h-10 whitespace-nowrap px-4"
                disabled={updatingName}
                onClick={() => {
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
                {updatingName ? "저장 중..." : "저장"}
              </Button>
            </div>
            {displayNameMessage ? <p className="text-xs text-ca-on-surface-variant">{displayNameMessage}</p> : null}
          </div>
        ) : null}
      </MyPageSectionCard>

      <MyPageSectionCard eyebrow="SECURITY" title="보안" description="비밀번호를 바꾸고, 로그인 세션을 종료할 수 있어요.">
        {securitySummary?.last_login_at ? (
          <p className="text-sm text-ca-on-surface-variant">
            최근 로그인 · {new Date(securitySummary.last_login_at).toLocaleString()}
          </p>
        ) : null}

        <Button
          variant={openPasswordPanel ? "primary" : "outline"}
          className="w-full justify-between"
          onClick={() => {
            setOpenPasswordPanel((prev) => !prev);
            setPasswordMessage(null);
          }}
        >
          비밀번호 변경
          <span>{openPasswordPanel ? "▲" : "▼"}</span>
        </Button>
        {openPasswordPanel ? (
          <div className="space-y-2 rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/30 p-3">
            <p className="text-xs text-ca-on-surface-variant">
              가입 이메일(<span className="font-medium text-ca-on-surface">{user.email}</span>)로 인증번호를
              받은 뒤, 비밀번호를 변경할 수 있습니다.
            </p>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
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
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Input
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
                  placeholder="인증번호 6자리"
                  className="min-w-0 flex-1"
                  disabled={!passwordCodeSent || passwordVerified}
                  autoComplete="one-time-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-[5.5rem] shrink-0"
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
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="pr-10"
                disabled={!passwordVerified}
                autoComplete="current-password"
              />
              <PasswordVisibilityToggle
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((v) => !v)}
              />
            </div>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호"
                className="pr-10"
                disabled={!passwordVerified}
                autoComplete="new-password"
              />
              <PasswordVisibilityToggle visible={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} />
            </div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인란"
                className="pr-10"
                disabled={!passwordVerified}
                autoComplete="new-password"
              />
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
              />
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-ca-on-surface-variant">
                <span className={isPasswordPolicyValid(newPassword) ? "text-green-500" : "text-red-500"}>
                  {isPasswordPolicyValid(newPassword) ? "✓" : "✗"}
                </span>{" "}
                8~20자, 영문/숫자/특수문자 포함
              </p>
              <p className="text-ca-on-surface-variant">
                <span className={passwordMatches ? "text-green-500" : "text-red-500"}>{passwordMatches ? "✓" : "✗"}</span>{" "}
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
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-ca-outline-variant/30 pt-4">
          <Button
            variant="outline"
            disabled={securityActionBusy !== "none"}
            onClick={() => {
              setSecurityActionBusy("logout");
              void logout().finally(() => {
                router.push("/auth?force=1");
                router.refresh();
              });
            }}
          >
            {securityActionBusy === "logout" ? "로그아웃 중..." : "현재 세션 로그아웃"}
          </Button>
          <Button
            variant="ghost"
            disabled={securityActionBusy !== "none"}
            onClick={() => {
              setSecurityActionBusy("logout_all");
              void logoutAllSessions().finally(() => {
                router.push("/auth?force=1");
                router.refresh();
              });
            }}
          >
            {securityActionBusy === "logout_all" ? "처리 중..." : "전체 세션 로그아웃"}
          </Button>
        </div>
      </MyPageSectionCard>

      <MyPageSectionCard
        eyebrow="DANGER"
        title="회원탈퇴"
        description="계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다."
      >
        <p className="text-sm text-ca-on-surface-variant">{DELETE_WARNING}</p>
        <Button
          variant={openDeletePanel ? "primary" : "outline"}
          className="w-full justify-between"
          onClick={() => {
            setOpenDeletePanel((prev) => !prev);
            setDeleteMessage(null);
          }}
        >
          탈퇴하기
          <span>{openDeletePanel ? "▲" : "▼"}</span>
        </Button>
        {openDeletePanel ? (
          <div className="space-y-2 rounded-lg border border-ca-outline-variant/40 bg-ca-surface-container/30 p-3">
            <p className="text-xs text-ca-on-surface-variant">
              가입 이메일(<span className="font-medium text-ca-on-surface">{user.email}</span>)로 인증번호를
              받은 뒤, 비밀번호와 함께 탈퇴를 완료합니다.
            </p>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
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
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Input
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
                  placeholder="인증번호 6자리"
                  className="min-w-0 flex-1"
                  disabled={!deleteCodeSent || deleteVerified}
                  autoComplete="one-time-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-[5.5rem] shrink-0"
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
            <div className="relative">
              <Input
                type={showDeletePassword ? "text" : "password"}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="pr-10"
                autoComplete="current-password"
                disabled={!deleteVerified}
              />
              <PasswordVisibilityToggle
                visible={showDeletePassword}
                onToggle={() => setShowDeletePassword((v) => !v)}
              />
            </div>
            <Input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`확인을 위해 «${DELETE_CONFIRM_WORD}»를 입력하세요`}
              autoComplete="off"
              disabled={!deleteVerified}
            />
            <p className="text-xs text-ca-on-surface-variant">
              <span className={deleteConfirm === DELETE_CONFIRM_WORD ? "text-green-500" : "text-red-500"}>
                {deleteConfirm === DELETE_CONFIRM_WORD ? "✓" : "✗"}
              </span>{" "}
              «{DELETE_CONFIRM_WORD}» 입력 확인
            </p>
            <Button
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
                    // Hard navigation: avoid RequireAuth racing emitAuthChanged → /auth?next=…
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
