import type { Metadata } from "next";

import { ForgotPasswordClient } from "@/app/auth/forgot-password/forgot-password-client";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/auth/forgot-password",
  title: "비밀번호 찾기",
  description: "가입한 이메일로 비밀번호 재설정 안내를 받을 수 있습니다.",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
