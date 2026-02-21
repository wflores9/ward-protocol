"""
Authentication tests
"""
import pytest
from core.auth import create_access_token, verify_token, APIKeyManager


class TestJWTTokens:
    """Test JWT token creation and verification"""
    
    def test_create_access_token(self):
        """Test JWT token creation"""
        data = {"sub": "test_user"}
        token = create_access_token(data)
        assert token is not None
        assert isinstance(token, str)
    
    def test_verify_valid_token(self):
        """Test valid token verification"""
        data = {"sub": "test_user"}
        token = create_access_token(data)
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "test_user"
    
    def test_verify_invalid_token(self):
        """Test invalid token rejection"""
        invalid_token = "invalid.token.here"
        with pytest.raises(Exception):
            verify_token(invalid_token)


class TestAPIKeyManager:
    """Test API key management"""
    
    def test_verify_valid_admin_key(self):
        """Test admin API key verification"""
        manager = APIKeyManager()
        key_info = manager.verify_key("ward_admin_2026")
        assert key_info is not None
        assert "*" in key_info["permissions"]
    
    def test_verify_invalid_key(self):
        """Test invalid API key rejection"""
        manager = APIKeyManager()
        key_info = manager.verify_key("invalid_key_123")
        assert key_info is None
    
    def test_get_valid_keys(self):
        """Test getting list of valid API keys"""
        manager = APIKeyManager()
        keys = manager.get_valid_keys()
        # get_valid_keys returns a dict, not a list
        assert isinstance(keys, dict)
        assert len(keys) >= 3  # admin, monitor, underwriter
        # Check that admin key exists and has permissions
        admin_key = keys.get("ward_admin_2026")
        assert admin_key is not None
        assert "*" in admin_key["permissions"]
