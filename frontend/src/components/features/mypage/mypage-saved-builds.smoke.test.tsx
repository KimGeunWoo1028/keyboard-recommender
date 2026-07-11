import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SavedRecommendationItem } from "@/lib/api/saved-recommendations";

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
    },
    metadata: {},
    ...partial,
  };
}

describe("MyPageSavedBuilds smoke", () => {
  it("shows empty state when no bookmarks", () => {
    render(<MyPageSavedBuilds items={[]} removingKeys={new Set()} onRemove={vi.fn()} />);
    expect(screen.getByText(/아직 저장한 빌드가 없습니다/)).toBeInTheDocument();
  });

  it("renders master–detail with restore and delete actions", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(<MyPageSavedBuilds items={[saved()]} removingKeys={new Set()} onRemove={onRemove} />);

    expect(screen.getByRole("listbox", { name: "저장한 빌드 목록" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추천 결과 다시 보기" })).toBeInTheDocument();
    expect(screen.getByText("스위치")).toBeInTheDocument();
    expect(screen.getByText("Oil King")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(screen.getByText("저장한 빌드를 삭제할까요?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "삭제하기" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
