from __future__ import annotations

import json
import logging
from dataclasses import asdict
from urllib.error import URLError
from urllib.request import Request, urlopen

from keyboard_recommender.config.settings import Settings
from keyboard_recommender.infrastructure.safety.log_policy import redact_log_extra
from keyboard_recommender.recommendation_quality.operational_monitoring.threshold_evaluator import OperationalThresholdResult

logger = logging.getLogger(__name__)


def emit_operational_alert(
    settings: Settings,
    *,
    scenario_id: str | None,
    threshold_result: OperationalThresholdResult,
    action_lines: list[str],
) -> None:
    """Best-effort alerting: structured log + optional webhook, never raises."""
    if not settings.enable_operational_alerting:
        return
    payload = {
        "kind": "operational_automation_alert",
        "scenario_id": scenario_id,
        "breaches": {
            "confidence_drop": threshold_result.breached_confidence_drop,
            "diversity_collapse": threshold_result.breached_diversity_collapse,
            "compatibility_instability": threshold_result.breached_compatibility_instability,
            "reranking_distortion": threshold_result.breached_reranking_distortion,
        },
        "summary": asdict(threshold_result.summary),
        "actions": action_lines,
    }
    logger.warning("operational_automation_alert", extra=redact_log_extra(payload))
    hook = (settings.operational_alert_webhook_url or "").strip()
    if not hook:
        return
    try:
        req = Request(
            hook,
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload).encode("utf-8"),
        )
        with urlopen(req, timeout=2.5) as _resp:  # nosec B310: configurable internal webhook, best-effort
            pass
    except (URLError, TimeoutError, ValueError):
        logger.exception("operational_alert_webhook_failed", extra=redact_log_extra({"scenario_id": scenario_id}))
