"""
Test suite for Ward Protocol API endpoints
"""

import pytest
from httpx import AsyncClient


@pytest.mark.unit
class TestPublicEndpoints:
    """Test public API endpoints"""
    
    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint returns correct status"""
        response = await client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "operational"
        assert data["version"] == "1.0.0"
        assert "grades" in data
        assert data["grades"]["security"] == "A+ (100/100)"
    
    async def test_health_endpoint(self, client: AsyncClient):
        """Test health check endpoint"""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert "systems" in data
        assert data["systems"]["database"]["status"] == "connected"
        assert data["security_grade"] == "A+ (100/100)"
    
    async def test_stats_endpoint(self, client: AsyncClient):
        """Test statistics endpoint"""
        response = await client.get("/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "protocol_statistics" in data
        assert "policies_issued" in data["protocol_statistics"]
        assert "xrpl_connected" in data


@pytest.mark.unit
class TestAuthentication:
    """Test authentication and authorization"""
    
    async def test_protected_endpoint_without_auth(self, client: AsyncClient):
        """Test protected endpoint rejects unauthenticated requests"""
        response = await client.get("/xrpl/status")
        
        assert response.status_code == 401
        data = response.json()
        assert "API key required" in data["detail"]
    
    async def test_protected_endpoint_with_invalid_auth(self, client: AsyncClient, invalid_headers):
        """Test protected endpoint rejects invalid API keys"""
        response = await client.get("/xrpl/status", headers=invalid_headers)
        
        assert response.status_code == 401
        data = response.json()
        assert "Invalid API key" in data["detail"]
    
    async def test_protected_endpoint_with_valid_auth(self, client: AsyncClient, admin_headers):
        """Test protected endpoint accepts valid API keys"""
        response = await client.get("/xrpl/status", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        assert "compliance_grade" in data
    
    async def test_admin_endpoint_requires_admin_role(self, client: AsyncClient, monitor_headers):
        """Test admin endpoints reject non-admin users"""
        response = await client.get("/admin/api-keys", headers=monitor_headers)
        
        assert response.status_code == 403
        data = response.json()
        assert "Admin access required" in data["detail"]
    
    async def test_admin_endpoint_with_admin_role(self, client: AsyncClient, admin_headers):
        """Test admin endpoints accept admin users"""
        response = await client.get("/admin/api-keys", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "api_keys" in data
        assert data["total"] >= 3


@pytest.mark.unit
class TestSecurityHeaders:
    """Test security headers are present"""
    
    async def test_security_headers_present(self, client: AsyncClient):
        """Test all security headers are set"""
        response = await client.get("/")
        
        # Check HSTS
        assert "strict-transport-security" in response.headers
        assert "max-age=31536000" in response.headers["strict-transport-security"]
        
        # Check CSP
        assert "content-security-policy" in response.headers
        
        # Check other headers
        assert "x-content-type-options" in response.headers
        assert "x-frame-options" in response.headers
        assert response.headers["x-frame-options"] == "DENY"
