"""Baseline safety: debug surface control, production log policy (non-blocking for core API)."""

from keyboard_recommender.infrastructure.safety.debug_guard import ProductionDebugBlockMiddleware
from keyboard_recommender.infrastructure.safety.log_policy import apply_runtime_log_policy, redact_log_extra

__all__ = [
    "ProductionDebugBlockMiddleware",
    "apply_runtime_log_policy",
    "redact_log_extra",
]
