import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

describe("NotFound page", () => {
  it("renders Korean copy and recovery CTAs", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { level: 1, name: "페이지를 찾을 수 없어요" })).toBeInTheDocument();
    expect(screen.getByText(/주소가 잘못되었거나 페이지가 이동되었을 수 있어요/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 돌아가기" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "설문 시작" })).toHaveAttribute("href", "/recommend");
    expect(screen.getByRole("link", { name: "카탈로그 둘러보기" })).toHaveAttribute("href", "/catalog");
  });
});
