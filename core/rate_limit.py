"""
Rate limiting middleware for DDoS protection and fair usage
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
import structlog

logger = structlog.get_logger()

# Initialize limiter with client IP detection
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/hour"]  # Default rate limit
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit violations
    Logs attempts and returns structured error response
    """
    client_ip = get_remote_address(request)
    
    logger.warning("rate_limit_exceeded",
                  client_ip=client_ip,
                  path=request.url.path,
                  method=request.method,
                  limit=str(exc.detail))
    
    return Response(
        content='{"error": "Rate limit exceeded", "detail": "Too many requests"}',
        status_code=429,
        media_type="application/json",
        headers={"Retry-After": "60"}
    )


# Rate limit tiers for different authentication levels
RATE_LIMITS = {
    "public": "100/minute",           # Unauthenticated requests
    "authenticated": "1000/minute",   # JWT authenticated users
    "api_key": "5000/minute",         # API key holders
    "admin": "10000/minute",          # Administrator access
    "internal": "unlimited"           # Internal service calls
}


def get_rate_limit_tier(user_role: str = None) -> str:
    """
    Get appropriate rate limit based on user authentication tier
    
    Args:
        user_role: User role from authentication (None for public)
    
    Returns:
        Rate limit string (e.g., "1000/minute")
    """
    if user_role is None:
        return RATE_LIMITS["public"]
    
    return RATE_LIMITS.get(user_role, RATE_LIMITS["authenticated"])


def log_rate_limit_config():
    """Log rate limiting configuration on startup"""
    logger.info("rate_limiting_initialized",
               tiers=RATE_LIMITS,
               key_func="client_ip")
