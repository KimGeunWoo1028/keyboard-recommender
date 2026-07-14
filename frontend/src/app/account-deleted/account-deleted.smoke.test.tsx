import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AccountDeletedPage from "@/app/account-deleted/page";

describe("AccountDeletedPage", () => {
  it("shows completion copy and home CTA without card chrome", () => {
    render(<AccountDeletedPage />);
    expect(screen.getByTestId("e2e-account-deleted")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "회원탈퇴가 완료되었습니다" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로" })).toHaveAttribute("href", "/");
    expect(screen.queryByText(/마케팅|프로모션|뉴스레터/i)).not.toBeInTheDocument();
  });
});
