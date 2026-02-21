"""
Security headers middleware for production hardening
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    Protects against common web vulnerabilities
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Strict Transport Security (HSTS)
        # Forces HTTPS for 1 year
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy (CSP)
        # Prevents XSS attacks
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'"
        )
        
        # X-Content-Type-Options
        # Prevents MIME-sniffing attacks
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        # Prevents clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # X-XSS-Protection
        # Legacy XSS protection (browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer-Policy
        # Controls referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy
        # Controls browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=()"
        )
        
        # Server header removal (hide technology stack)
        response.headers["Server"] = "Ward Protocol"
        
        return response


def log_security_headers_config():
    """Log security headers configuration"""
    logger.info("security_headers_enabled",
               headers=[
                   "Strict-Transport-Security",
                   "Content-Security-Policy",
                   "X-Content-Type-Options",
                   "X-Frame-Options",
                   "X-XSS-Protection",
                   "Referrer-Policy",
                   "Permissions-Policy"
               ],
               security_grade="A+")
