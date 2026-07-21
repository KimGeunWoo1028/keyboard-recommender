import { render, screen } from "@testing-library/react";
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
  it("shows profile, empty saved hub, and continue CTAs", () => {
    render(<MyPageOverview user={user} savedItems={[]} />);

    expect(screen.getByText("테스트유저")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("아직 저장한 빌드가 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "다시 설문하기" })).toHaveAttribute("href", "/recommend");
    expect(screen.getByRole("presentation")).toHaveAttribute("fetchpriority", "high");
    expect(screen.getByRole("link", { name: /저장 목록 보기/ })).toHaveAttribute("href", "/mypage?section=saved");
  });

  it("shows latest saved preview when bookmarks exist", () => {
    render(<MyPageOverview user={user} savedItems={[saved()]} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Quiet")).toBeInTheDocument();
    expect(screen.getByText("Soft")).toBeInTheDocument();
    expect(screen.getByText(/Oil King/)).toBeInTheDocument();
  });
});
