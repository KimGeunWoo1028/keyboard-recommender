import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";

const loginMock = vi.fn();
const fetchCurrentUserMock = vi.fn();
const setUserMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/layout/auth-controls", () => ({
  useAuthHeader: () => ({ user: null, authChecked: true, setUser: setUserMock }),
}));

vi.mock("@/lib/api/auth", () => ({
  login: (...args: unknown[]) => loginMock(...args),
  fetchCurrentUser: (...args: unknown[]) => fetchCurrentUserMock(...args),
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

describe("AuthPageClient login-only", () => {
  beforeEach(() => {
    loginMock.mockReset();
    fetchCurrentUserMock.mockReset();
    setUserMock.mockReset();
    replaceMock.mockReset();
    fetchCurrentUserMock.mockResolvedValue(null);
    window.history.pushState({}, "", "/auth");
  });

  it("shows login form and link to signup wizard", async () => {
    render(<AuthPageClient />);
    expect(screen.getByTestId("e2e-auth-submit")).toHaveTextContent("로그인");
    const signup = screen.getByTestId("e2e-auth-tab-signup");
    expect(signup).toHaveAttribute("href", expect.stringContaining("/auth/signup"));
    expect(signup).toHaveAttribute("href", expect.stringContaining("step=email"));
  });

  it("shows login error on failed login", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new ApiError(401, "Invalid email or password"));

    render(<AuthPageClient />);

    await user.type(screen.getByLabelText("이메일"), "a@b.com");
    await user.type(screen.getByLabelText("비밀번호"), "Password1!");
    await user.click(screen.getByTestId("e2e-auth-submit"));

    expect(await screen.findByTestId("e2e-auth-error")).toHaveTextContent(
      "이메일 또는 비밀번호가 올바르지 않습니다.",
    );
  });

  it("redirects ?mode=signup to signup wizard", async () => {
    window.history.pushState({}, "", "/auth?mode=signup&next=/results");
    render(<AuthPageClient />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/signup?step=email&next=%2Fresults");
    });
  });

  it("shows signup success notice when ?signup=1", async () => {
    window.history.pushState({}, "", "/auth?signup=1");
    render(<AuthPageClient />);
    expect(await screen.findByTestId("e2e-auth-login-notice")).toHaveTextContent(
      "계정이 생성되었습니다. 로그인해 주세요.",
    );
  });
});
