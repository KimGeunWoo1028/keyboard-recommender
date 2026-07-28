import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultsOverviewCtaBand, overviewCtaSaveLabel } from "./results-overview-cta-band";

describe("overviewCtaSaveLabel", () => {
  it("uses short Manus-style labels", () => {
    expect(overviewCtaSaveLabel({ authReady: true, saveState: "idle" })).toBe("저장하기");
    expect(overviewCtaSaveLabel({ authReady: true, saveState: "saved" })).toBe("저장됨 ✓");
    expect(overviewCtaSaveLabel({ authReady: true, saveState: "saving" })).toBe("저장 중…");
  });
});

describe("ResultsOverviewCtaBand", () => {
  it("renders indigo band with save and catalog CTAs", () => {
    render(
      <ResultsOverviewCtaBand
        isAuthenticated={false}
        authReady
        saveState="idle"
        onSaveBuild={vi.fn()}
      />,
    );

    expect(screen.getByTestId("e2e-overview-cta-band")).toBeInTheDocument();
    expect(screen.getByText("이 조합이 마음에 드시나요?")).toBeInTheDocument();
    expect(screen.getByTestId("e2e-overview-cta-save")).toHaveTextContent("저장하기");
    expect(screen.getByTestId("e2e-overview-cta-catalog")).toHaveAttribute("href", "/catalog?from=results");
  });
});
