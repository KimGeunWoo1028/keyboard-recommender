import type { Metadata } from "next";

import { SignupWizardClient } from "@/app/auth/signup/signup-wizard-client";
import { privatePageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = privatePageMetadata({
  path: "/auth/signup",
  title: "회원가입",
});

export default function AuthSignupPage() {
  return <SignupWizardClient />;
}
