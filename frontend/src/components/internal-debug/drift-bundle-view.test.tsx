import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DriftBundleView } from "./drift-bundle-view";

vi.mock("@/lib/debug-api", () => ({
  internalDebugFetch: vi.fn(),
}));

import { internalDebugFetch } from "@/lib/debug-api";

const sampleBundle = {
  schemaVersion: "evaluation.drift_bundle.v1",
  status: "ok",
  scenarioId: "all_scenarios",
  window: 48,
  summaryLines: ["Linear switch dominance increased this week."],
  trends: {
    diversityIntervention: { twoWindowTrend: "down", coefficientOfVariation: 0.12 },
  },
  metricsTableRecent: [{ diversityIntervention: 0.4, rerankingDistortionIndex: 0.1 }],
  confidenceSeries: [{ runId: "r1", recordedAt: "2026-01-01", overall: 0.9, label: "x" }],
  switchFamilyCounts: { linear: 5, tactile: 2 },
  benchmarkRuns: [
    {
      id: "b1",
      createdAt: "2026-01-02",
      baselineLabel: "A",
      treatmentLabel: "B",
      narrativePreview: ["delta note"],
    },
  ],
};

describe("DriftBundleView", () => {
  beforeEach(() => {
    vi.mocked(internalDebugFetch).mockResolvedValue(
      new Response(JSON.stringify(sampleBundle), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders operational summary lines after fetch", async () => {
    render(<DriftBundleView focus="overview" />);
    await waitFor(() => {
      expect(screen.getByText(/Linear switch dominance increased this week/)).toBeInTheDocument();
    });
    expect(internalDebugFetch).toHaveBeenCalledWith(expect.stringContaining("/drift/summary?"));
  });

  it("families focus shows switch family table without summary block", async () => {
    render(<DriftBundleView focus="families" />);
    await waitFor(() => {
      expect(screen.getByText("Switch family frequency (winner)")).toBeInTheDocument();
    });
    expect(screen.getByText("linear")).toBeInTheDocument();
    expect(screen.queryByText(/Linear switch dominance/)).not.toBeInTheDocument();
  });
});
