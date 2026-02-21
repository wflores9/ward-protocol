"""
XRPL Client tests
"""
import pytest


class TestXRPLClientModule:
    """Test XRPL client module"""
    
    def test_module_import(self):
        """Test that xrpl_client module can be imported"""
        import core.xrpl_client
        assert core.xrpl_client is not None
    
    def test_ward_xrpl_client_exists(self):
        """Test that WardXRPLClient class exists"""
        from core.xrpl_client import WardXRPLClient
        assert WardXRPLClient is not None
    
    def test_connection_pool_exists(self):
        """Test that XRPLConnectionPool class exists"""
        from core.xrpl_client import XRPLConnectionPool
        assert XRPLConnectionPool is not None
