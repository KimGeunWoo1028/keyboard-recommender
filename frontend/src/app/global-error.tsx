"use client";

/**
 * Root fallback only. Kept minimal to reduce Next.js Client Manifest drift
 * around global-error during HMR / stale .next caches.
 * Day-to-day errors should hit app/error.tsx (segment boundary).
 *
 * Inline styles only (no app CSS). Hexes match Precision Editorial light tokens
 * from globals.css (:root --primary / --background / --foreground).
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
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#ffffff", color: "#0f0f19" }}>
        <main style={{ maxWidth: 32 * 16, margin: "4rem auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.08em", color: "#372fa3" }}>오류</p>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>문제가 발생했습니다</h1>
          <p style={{ fontSize: 14, color: "#50506e" }}>
            화면을 불러오는 중 문제가 생겼어요. 다시 시도하거나 홈으로 돌아가 주세요.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#5a5a78" }}>
              참조 코드: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 16,
              border: 0,
              borderRadius: 6,
              padding: "8px 20px",
              background: "#372fa3",
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
