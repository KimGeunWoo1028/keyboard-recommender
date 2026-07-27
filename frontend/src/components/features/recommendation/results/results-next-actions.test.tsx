import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RecommendedBuild } from "@/types/recommendation";

import { ResultsNextActions, saveButtonLabel } from "./results-next-actions";

const build = {
  id: "b1",
  title: "테스트 조합",
  summary: "요약",
  components: { switch: "Peach" },
} as unknown as RecommendedBuild;

describe("saveButtonLabel", () => {
  it("matches guest / auth / state contracts", () => {
    expect(
      saveButtonLabel({ authReady: true, isAuthenticated: false, saveState: "idle" }),
    ).toBe("이 브라우저에 저장");
    expect(
      saveButtonLabel({ authReady: true, isAuthenticated: true, saveState: "idle" }),
    ).toBe("이 결과 저장");
    expect(
      saveButtonLabel({ authReady: true, isAuthenticated: true, saveState: "saving" }),
    ).toBe("저장 중…");
    expect(
      saveButtonLabel({ authReady: true, isAuthenticated: true, saveState: "saved" }),
    ).toBe("저장됨");
    expect(
      saveButtonLabel({ authReady: true, isAuthenticated: true, saveState: "error" }),
    ).toBe("다시 저장");
  });
});

describe("ResultsNextActions", () => {
  it("renders save as primary before shop secondary", () => {
    render(
      <ResultsNextActions
        build={build}
        apiPicks={[{ domain: "switch", itemId: "sw-1", sourceUrl: "https://www.swagkey.kr/x" }]}
        enrichedSourceUrls={{}}
        isAuthenticated={false}
        authReady
        saveState="idle"
        onSaveBuild={vi.fn()}
      />,
    );

    const save = screen.getByTestId("e2e-save-build");
    const shop = screen.getByTestId("e2e-results-shop-link");
    expect(save).toHaveTextContent("이 브라우저에 저장");
    expect(shop).toHaveAttribute("rel", "noopener noreferrer");
    expect(shop).toHaveAttribute("target", "_blank");
    expect(shop.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByText(/이 기기의 브라우저에 저장돼요/)).toBeInTheDocument();
  });

  it("shows account hint and saved label when authenticated", () => {
    render(
      <ResultsNextActions
        build={build}
        apiPicks={[]}
        enrichedSourceUrls={{}}
        isAuthenticated
        authReady
        saveState="saved"
        saveScope="account"
        saveMessage="마이페이지에 저장했습니다."
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-save-build")).toHaveTextContent("저장됨");
    expect(screen.getByTestId("e2e-save-build")).toBeDisabled();
    expect(screen.getByText("마이페이지에 저장했습니다.")).toBeInTheDocument();
  });

  it("keeps retry enabled on save error", () => {
    render(
      <ResultsNextActions
        build={build}
        apiPicks={[]}
        enrichedSourceUrls={{}}
        isAuthenticated
        authReady
        saveState="error"
        saveMessage=""
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-save-build")).toHaveTextContent("다시 저장");
    expect(screen.getByTestId("e2e-save-build")).not.toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했어요");
  });
});
