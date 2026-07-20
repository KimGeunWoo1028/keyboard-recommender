import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "./button";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("exposes a polite status when labeled", () => {
    render(<Spinner label="확인 중" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("확인 중")).toBeInTheDocument();
  });
});

describe("Button loading", () => {
  it("locks the control, keeps label width, and overlays a spinner", () => {
    const { rerender } = render(
      <Button type="button" data-testid="auth-btn">
        인증 확인
      </Button>,
    );
    const idle = screen.getByTestId("auth-btn");
    const idleWidth = idle.getBoundingClientRect().width;

    rerender(
      <Button loading type="button" data-testid="auth-btn">
        인증 확인
      </Button>,
    );
    const loading = screen.getByTestId("auth-btn");
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading.querySelector("svg.animate-spin")).toBeTruthy();
    expect(loading.getBoundingClientRect().width).toBe(idleWidth);
    expect(screen.getByText("인증 확인")).toBeInTheDocument();
  });
});
