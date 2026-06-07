"""Request activity logging — records who is doing what ('anon' if not logged in)."""

import logging

from starlette.requests import Request

from . import database as db
from .auth import get_current_user

logger = logging.getLogger("fiddlemachine.activity")

# API paths we don't want cluttering the activity log
_SKIP_EXACT = {
    "/api/admin/logs",   # viewing the log shouldn't log itself
    "/api/auth/me",      # frequent session-check poll, not a user action
    "/api/auth/debug",
}


def _should_log(path: str) -> bool:
    """Only log meaningful API requests."""
    if not path.startswith("/api/"):
        return False
    return path not in _SKIP_EXACT


async def log_request(request: Request, call_next):
    """Middleware: record each API request with the acting user's email or 'anon'."""
    response = await call_next(request)

    path = request.url.path
    if request.method != "OPTIONS" and _should_log(path):
        try:
            user = get_current_user(request)
        except Exception:
            user = None
        user_email = user.email if user else "anon"
        user_id = user.id if user else None
        ip = request.client.host if request.client else None

        logger.info("%s %s %s -> %s", user_email, request.method, path, response.status_code)
        try:
            db.insert_activity_log(
                user_email=user_email,
                user_id=user_id,
                action=request.method,
                detail=path,
                status=response.status_code,
                ip=ip,
            )
        except Exception:
            logger.exception("Failed to write activity log entry")

    return response
