import { ApiError, getPublicApiBase } from "@/lib/api/client";
import { getOrCreateClientSessionId } from "@/lib/api/saved-recommendations";
import { getOrCreateExperimentAssignments } from "@/lib/experiments";

type OnboardingEventName =
  | "onboarding.viewed"
  | "onboarding.style_selected"
  | "onboarding.prefilled_step_skipped"
  | "onboarding.step_completed"
  | "onboarding.generate_started"
  | "onboarding.completed"
  | "onboarding.abandoned";

type InteractionEventName = "interaction.refinement" | "interaction.results_tab_click";
type ResilienceEventName =
  | "interaction.retry"
  | "interaction.degraded_fallback"
  | "interaction.last_known_good_restore";
type VocabularyEventName = "interaction.nl_vocab_signal";
type KpiEventName = "kpi.time_to_first_result";
/** Home Landing entry — Phase 5 data prerequisite only (no Redirect/Dashboard unlock). */
type HomeEventName = "home.viewed";

async function emitUnifiedEventBestEffort(
  eventType:
    | OnboardingEventName
    | InteractionEventName
    | ResilienceEventName
    | VocabularyEventName
    | KpiEventName
    | HomeEventName,
  options: { scenarioId: string; metadata?: Record<string, unknown> },
): Promise<void> {
  const { scenarioId, metadata } = options;
  const base = getPublicApiBase();
  if (!base) return;
  const experiments = getOrCreateExperimentAssignments();
  const body = {
    events: [
      {
        request_id: globalThis.crypto?.randomUUID?.() ?? `req-${Date.now()}`,
        session_id: getOrCreateClientSessionId(),
        scenario_id: scenarioId,
        event_type: eventType,
        metadata: { ...(metadata ?? {}), experiments },
      },
    ],
  };
  try {
    const res = await fetch(`${base}/api/v1/recommendations/events`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ApiError(res.status, "Failed to persist onboarding event");
  } catch {
    // Best-effort analytics must never block onboarding.
  }
}

export async function emitOnboardingEventBestEffort(
  eventType: OnboardingEventName,
  metadata?: Record<string, unknown>,
): Promise<void> {
  return emitUnifiedEventBestEffort(eventType, { scenarioId: "onboarding_v1", metadata });
}

export async function emitRefinementEventBestEffort(metadata?: Record<string, unknown>): Promise<void> {
  return emitUnifiedEventBestEffort("interaction.refinement", { scenarioId: "results_refinement_v1", metadata });
}

export async function emitResilienceEventBestEffort(
  eventType: ResilienceEventName,
  metadata?: Record<string, unknown>,
): Promise<void> {
  return emitUnifiedEventBestEffort(eventType, { scenarioId: "resilience_v1", metadata });
}

export async function emitKpiEventBestEffort(
  eventType: KpiEventName,
  metadata?: Record<string, unknown>,
): Promise<void> {
  return emitUnifiedEventBestEffort(eventType, { scenarioId: "kpi_v1", metadata });
}

export async function emitNlVocabularySignalBestEffort(metadata?: Record<string, unknown>): Promise<void> {
  return emitUnifiedEventBestEffort("interaction.nl_vocab_signal", {
    scenarioId: "nl_vocab_v1",
    metadata,
  });
}

type ResultsUxEventName = "interaction.results_tab_click";

export async function emitResultsUxEventBestEffort(
  eventType: ResultsUxEventName,
  metadata?: Record<string, unknown>,
): Promise<void> {
  return emitUnifiedEventBestEffort(eventType, {
    scenarioId: "results_ux_v1",
    metadata,
  });
}

export async function emitHomeViewedEventBestEffort(metadata?: Record<string, unknown>): Promise<void> {
  return emitUnifiedEventBestEffort("home.viewed", {
    scenarioId: "home_landing_v1",
    metadata,
  });
}

