import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AuthUser } from "@/lib/api/auth";
import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";

import { MyPageOverview } from "./mypage-overview";

const user: AuthUser = {
  id: "u1",
  email: "user@example.com",
  display_name: "테스트유저",
  created_at: "2026-01-01T00:00:00.000Z",
};

function saved(partial: Partial<SavedRecommendationItem> = {}): SavedRecommendationItem {
  return {
    saved_at: "2026-07-01T00:00:00.000Z",
    request_id: "req-1",
    build_id: "build-1",
    title: "추천 조합: Quiet · Soft (Thocky)",
    summary: "summary",
    components: { switches: "Oil King", plate: "FR4" },
    metadata: {},
    ...partial,
  };
}

describe("MyPageOverview smoke", () => {
  it("shows overview stats, empty saved hub, and continue CTAs", () => {
    render(<MyPageOverview user={user} savedItems={[]} />);

    expect(screen.getByText("저장한 조합")).toBeInTheDocument();
    expect(screen.getByText("완료한 설문")).toBeInTheDocument();
    expect(screen.getByText("최고 일치도")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/아직 저장한 결과가 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /설문 다시하기/ })).toHaveAttribute("href", "/recommend");
    expect(screen.getByRole("link", { name: "설문 시작하기" })).toHaveAttribute("href", "/recommend");
  });

  it("shows latest saved preview when bookmarks exist", () => {
    render(
      <MyPageOverview
        user={user}
        savedItems={[
          saved({
            metadata: {
              overallConfidence: 0.92,
              preferenceTags: ["차분한 소리"],
            },
          }),
        ]}
      />,
    );

    const savedCard = screen.getByText("저장한 조합").closest("div.rounded-xl");
    expect(savedCard).toBeTruthy();
    expect(within(savedCard!).getByText("1")).toBeInTheDocument();

    const bestMatchCard = screen.getByText("최고 일치도").closest("div.rounded-xl");
    expect(bestMatchCard).toBeTruthy();
    expect(within(bestMatchCard!).getByText(/92%/)).toBeInTheDocument();

    expect(screen.getByText(/Quiet/)).toBeInTheDocument();
    expect(screen.getByText(/Soft/)).toBeInTheDocument();
    expect(screen.getByText(/Oil King/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /전체 보기/ })).toHaveAttribute("href", "/mypage?section=saved");
  });
});
