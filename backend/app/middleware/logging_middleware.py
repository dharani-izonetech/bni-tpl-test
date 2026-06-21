"""
HTTP request/response logging middleware.
"""
import time
import logging
from fastapi import Request

logger = logging.getLogger("bni.access")


async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %d  (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed,
    )
    return response
