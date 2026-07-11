"""In-process TTL caches for recommendation and evaluation-heavy computations."""

from __future__ import annotations

import json
import threading
import time
from collections.abc import Mapping
from copy import deepcopy
from typing import Any


class TtlCache:
    def __init__(self, *, max_size: int = 512, ttl_seconds: int = 60) -> None:
        self._max_size = max(1, int(max_size))
        self._ttl_seconds = max(1, int(ttl_seconds))
        self._lock = threading.Lock()
        self._items: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        now = time.monotonic()
        with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            expires_at, value = item
            if expires_at <= now:
                self._items.pop(key, None)
                return None
            return deepcopy(value)

    def set(self, key: str, value: Any) -> None:
        now = time.monotonic()
        with self._lock:
            if len(self._items) >= self._max_size:
                self._evict_one(now)
            self._items[key] = (now + self._ttl_seconds, deepcopy(value))

    def _evict_one(self, now: float) -> None:
        expired = [k for k, (exp, _) in self._items.items() if exp <= now]
        if expired:
            self._items.pop(expired[0], None)
            return
        if self._items:
            oldest_key = min(self._items.items(), key=lambda kv: kv[1][0])[0]
            self._items.pop(oldest_key, None)


def stable_json_key(payload: Mapping[str, Any]) -> str:
    return json.dumps(dict(payload), sort_keys=True, separators=(",", ":"), ensure_ascii=False)

