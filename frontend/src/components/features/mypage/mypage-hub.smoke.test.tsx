import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MyPageHub } from "./mypage-hub";

const replace = vi.fn();
let sectionParam: string | null = null;

const setUser = vi.fn();
const authHeaderState = {
  user: {
    id: "u1",
    email: "user@example.com",
    display_name: "허브유저",
    created_at: "2026-01-01T00:00:00.000Z",
  } as {
    id: string;
    email: string;
    display_name: string;
    created_at: string;
  } | null,
  authChecked: true,
  setUser,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "section" ? sectionParam : null),
    toString: () => (sectionParam ? `section=${sectionParam}` : ""),
  }),
}));

vi.mock("@/components/layout/auth-controls", () => ({
  useAuthHeader: () => authHeaderState,
}));

vi.mock("@/lib/api/auth", () => ({
  fetchAccountSecuritySummary: vi.fn(),
}));

vi.mock("@/lib/api/saved-recommendations", () => ({
  listSavedBookmarksWithLocalFallback: vi.fn(),
  mergeSavedBookmarkLists: vi.fn((a: unknown) => a),
  removeSavedRecommendationBookmark: vi.fn(),
  subscribeSavedBookmarksChanged: vi.fn(() => () => undefined),
}));

import { fetchAccountSecuritySummary } from "@/lib/api/auth";
import { listSavedBookmarksWithLocalFallback } from "@/lib/api/saved-recommendations";

describe("MyPageHub smoke", () => {
  beforeEach(() => {
    sectionParam = null;
    replace.mockReset();
    setUser.mockReset();
    authHeaderState.user = {
      id: "u1",
      email: "user@example.com",
      display_name: "허브유저",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    authHeaderState.authChecked = true;
    vi.mocked(fetchAccountSecuritySummary).mockResolvedValue({
      active_session_count: 1,
      last_login_at: "2026-07-01T00:00:00.000Z",
    });
    vi.mocked(listSavedBookmarksWithLocalFallback).mockResolvedValue([]);
  });

  it("loads overview from shared auth session without blocking on extras", async () => {
    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByTestId("e2e-mypage-hub")).toBeInTheDocument();
      expect(screen.getByText("허브유저")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "개요" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장한 빌드" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "활동" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "비교 기록" })).not.toBeInTheDocument();
    expect(listSavedBookmarksWithLocalFallback).toHaveBeenCalled();
    expect(fetchAccountSecuritySummary).toHaveBeenCalled();
  });

  it("switches to saved and account sections", async () => {
    const user = userEvent.setup();
    render(<MyPageHub />);
    await waitFor(() => expect(screen.getByText("허브유저")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "저장한 빌드" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "저장한 빌드" })).toBeInTheDocument();
    });
    expect(replace).toHaveBeenCalledWith("/mypage?section=saved", { scroll: false });

    await user.click(screen.getByRole("button", { name: "계정" }));
    expect(screen.getByRole("heading", { name: "프로필" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "보안" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "회원탈퇴" })).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/mypage?section=account", { scroll: false });
  });

  it("maps legacy activity section to saved and rewrites URL", async () => {
    sectionParam = "activity";
    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "저장한 빌드" })).toBeInTheDocument();
    });
    expect(replace).toHaveBeenCalledWith("/mypage?section=saved", { scroll: false });
  });

  it("keeps saved builds when only security-summary fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAccountSecuritySummary).mockRejectedValue(new Error("Failed to fetch"));
    vi.mocked(listSavedBookmarksWithLocalFallback).mockResolvedValue([
      {
        saved_at: "2026-07-22T01:00:00.000Z",
        request_id: "req-1",
        build_id: "build-1",
        title: "테스트 빌드",
        summary: "요약",
        components: {},
        metadata: {},
      },
    ]);

    render(<MyPageHub />);

    await user.click(screen.getByRole("button", { name: "저장한 빌드" }));
    await waitFor(() => {
      expect(screen.getByRole("listbox", { name: "저장한 빌드 목록" })).toBeInTheDocument();
    });
    expect(screen.queryByText("데이터를 불러오지 못했습니다.")).not.toBeInTheDocument();
  });

  it("shows retry panel when extras load fails", async () => {
    vi.mocked(fetchAccountSecuritySummary).mockRejectedValue(new Error("unauthorized"));
    vi.mocked(listSavedBookmarksWithLocalFallback).mockRejectedValue(new Error("unauthorized"));

    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByText("데이터를 불러오지 못했습니다.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });

  it("shows login gate when shared auth user is missing", async () => {
    authHeaderState.user = null;

    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByText("로그인이 필요합니다.")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/auth?force=1");
  });
});
