# Operational Runbook

This runbook is for handling production or staging incidents quickly and safely.

## Incident classes

- recommendation API errors (5xx, latency spikes)
- evaluation ingestion failures
- drift-induced quality degradation
- background queue/batch lag

## Rollback procedures

Use reversible feature flags first (no redeploy):

1. Disable feedback weighting path:
   - `ENABLE_FEEDBACK_LEARNING_MVP=false`
   - Staging verify before enabling: [docs/staging-feedback-learning-mvp.md](../../docs/staging-feedback-learning-mvp.md)
   - Local dry-run: `python scripts/verify_feedback_learning_mvp.py --dry-run-local`
2. Disable operational automation if unstable:
   - `ENABLE_OPERATIONAL_AUTOMATION=false`
3. Disable async/batch optimizations if suspected:
   - `ENABLE_ASYNC_DIAGNOSTICS_OFFLOAD=false`
   - `ENABLE_BATCH_EVALUATION_PIPELINE=false`
4. Reduce scaling complexity:
   - `SCALING_PROFILE=low` or `SCALING_PROFILE=custom` with conservative values

Restart API and verify compute endpoint health.

## Debugging procedures

1. Confirm health endpoint and DB connectivity.
2. Run fixed compute payload.
3. Check logs for:
   - `evaluation_persistence_failed`
   - `unified_event_batch_flush_failed`
   - operational threshold alert logs
4. Run targeted tests:

```bash
pytest -q tests/recommendation_regression tests/snapshot_testing tests/benchmark_validation
```

## Failure handling guide

### Recommendation compute returns 5xx

- Immediately switch to safe mode:
  - disable feedback MVP and operational automation
- Check last config change and server restart state
- If a known regression is identified, roll back to previous release branch

### Evaluation writes fail but compute works

- Keep serving recommendations (fail-open design)
- Disable heavy persistence knobs if DB pressure is high
- Capture logs and replay events later if needed

### Batch queue lag increases

- Temporarily disable batch mode (`ENABLE_BATCH_EVALUATION_PIPELINE=false`)
- Move to direct event writes until DB throughput stabilizes
- Tune `EVALUATION_BATCH_SIZE` and flush interval afterward

### Drift/quality degradation detected

- Inspect threshold window and benchmark deltas
- Apply operational rollback flags
- Compare current metrics against previous known-good snapshots

### `degradedReason` on successful compute (resilient fallback)

Symptom: API returns **200** with picks, but response includes `degradedReason` (typically `full_mode_compute_failed`) and `runMode: "quick"`.

This is **not** the removed user quick-recommendation feature. Full compute failed once; the service retried with `_resilient_degraded_flags()` (`resilient_degraded_v1`).

**Triage:**

1. Search logs for `full_mode_compute_failed_fallback_to_degraded` (includes `request_id` / `scenario_id`).
2. Reproduce with the same survey payload via `POST /recommendations/compute` or debug inspect.
3. Check whether the failure is transient (DB timeout, feedback MVP, operational flags) or a regression in trait/build selection.
4. Review recent deploys and `ENABLE_OPERATIONAL_AUTOMATION` / feedback MVP toggles.

**Mitigation:**

| Action | When |
|--------|------|
| Fix root cause in full path | Preferred — degraded path disables rerank/feedback weighting |
| `ENABLE_FEEDBACK_LEARNING_MVP=false` | Suspect feedback DB reads on full path |
| `ENABLE_OPERATIONAL_AUTOMATION=false` | Suspect bad operational runtime flags |
| `enable_resilient_compute_fallback=false` | **Last resort** — full failures become 5xx instead of degraded results |

**User-facing:** Frontend shows «안정 모드로 추천했어요». Do not reintroduce «빠른 추천» copy; document as availability fallback.

**Monitoring:** Count `interaction.degraded_fallback` / `degradedReason` in `eval_events`; alert if rate spikes after a release.

## Post-incident checklist

1. Record timeline and root cause.
2. Add or update regression tests.
3. Add monitoring/alert thresholds if missing.
4. Update this runbook and architecture notes for the new failure mode.
