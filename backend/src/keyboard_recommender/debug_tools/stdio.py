"""Best-effort UTF-8 stdio on Windows consoles (avoids cp949 UnicodeEncodeError)."""

from __future__ import annotations

import sys


def ensure_utf8_stdio() -> None:
    """Reconfigure stdout/stderr to UTF-8 when the runtime supports it."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except (OSError, ValueError, AttributeError):
                pass
