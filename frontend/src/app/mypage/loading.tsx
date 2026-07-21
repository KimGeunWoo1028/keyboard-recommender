import { MyPageAuthLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { PageShell } from "@/components/layout/page-shell";

export default function MyPageLoading() {
  return (
    <PageShell className="max-w-ca space-y-8 px-ca-margin-mobile sm:px-ca-margin">
      <header className="space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-ca-surface-container/60 sm:h-9 sm:w-40" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-ca-surface-container/40" />
      </header>
      <MyPageAuthLoadingShell />
    </PageShell>
  );
}
