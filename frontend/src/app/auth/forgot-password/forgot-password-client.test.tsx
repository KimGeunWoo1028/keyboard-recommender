import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";

const requestPasswordResetMock = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
}));

import {
  ForgotPasswordClient,
  PASSWORD_RESET_REQUEST_SUCCESS,
} from "./forgot-password-client";

describe("ForgotPasswordClient", () => {
  beforeEach(() => {
    requestPasswordResetMock.mockReset();
  });

  it("renders one H1 and the login return link", () => {
    render(<ForgotPasswordClient />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("비밀번호 재설정");
    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute(
      "href",
      "/auth?force=1",
    );
    expect(screen.getByRole("button", { name: "재설정 링크 받기" })).toBeInTheDocument();
  });

  it("shows a uniform success message that does not reveal account existence", async () => {
    const user = userEvent.setup();
    requestPasswordResetMock.mockResolvedValue({ accepted: true, delivery: "masked" });

    render(<ForgotPasswordClient />);
    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByTestId("e2e-forgot-password-success")).toHaveTextContent(
      PASSWORD_RESET_REQUEST_SUCCESS,
    );
    expect(screen.queryByText(/가입되지 않은/)).not.toBeInTheDocument();
  });

  it("uses the same success copy for smtp delivery", async () => {
    const user = userEvent.setup();
    requestPasswordResetMock.mockResolvedValue({ accepted: true, delivery: "smtp" });

    render(<ForgotPasswordClient />);
    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByTestId("e2e-forgot-password-success")).toHaveTextContent(
      PASSWORD_RESET_REQUEST_SUCCESS,
    );
  });

  it("maps 422 to Korean and keeps submit retryable", async () => {
    const user = userEvent.setup();
    requestPasswordResetMock.mockRejectedValue(new ApiError(422, "Invalid email"));

    render(<ForgotPasswordClient />);
    await user.type(screen.getByLabelText("이메일"), "not-an-email@x");
    await user.click(screen.getByRole("button", { name: "재설정 링크 받기" }));

    expect(await screen.findByTestId("e2e-forgot-password-error")).toHaveTextContent(
      "올바른 이메일 주소를 입력해 주세요.",
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "재설정 링크 받기" })).not.toBeDisabled();
    });
  });
});
