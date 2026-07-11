# Staging verification: `ENABLE_FEEDBACK_LEARNING_MVP`

Feature flag (`backend` settings): when `true`, recommendation compute may load recent `interaction.*` rows from `eval_events` and apply **bounded** adjustments (`feedbackLearning` on the API response).

Default is **`false`**. Enable only after verifying staging. **Production must stay off** until this checklist passes (Phase F-3).

## Local / CI dry-run (no staging host)

```cmd
cd backend
python scripts/verify_feedback_learning_mvp.py --dry-run-local
```

Checks:

1. Flag off → no part multipliers  
2. Flag on + empty window → no multipliers  
3. Seeded `interaction.click` → click boost multiplier

## Staging checklist

1. Set on staging env: `ENABLE_FEEDBACK_LEARNING_MVP=true` (and related tunables if needed; see `backend/.env.example`).
2. Restart API process / roll out.
3. Health:

```bash
curl -sS "$STAGING_API/health"
```

4. Compute smoke:

```cmd
cd backend
python scripts/verify_feedback_learning_mvp.py --base-url https://YOUR_STAGING_API
```

5. With real interaction history: perform click/save from the app, then recompute and confirm `feedbackLearning.applied` / `lines` / `personalizationMetrics` as expected.
6. Rollback: set `ENABLE_FEEDBACK_LEARNING_MVP=false`, restart, confirm `feedbackLearning` disappears or no longer applies multipliers.
7. Watch logs for `feedback_learning_load_failed` and latency regressions (see `backend/docs/runbook.md`).

## Related

- Tests: `backend/tests/test_feedback_learning_mvp.py`
- Pipeline: `backend/src/keyboard_recommender/recommendation_quality/feedback_learning/pipeline.py`
- Runbook rollback: `backend/docs/runbook.md`
