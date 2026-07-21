import { MyPageAuthLoadingShell } from "@/components/auth/mypage-auth-loading-shell";
import { PageShell } from "@/components/layout/page-shell";

export default function MyPageLoading() {
  return (
    <PageShell className="max-w-ca space-y-6 px-ca-margin-mobile sm:px-ca-margin">
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-ca-surface-container/60" />
        <div className="h-9 w-40 animate-pulse rounded bg-ca-surface-container/60" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-ca-surface-container/40" />
      </div>
      <MyPageAuthLoadingShell />
    </PageShell>
  );
}
