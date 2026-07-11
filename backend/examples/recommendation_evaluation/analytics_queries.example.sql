-- Example operational queries (PostgreSQL) for eval_* tables created by Alembic 003.
-- Adjust scenario_id / limits for your environment.

-- Metric history for a scenario (newest first)
SELECT r.id,
       r.created_at,
       m.trait_alignment,
       m.compatibility_stability,
       m.winner_trait_diversity
FROM eval_recommendation_runs r
JOIN eval_metrics m ON m.run_id = r.id
WHERE r.scenario_id = 'demo_scenario'
ORDER BY r.created_at DESC
LIMIT 50;

-- Confidence trail joined to runs
SELECT r.scenario_id,
       c.recorded_at,
       c.overall AS confidence_overall,
       c.label
FROM eval_confidence_samples c
JOIN eval_recommendation_runs r ON r.id = c.run_id
WHERE r.scenario_id = 'demo_scenario'
ORDER BY c.recorded_at DESC
LIMIT 50;

-- Recent evaluation events (audit / ingestion)
SELECT event_type, created_at, run_id, payload ->> 'schemaVersion' AS snapshot_schema
FROM eval_events
ORDER BY created_at DESC
LIMIT 100;

-- Benchmark reports stored for regression tracking
SELECT id, scenario_id, baseline_label, treatment_label, created_at
FROM eval_benchmark_runs
ORDER BY created_at DESC
LIMIT 20;
