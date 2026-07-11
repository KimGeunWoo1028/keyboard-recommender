import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeLandingObserve } from "./home-landing-observe";

const emitHomeViewedEventBestEffort = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/api/onboarding-events", () => ({
  emitHomeViewedEventBestEffort: (...args: unknown[]) => emitHomeViewedEventBestEffort(...args),
}));

vi.mock("@/components/layout/auth-controls", () => ({
  useAuthHeader: vi.fn(),
}));

import { useAuthHeader } from "@/components/layout/auth-controls";

describe("HomeLandingObserve", () => {
  beforeEach(() => {
    emitHomeViewedEventBestEffort.mockClear();
    window.sessionStorage.clear();
    vi.mocked(useAuthHeader).mockReturnValue({
      user: null,
      authChecked: true,
      setUser: vi.fn(),
    });
  });

  it("emits home.viewed once per session for guests", async () => {
    render(<HomeLandingObserve />);
    await waitFor(() => {
      expect(emitHomeViewedEventBestEffort).toHaveBeenCalledTimes(1);
    });
    expect(emitHomeViewedEventBestEffort).toHaveBeenCalledWith({
      path: "/",
      auth: "guest",
    });
    expect(window.sessionStorage.getItem("kr_home_viewed_session")).toBe("1");

    render(<HomeLandingObserve />);
    await waitFor(() => {
      expect(emitHomeViewedEventBestEffort).toHaveBeenCalledTimes(1);
    });
  });

  it("waits until auth is checked", () => {
    vi.mocked(useAuthHeader).mockReturnValue({
      user: null,
      authChecked: false,
      setUser: vi.fn(),
    });
    render(<HomeLandingObserve />);
    expect(emitHomeViewedEventBestEffort).not.toHaveBeenCalled();
  });

  it("tags authenticated visits", async () => {
    vi.mocked(useAuthHeader).mockReturnValue({
      user: { id: "u1", email: "a@b.c", created_at: "2026-01-01T00:00:00Z" },
      authChecked: true,
      setUser: vi.fn(),
    });
    render(<HomeLandingObserve />);
    await waitFor(() => {
      expect(emitHomeViewedEventBestEffort).toHaveBeenCalledWith({
        path: "/",
        auth: "authenticated",
      });
    });
  });
});
