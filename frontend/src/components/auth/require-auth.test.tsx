import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/layout/auth-controls", () => ({
  useAuthHeader: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getPublicApiBase: () => "http://localhost:8010",
}));

import { RequireAuth } from "@/components/auth/require-auth";
import { SurveyAuthLoadingShell } from "@/components/auth/survey-auth-loading-shell";
import { useAuthHeader } from "@/components/layout/auth-controls";

describe("RequireAuth", () => {
  beforeEach(() => {
    vi.mocked(useAuthHeader).mockReset();
  });

  it("shows survey loading fallback before auth resolves", () => {
    vi.mocked(useAuthHeader).mockReturnValue({
      user: null,
      authChecked: false,
      setUser: vi.fn(),
    });

    render(
      <RequireAuth loadingFallback={<SurveyAuthLoadingShell />}>
        <div>survey-ready</div>
      </RequireAuth>,
    );

    expect(screen.getByText(/가까운 성향을 고르면 일부 문항이 채워집니다/)).toBeInTheDocument();
    expect(screen.queryByText("survey-ready")).not.toBeInTheDocument();
  });

  it("renders children once the shared auth session is ready", async () => {
    vi.mocked(useAuthHeader).mockReturnValue({
      user: {
        id: "u1",
        email: "a@b.com",
        created_at: "2026-01-01T00:00:00Z",
      },
      authChecked: true,
      setUser: vi.fn(),
    });

    render(
      <RequireAuth loadingFallback={<SurveyAuthLoadingShell />}>
        <div>survey-ready</div>
      </RequireAuth>,
    );

    await waitFor(() => {
      expect(screen.getByText("survey-ready")).toBeInTheDocument();
    });
  });
});
