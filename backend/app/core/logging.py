"""Настройка логирования. Фильтр вычищает из сообщений всё, похожее на токены (JWT, refresh_token)."""

import logging
import re

_SECRET_PATTERNS = [
    # JWT-подобные строки: три base64url-блока через точку
    re.compile(r"eyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]{5,}"),
    # refresh_token=..., "refresh_token": "...", token=...
    re.compile(r"(?i)(refresh_token|access_token|token)(\"?\s*[:=]\s*\"?)([^\s\"&,;]+)"),
]


def redact(text: str) -> str:
    text = _SECRET_PATTERNS[0].sub("[REDACTED]", text)
    return _SECRET_PATTERNS[1].sub(lambda m: f"{m.group(1)}{m.group(2)}[REDACTED]", text)


class RedactSecretsFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            message = record.getMessage()
        except Exception:  # pragma: no cover - битый format в чужой библиотеке
            return True
        cleaned = redact(message)
        if cleaned != message:
            record.msg = cleaned
            record.args = ()
        return True


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
    handler.addFilter(RedactSecretsFilter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.upper())

    # uvicorn пишет свои логи через собственные хендлеры — фильтруем и их (access-лог содержит URL).
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        for h in logging.getLogger(name).handlers:
            h.addFilter(RedactSecretsFilter())
    # itdpy и urllib3 на DEBUG логируют заголовки/куки — держим их не ниже WARNING.
    for name in ("itdpy", "urllib3", "httpx"):
        logging.getLogger(name).setLevel(logging.WARNING)
