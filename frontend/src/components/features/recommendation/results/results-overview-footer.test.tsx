import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsOverviewFooter } from "./results-overview-footer";

describe("ResultsOverviewFooter", () => {
  it("shows login and retake links for guests", () => {
    render(<ResultsOverviewFooter isAuthenticated={false} />);

    expect(screen.getByTestId("e2e-save-login-link")).toHaveTextContent("계정에 보관하려면 로그인");
    expect(screen.getByTestId("e2e-results-retake-link")).toHaveTextContent("설문 다시 하기");
  });

  it("hides login link when authenticated", () => {
    render(<ResultsOverviewFooter isAuthenticated />);

    expect(screen.queryByTestId("e2e-save-login-link")).not.toBeInTheDocument();
    expect(screen.getByTestId("e2e-results-retake-link")).toBeInTheDocument();
  });

  it("shows mypage link after authenticated save", () => {
    render(
      <ResultsOverviewFooter
        isAuthenticated
        saveState="saved"
        saveMessage="계정에 저장했습니다."
      />,
    );

    expect(screen.getByText("계정에 저장했습니다.")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-save-mypage-link")).toHaveTextContent("마이페이지에서 다시 보기");
    expect(screen.queryByTestId("e2e-save-login-link")).not.toBeInTheDocument();
  });

  it("surfaces save error feedback", () => {
    render(
      <ResultsOverviewFooter
        isAuthenticated
        saveState="error"
        saveMessage="네트워크 연결을 확인한 뒤 다시 시도해 주세요"
      />,
    );

    expect(screen.getByTestId("e2e-save-feedback")).toHaveRole("alert");
    expect(screen.getByTestId("e2e-save-feedback")).toHaveTextContent(
      "네트워크 연결을 확인한 뒤 다시 시도해 주세요",
    );
  });
});
