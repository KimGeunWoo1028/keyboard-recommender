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
  it("locks the control and shows a spinner while loading", () => {
    render(
      <Button loading type="button">
        로그인 중…
      </Button>,
    );
    const button = screen.getByRole("button", { name: /로그인 중/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg.animate-spin")).toBeTruthy();
  });
});
