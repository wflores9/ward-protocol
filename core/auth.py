"""
Enterprise authentication and authorization system
Supports JWT tokens and API key authentication
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import structlog
import os
from dotenv import load_dotenv

load_dotenv()

logger = structlog.get_logger()

# Security Configuration from environment
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY must be set in environment")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# ============================================================================
# JWT TOKEN MANAGEMENT
# ============================================================================

def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token with expiration
    
    Args:
        data: Payload data (must include 'sub' for user identifier)
        expires_delta: Custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    logger.info("access_token_created",
               subject=data.get("sub"),
               expires_at=expire.isoformat())
    
    return encoded_jwt


def verify_token(token: str) -> Dict:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        logger.debug("token_verified", subject=payload.get("sub"))
        
        return payload
        
    except jwt.ExpiredSignatureError:
        logger.warning("token_expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        logger.warning("token_verification_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """
    FastAPI dependency to extract and verify current user from JWT
    
    Usage:
        @app.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            return {"user_id": user["user_id"]}
    
    Returns:
        User information dictionary
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    logger.info("user_authenticated",
               user_id=user_id,
               role=payload.get("role", "user"))
    
    return {
        "user_id": user_id,
        "role": payload.get("role", "user"),
        "permissions": payload.get("permissions", [])
    }


# ============================================================================
# API KEY AUTHENTICATION
# ============================================================================

class APIKeyManager:
    """
    Manages API key authentication for service-to-service communication
    
    Keys loaded from environment variables (production: move to database)
    """
    
    @classmethod
    def get_valid_keys(cls) -> Dict[str, Dict]:
        """Load API keys from environment"""
        return {
            os.getenv("API_KEY_ADMIN", "ward_admin_2026"): {
                "name": "Ward Admin Key",
                "role": "admin",
                "permissions": ["*"],
                "created": "2026-02-20"
            },
            os.getenv("API_KEY_MONITOR", "ward_monitor_2026"): {
                "name": "Vault Monitor Service",
                "role": "monitor",
                "permissions": ["vault:read", "vault:monitor"],
                "created": "2026-02-20"
            },
            os.getenv("API_KEY_UNDERWRITER", "ward_underwriter_2026"): {
                "name": "Insurance Underwriter",
                "role": "underwriter",
                "permissions": ["policy:create", "policy:read", "claim:validate"],
                "created": "2026-02-20"
            }
        }
    
    @classmethod
    def verify_key(cls, api_key: str) -> Optional[Dict]:
        """Verify API key and return key metadata"""
        return cls.get_valid_keys().get(api_key)


async def verify_api_key(x_api_key: str = Header(None)) -> Dict:
    """
    FastAPI dependency for API key authentication
    
    Usage:
        @app.get("/admin")
        async def admin_route(auth: dict = Depends(verify_api_key)):
            return {"authorized": True}
    
    Returns:
        API key metadata
    """
    if not x_api_key:
        logger.warning("api_key_missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    key_data = APIKeyManager.verify_key(x_api_key)
    
    if not key_data:
        logger.warning("api_key_invalid", key_prefix=x_api_key[:10])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    logger.info("api_key_authenticated",
               name=key_data["name"],
               role=key_data["role"])
    
    return key_data


# ============================================================================
# PERMISSION CHECKING
# ============================================================================

def require_permission(permission: str):
    """
    Decorator factory for permission-based authorization
    
    Usage:
        @app.post("/policies")
        @require_permission("policy:create")
        async def create_policy(user: dict = Depends(get_current_user)):
            ...
    """
    def permission_checker(user: Dict = Depends(get_current_user)) -> Dict:
        user_permissions = user.get("permissions", [])
        
        # Admin has all permissions
        if "*" in user_permissions:
            return user
        
        if permission not in user_permissions:
            logger.warning("permission_denied",
                         user_id=user.get("user_id"),
                         required_permission=permission,
                         user_permissions=user_permissions)
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission} required"
            )
        
        return user
    
    return permission_checker


# ============================================================================
# PASSWORD UTILITIES
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# STARTUP INITIALIZATION
# ============================================================================

def log_auth_configuration():
    """Log authentication configuration on startup"""
    logger.info("auth_system_initialized",
               jwt_algorithm=ALGORITHM,
               token_expiry_minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
               api_keys_loaded=len(APIKeyManager.get_valid_keys()),
               secret_key_configured=bool(SECRET_KEY),
               features=["jwt_tokens", "api_keys", "rbac", "permissions", "env_config"])
