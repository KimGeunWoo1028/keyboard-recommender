import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";
import { emptyTraits } from "@/types/traits";

import { MyPageSavedBuilds } from "./mypage-saved-builds";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function saved(partial: Partial<SavedRecommendationItem> = {}): SavedRecommendationItem {
  return {
    saved_at: "2026-07-01T00:00:00.000Z",
    request_id: "req-1",
    build_id: "build-1",
    title: "추천 조합: Quiet · Soft (Thocky)",
    summary: "A quiet build",
    components: {
      switches: "Oil King — lubed",
      plate: "FR4",
      foam: "Poron",
      layout: "65%",
      case: "Alu",
      keycap: "PBT keycap",
    },
    metadata: {},
    ...partial,
  };
}

describe("MyPageSavedBuilds smoke", () => {
  it("shows empty state when no bookmarks", () => {
    render(<MyPageSavedBuilds items={[]} removingKeys={new Set()} onRemove={vi.fn()} />);
    expect(screen.getByText(/아직 저장한 추천이 없어요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추천 설문 시작" })).toBeInTheDocument();
  });

  it("renders Manus-style cards with restore and delete actions", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(
      <MyPageSavedBuilds
        items={[
          saved({
            metadata: {
              preferenceTags: ["조용한 편", "차분한 소리"],
              overallConfidence: 0.92,
            },
          }),
        ]}
        removingKeys={new Set()}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByRole("list", { name: "저장한 결과 목록" })).toBeInTheDocument();
    expect(screen.getByText("일치도 92%")).toBeInTheDocument();
    expect(screen.getByText(/조용한 편/)).toBeInTheDocument();
    expect(screen.getByText(/· Oil King · FR4 · PBT keycap/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.getByText("저장한 결과를 삭제할까요?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "삭제하기" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("enables restore when server metadata includes resultSnapshot", () => {
    const submission = {
      version: 2 as const,
      answers: {
        sound_profile: "muted" as const,
        typing_pressure: "medium" as const,
        switch_feel: "linear" as const,
        bottom_out: "soft" as const,
        volume: "quiet" as const,
      },
      traits: emptyTraits(),
      completedAtIso: "2026-07-28T00:00:00.000Z",
      overallConfidence: 0.88,
      build: {
        id: "build-1",
        title: "Quiet build",
        tagline: "soft",
        switches: "Oil King — lubed",
        plate: "FR4",
        foam: "Poron",
        layout: "65%",
        highlights: [],
      },
      source: "api" as const,
    };
    render(
      <MyPageSavedBuilds
        items={[saved({ metadata: { resultSnapshot: submission } })]}
        removingKeys={new Set()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "결과 보기" })).toBeEnabled();
    expect(screen.getByText("일치도 88%")).toBeInTheDocument();
  });
});
