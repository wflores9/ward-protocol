"""
XLS-80 Permissioned Domains and XLS-70 Credentials Integration Tests
"""
import pytest


class TestPermissionedDomains:
    """Test XLS-80 Permissioned Domains"""
    
    def test_domain_manager_import(self):
        """Test that PermissionedDomainManager can be imported"""
        from core.permissioned_domains import PermissionedDomainManager
        assert PermissionedDomainManager is not None
    
    def test_domain_id_generation(self):
        """Test DomainID generation logic"""
        from core.permissioned_domains import PermissionedDomainManager
        from xrpl.asyncio.clients import AsyncWebsocketClient
        
        # Create manager (client won't be used for this test)
        client = AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233")
        manager = PermissionedDomainManager(client)
        
        # Test domain ID generation
        domain_id = manager.generate_domain_id(
            owner="rTestAccount123",
            sequence=1
        )
        
        assert domain_id is not None
        assert len(domain_id) == 64  # SHA512 hash truncated to 64 chars
        assert isinstance(domain_id, str)


class TestCredentialChecker:
    """Test XLS-70 Credential Verification"""
    
    def test_credential_checker_import(self):
        """Test that CredentialChecker can be imported"""
        from core.credential_checker import CredentialChecker
        assert CredentialChecker is not None
    
    def test_cache_key_generation(self):
        """Test credential cache key generation"""
        from core.credential_checker import CredentialChecker
        from xrpl.asyncio.clients import AsyncWebsocketClient
        
        client = AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233")
        checker = CredentialChecker(client)
        
        cache_key = checker._get_cache_key(
            account="rAccount123",
            issuer="rIssuer456",
            credential_type="KYC_VERIFIED"
        )
        
        assert cache_key == "rAccount123:rIssuer456:KYC_VERIFIED"
    
    def test_cache_management(self):
        """Test credential cache clearing"""
        from core.credential_checker import CredentialChecker
        from xrpl.asyncio.clients import AsyncWebsocketClient
        
        client = AsyncWebsocketClient("wss://s.altnet.rippletest.net:51233")
        checker = CredentialChecker(client)
        
        # Clear cache should not error
        checker.clear_cache()
        assert len(checker.cache) == 0
