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
  it("renders save separate from single shop next-action (RES-04)", () => {
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
    expect(screen.getByText("결과 보관")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-results-next-action")).toBeInTheDocument();
    expect(shop).toHaveTextContent("이 조합 샵에서 보기");
    expect(shop).toHaveAttribute("rel", "noopener noreferrer");
    expect(shop).toHaveAttribute("target", "_blank");
    expect(shop.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByText(/이 브라우저에 임시 저장돼요/)).toBeInTheDocument();
    expect(screen.getByTestId("e2e-results-retake-link")).toHaveTextContent("설문 다시 하기");
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
        saveMessage="계정에 저장했습니다."
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-save-build")).toHaveTextContent("저장됨");
    expect(screen.getByTestId("e2e-save-build")).toBeDisabled();
    expect(screen.getByText("계정에 저장했습니다.")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-save-feedback")).toHaveAttribute("role", "status");
    const mypage = screen.getByTestId("e2e-save-mypage-link");
    expect(mypage).toHaveTextContent("마이페이지에서 다시 보기");
    expect(mypage).toHaveAttribute("href", "/mypage?section=saved");
    expect(screen.queryByTestId("e2e-save-login-link")).not.toBeInTheDocument();
  });

  it("guest saved points to login, not MyPage as reopen (RET-02)", () => {
    render(
      <ResultsNextActions
        build={build}
        apiPicks={[]}
        enrichedSourceUrls={{}}
        isAuthenticated={false}
        authReady
        saveState="saved"
        saveScope="local"
        saveMessage=""
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-save-feedback")).toHaveAttribute("role", "status");
    expect(screen.getByText(/이 브라우저에 임시 저장했어요/)).toBeInTheDocument();
    const login = screen.getByTestId("e2e-save-login-link");
    expect(login).toHaveTextContent("계정에 보관하려면 로그인");
    expect(login).toHaveAttribute("href", "/auth?mode=login");
    expect(screen.queryByTestId("e2e-save-mypage-link")).not.toBeInTheDocument();
    expect(screen.queryByText("저장한 결과 보기")).not.toBeInTheDocument();
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
