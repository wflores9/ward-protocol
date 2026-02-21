"""
Test suite for authentication and authorization
"""

import pytest
from core.auth import (
    create_access_token,
    verify_token,
    hash_password,
    verify_password,
    APIKeyManager
)


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token creation and verification"""
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        token = create_access_token({"sub": "test_user", "role": "admin"})
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50
    
    def test_verify_valid_token(self):
        """Test valid token verification"""
        token = create_access_token({"sub": "test_user", "role": "admin"})
        payload = verify_token(token)
        
        assert payload["sub"] == "test_user"
        assert payload["role"] == "admin"
        assert payload["type"] == "access"
    
    def test_verify_invalid_token(self):
        """Test invalid token rejection"""
        from fastapi import HTTPException
        
        with pytest.raises(HTTPException) as exc_info:
            verify_token("invalid_token_string")
        
        assert exc_info.value.status_code == 401


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password(self):
        """Test password hashing"""
        password = "test_password_123"
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 50
        assert hashed.startswith("$2b$")
    
    def test_verify_correct_password(self):
        """Test correct password verification"""
        password = "test_password_123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        """Test incorrect password rejection"""
        password = "test_password_123"
        hashed = hash_password(password)
        
        assert verify_password("wrong_password", hashed) is False


@pytest.mark.unit
class TestAPIKeyManager:
    """Test API key management"""
    
    def test_verify_valid_admin_key(self):
        """Test valid admin API key verification"""
        import os
        admin_key = os.getenv("API_KEY_ADMIN", "ward_admin_2026")
        key_data = APIKeyManager.verify_key(admin_key)
        
        assert key_data is not None
        assert key_data["role"] == "admin"
        assert "*" in key_data["permissions"]
    
    def test_verify_invalid_key(self):
        """Test invalid API key rejection"""
        key_data = APIKeyManager.verify_key("invalid_key_12345")
        
        assert key_data is None
    
    def test_get_valid_keys(self):
        """Test retrieving all valid keys"""
        keys = APIKeyManager.get_valid_keys()
        
        assert len(keys) >= 3
        assert all("role" in data for data in keys.values())
        assert all("permissions" in data for data in keys.values())
