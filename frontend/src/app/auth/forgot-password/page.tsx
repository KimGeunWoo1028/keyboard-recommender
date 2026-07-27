import type { Metadata } from "next";

import { ForgotPasswordClient } from "@/app/auth/forgot-password/forgot-password-client";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/auth/forgot-password",
  title: "비밀번호 재설정",
  description: "Keyboard Recommender 계정의 비밀번호 재설정 링크를 요청합니다.",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
