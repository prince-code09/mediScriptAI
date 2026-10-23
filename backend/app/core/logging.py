import logging
import re
import sys
from typing import Any

# Patterns to redact from logs
SENSITIVE_PATTERNS = [
    (re.compile(r'Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*', re.IGNORECASE), 'Bearer [REDACTED_TOKEN]'),
    (re.compile(r'(api_key|apikey|secret|password|jwt|token)["\']?\s*[:=]\s*["\']?[A-Za-z0-9\-_\.]+["\']?', re.IGNORECASE), r'\1: [REDACTED]'),
    (re.compile(r'(\b\d{10}\b)'), '[REDACTED_PHONE]'),  # 10-digit Indian phone numbers
]

class HealthcareSafeFormatter(logging.Formatter):
    """
    Log formatter that scrubs sensitive credentials, authorization tokens,
    and phone numbers from operational logs.
    """
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = original
        for pattern, replacement in SENSITIVE_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)
        return sanitized

def setup_logging(log_level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("mediscript")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = HealthcareSafeFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger

logger = setup_logging()
