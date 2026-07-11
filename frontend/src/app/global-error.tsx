"use client";

/**
 * Root fallback only. Kept minimal to reduce Next.js Client Manifest drift
 * around global-error during HMR / stale .next caches.
 * Day-to-day errors should hit app/error.tsx (segment boundary).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#faf8ff", color: "#131b2e" }}>
        <main style={{ maxWidth: 32 * 16, margin: "4rem auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#630ed4" }}>ERROR</p>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>문제가 발생했습니다</h1>
          <p style={{ fontSize: 14, color: "#4a4455" }}>
            {error.message || "알 수 없는 오류입니다. 페이지를 다시 불러와 주세요."}
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#7b7487" }}>
              digest: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 16,
              border: 0,
              borderRadius: 9999,
              padding: "8px 20px",
              background: "#7c3aed",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
