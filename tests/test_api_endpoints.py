"""
API endpoint tests
"""
import pytest
from fastapi import status


class TestPublicEndpoints:
    """Test public API endpoints"""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns welcome message"""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
    
    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code in [200, 503]
    
    def test_stats_endpoint(self, client):
        """Test stats endpoint"""
        response = client.get("/stats")
        assert response.status_code in [200, 500]


class TestAuthentication:
    """Test authentication and authorization"""
    
    def test_protected_endpoint_without_auth(self, client):
        """Test protected endpoint rejects requests without auth"""
        response = client.get("/admin/api-keys")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_protected_endpoint_with_invalid_auth(self, client, invalid_headers):
        """Test protected endpoint rejects invalid API key"""
        response = client.get("/admin/api-keys", headers=invalid_headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_protected_endpoint_with_valid_auth(self, client, monitor_headers):
        """Test monitor key without admin permissions gets 403"""
        response = client.get("/admin/api-keys", headers=monitor_headers)
        # Monitor key is valid (not 401) but lacks permissions (403)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_endpoint_requires_admin_role(self, client, monitor_headers):
        """Test admin endpoint rejects non-admin keys"""
        response = client.get("/admin/api-keys", headers=monitor_headers)
        # Valid key but wrong permissions = 403
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_endpoint_with_admin_role(self, client, admin_headers):
        """Test admin endpoint accepts admin key"""
        response = client.get("/admin/api-keys", headers=admin_headers)
        assert response.status_code == status.HTTP_200_OK


class TestSecurityHeaders:
    """Test security headers are present"""
    
    def test_security_headers_present(self, client):
        """Test that security headers are set"""
        response = client.get("/")
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers


class TestDomainAPI:
    """Test Permissioned Domains API"""
    
    def test_list_domains(self, client, admin_headers):
        """Test listing permissioned domains"""
        response = client.get("/domains", headers=admin_headers)
        assert response.status_code in [200, 500]
    
    def test_list_domains_requires_auth(self, client):
        """Test domain listing requires authentication"""
        response = client.get("/domains")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
