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

vi.mock("@/lib/api/client", () => ({
  getPublicApiBase: () => "http://api.test",
}));

vi.mock("@/lib/api/auth", () => ({
  fetchAccountSecuritySummary: vi.fn(),
}));

vi.mock("@/lib/api/saved-recommendations", () => ({
  listSavedRecommendationBookmarks: vi.fn(),
  listLocalGuestBookmarks: vi.fn(() => []),
  mergeSavedBookmarkLists: vi.fn((remote: unknown[], local: unknown[] = []) => [
    ...(Array.isArray(remote) ? remote : []),
    ...(Array.isArray(local) ? local : []),
  ]),
  removeSavedRecommendationBookmark: vi.fn(),
  subscribeSavedBookmarksChanged: vi.fn(() => () => undefined),
}));

import { fetchAccountSecuritySummary } from "@/lib/api/auth";
import {
  listLocalGuestBookmarks,
  listSavedRecommendationBookmarks,
} from "@/lib/api/saved-recommendations";

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
    vi.mocked(listSavedRecommendationBookmarks).mockResolvedValue([]);
    vi.mocked(listLocalGuestBookmarks).mockReturnValue([]);
  });

  it("shows data skeleton while saved builds load (not empty 0-count)", async () => {
    let resolveSaved!: (value: []) => void;
    vi.mocked(listSavedRecommendationBookmarks).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSaved = resolve;
        }),
    );

    render(<MyPageHub />);

    expect(screen.getByTestId("e2e-mypage-data-loading")).toBeInTheDocument();
    expect(screen.queryByText("아직 저장한 결과가 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByText("아직 추천 기록이 없습니다.")).not.toBeInTheDocument();

    resolveSaved([]);
    await waitFor(() => {
      expect(screen.getAllByText("허브유저").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/아직 저장한 결과가 없습니다/)).toBeInTheDocument();
  });

  it("shows saved count after successful load with items", async () => {
    vi.mocked(listSavedRecommendationBookmarks).mockResolvedValue([
      {
        saved_at: "2026-07-22T01:00:00.000Z",
        request_id: "req-1",
        build_id: "build-1",
        title: "테스트 빌드",
        summary: "요약",
        components: { switches: "Peach" },
        metadata: {},
      },
    ]);

    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getAllByText("허브유저").length).toBeGreaterThan(0);
      expect(screen.getByText("1")).toBeInTheDocument();
    });
    expect(screen.queryByText(/아직 저장한 결과가 없습니다/)).not.toBeInTheDocument();
    expect(listSavedRecommendationBookmarks).toHaveBeenCalled();
    expect(fetchAccountSecuritySummary).toHaveBeenCalled();
  });

  it("switches to saved and account sections", async () => {
    const user = userEvent.setup();
    render(<MyPageHub />);
    await waitFor(() => expect(screen.getAllByText("허브유저").length).toBeGreaterThan(0));

    await user.click(screen.getByRole("tab", { name: "저장한 결과" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "저장한 결과" })).toBeInTheDocument();
    });
    expect(replace).toHaveBeenCalledWith("/mypage?section=saved", { scroll: false });

    await user.click(screen.getByRole("tab", { name: "계정 설정" }));
    expect(screen.getByRole("heading", { name: "프로필" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "보안" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "회원탈퇴" })).toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/mypage?section=account", { scroll: false });
  });

  it("maps legacy activity section to saved and rewrites URL", async () => {
    sectionParam = "activity";
    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "저장한 결과" })).toBeInTheDocument();
    });
    expect(replace).toHaveBeenCalledWith("/mypage?section=saved", { scroll: false });
  });

  it("keeps saved builds when only security-summary fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchAccountSecuritySummary).mockRejectedValue(new Error("Failed to fetch"));
    vi.mocked(listSavedRecommendationBookmarks).mockResolvedValue([
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

    await waitFor(() => expect(screen.getAllByText("허브유저").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: "저장한 결과" }));
    await waitFor(() => {
      expect(screen.getByRole("list", { name: "저장한 결과 목록" })).toBeInTheDocument();
    });
    expect(screen.queryByText("저장한 결과를 불러오지 못했어요.")).not.toBeInTheDocument();
  });

  it("shows retry panel when saved list fails (not empty state)", async () => {
    vi.mocked(listSavedRecommendationBookmarks).mockRejectedValue(new Error("unauthorized"));

    render(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByText("저장한 결과를 불러오지 못했어요.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "다시 불러오기" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "계정 전환" })).toHaveAttribute("href", "/auth?force=1");
    expect(screen.queryByText(/아직 저장한 결과가 없습니다/)).not.toBeInTheDocument();
  });

  it("clears prior user data when account switches", async () => {
    vi.mocked(listSavedRecommendationBookmarks)
      .mockResolvedValueOnce([
        {
          saved_at: "2026-07-22T01:00:00.000Z",
          request_id: "req-a",
          build_id: "build-a",
          title: "A 빌드",
          summary: "A",
          components: {},
          metadata: {},
        },
      ])
      .mockResolvedValueOnce([
        {
          saved_at: "2026-07-22T02:00:00.000Z",
          request_id: "req-b",
          build_id: "build-b",
          title: "B 빌드 Quiet Soft",
          summary: "B",
          components: { switches: "Peach" },
          metadata: {},
        },
      ]);

    const { rerender } = render(<MyPageHub />);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    authHeaderState.user = {
      id: "u2",
      email: "b@example.com",
      display_name: "두번째",
      created_at: "2026-01-02T00:00:00.000Z",
    };
    rerender(<MyPageHub />);

    await waitFor(() => {
      expect(screen.getByText("두번째")).toBeInTheDocument();
    });
    expect(screen.queryByText("허브유저")).not.toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
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
