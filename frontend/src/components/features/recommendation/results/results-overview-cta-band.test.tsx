import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ResultsOverviewCtaBand,
  overviewCtaBandCopy,
  overviewCtaSaveLabel,
} from "./results-overview-cta-band";

describe("overviewCtaSaveLabel", () => {
  it("uses short Manus-style labels", () => {
    expect(overviewCtaSaveLabel({ authReady: true, saveState: "idle" })).toBe("저장하기");
    expect(overviewCtaSaveLabel({ authReady: true, saveState: "saved" })).toBe("저장됨 ✓");
    expect(overviewCtaSaveLabel({ authReady: true, saveState: "saving" })).toBe("저장 중…");
  });
});

describe("overviewCtaBandCopy", () => {
  it("switches copy for guest, saved, and error states", () => {
    expect(overviewCtaBandCopy({ isAuthenticated: false, saveState: "idle" }).subtitle).toMatch(
      /로그인하면 계정에 보관/,
    );
    expect(overviewCtaBandCopy({ isAuthenticated: true, saveState: "saved" }).title).toBe("저장했어요");
    expect(
      overviewCtaBandCopy({
        isAuthenticated: true,
        saveState: "saved",
        saveMessage: "계정에 저장했습니다.",
      }).subtitle,
    ).toBe("계정에 저장했습니다.");
    expect(overviewCtaBandCopy({ isAuthenticated: true, saveState: "error" }).title).toBe(
      "저장하지 못했어요",
    );
  });
});

describe("ResultsOverviewCtaBand", () => {
  it("renders pre-save authenticated band with save and catalog CTAs", () => {
    render(
      <ResultsOverviewCtaBand
        isAuthenticated
        authReady
        saveState="idle"
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-overview-cta-band")).toBeInTheDocument();
    expect(screen.getByText("이 조합이 마음에 드시나요?")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-overview-cta-save")).toHaveTextContent("저장하기");
    expect(screen.getByTestId("e2e-overview-cta-catalog")).toHaveAttribute("href", "/catalog?from=results");
    expect(screen.queryByTestId("e2e-save-login-link")).not.toBeInTheDocument();
  });

  it("renders guest band with login and catalog CTAs", () => {
    render(
      <ResultsOverviewCtaBand
        isAuthenticated={false}
        authReady
        saveState="idle"
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-save-login-link")).toHaveTextContent("로그인");
    expect(screen.queryByTestId("e2e-overview-cta-save")).not.toBeInTheDocument();
  });

  it("renders saved authenticated band with mypage CTA", () => {
    render(
      <ResultsOverviewCtaBand
        isAuthenticated
        authReady
        saveState="saved"
        saveMessage="계정에 저장했습니다."
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByText("저장했어요")).toBeInTheDocument();
    expect(screen.getByText("계정에 저장했습니다.")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-save-mypage-link")).toHaveTextContent("마이페이지에서 보기");
    expect(screen.queryByTestId("e2e-overview-cta-save")).not.toBeInTheDocument();
  });

  it("surfaces save error feedback in the band", () => {
    render(
      <ResultsOverviewCtaBand
        isAuthenticated
        authReady
        saveState="error"
        saveMessage="네트워크 연결을 확인한 뒤 다시 시도해 주세요"
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-save-feedback")).toHaveRole("alert");
    expect(screen.getByTestId("e2e-save-feedback")).toHaveTextContent(
      "네트워크 연결을 확인한 뒤 다시 시도해 주세요",
    );
    expect(screen.getByTestId("e2e-overview-cta-save")).toHaveTextContent("다시 저장");
  });
});
