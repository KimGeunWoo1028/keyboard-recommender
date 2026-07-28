import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";

const loginMock = vi.fn();
const signupMock = vi.fn();
const fetchCurrentUserMock = vi.fn();
const setUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/layout/auth-controls", () => ({
  useAuthHeader: () => ({ user: null, authChecked: true, setUser: setUserMock }),
}));

vi.mock("@/lib/api/auth", () => ({
  login: (...args: unknown[]) => loginMock(...args),
  signup: (...args: unknown[]) => signupMock(...args),
  fetchCurrentUser: (...args: unknown[]) => fetchCurrentUserMock(...args),
  checkDisplayNameAvailability: vi.fn(),
  sendSignupEmailCode: vi.fn(),
  verifySignupEmailCode: vi.fn(),
}));

import { AuthPageClient, friendlyAuthErrorMessage } from "./auth-page-client";

describe("friendlyAuthErrorMessage", () => {
  it("maps login 401 to Korean copy", () => {
    expect(
      friendlyAuthErrorMessage("login", new ApiError(401, "Invalid email or password")),
    ).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
  });

  it("maps signup 409 to Korean copy", () => {
    expect(friendlyAuthErrorMessage("signup", new ApiError(409, "already exists"))).toBe(
      "이미 가입된 이메일입니다.",
    );
  });
});

describe("AuthPageClient error isolation", () => {
  beforeEach(() => {
    loginMock.mockReset();
    signupMock.mockReset();
    fetchCurrentUserMock.mockReset();
    setUserMock.mockReset();
    fetchCurrentUserMock.mockResolvedValue(null);
  });

  it("clears login error when switching to signup", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new ApiError(401, "Invalid email or password"));

    render(<AuthPageClient />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("비밀번호"), "Password1!");
    await user.click(screen.getByTestId("e2e-auth-submit"));

    expect(await screen.findByTestId("e2e-auth-error")).toHaveTextContent(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );

    await user.click(screen.getByTestId("e2e-auth-tab-signup"));
    expect(screen.queryByTestId("e2e-auth-error")).not.toBeInTheDocument();
    expect(screen.queryByText("이메일 또는 비밀번호가 올바르지 않습니다.")).not.toBeInTheDocument();
  });

  it("does not paint a late login failure onto the signup tab", async () => {
    const user = userEvent.setup();
    let rejectLogin!: (err: unknown) => void;
    loginMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectLogin = reject;
        }),
    );

    render(<AuthPageClient />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("비밀번호"), "Password1!");
    await user.click(screen.getByTestId("e2e-auth-submit"));

    await user.click(screen.getByTestId("e2e-auth-tab-signup"));
    expect(screen.getByRole("tab", { name: "회원가입" })).toHaveAttribute("aria-selected", "true");

    rejectLogin(new ApiError(401, "Invalid email or password"));

    await waitFor(() => {
      expect(screen.queryByText("이메일 또는 비밀번호가 올바르지 않습니다.")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("e2e-auth-error")).not.toBeInTheDocument();
  });

  it("opens signup tab when ?mode=signup is present", async () => {
    window.history.pushState({}, "", "/auth?mode=signup");
    render(<AuthPageClient />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "회원가입" })).toHaveAttribute("aria-selected", "true");
    });
  });
});
