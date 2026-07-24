import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeWorkshopGuestPreview } from "./home-workshop-guest-preview";

describe("HomeWorkshopGuestPreview (Pass 2 HOME-01)", () => {
  it("shows a result-shaped experience teaser without fake scores", () => {
    render(<HomeWorkshopGuestPreview />);

    expect(screen.getByText("예시")).toBeInTheDocument();
    expect(screen.getByTestId("home-result-preview")).toHaveTextContent("설문 후 받게 되는 결과 형태");
    expect(screen.getByText("조용하고 부드러운 방향의 조합")).toBeInTheDocument();
    expect(screen.getByText("차분한 소리")).toBeInTheDocument();
    expect(screen.getByText("저소음 리니어")).toBeInTheDocument();
    expect(screen.getByText(/스위치부터 키캡까지 한 조합/)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/일치/)).not.toBeInTheDocument();
  });
});
