"""
Test fixtures and configuration
"""
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client for API testing"""
    from main import app
    return TestClient(app)


@pytest.fixture
def admin_headers():
    """Headers with admin API key"""
    return {"X-API-Key": "ward_admin_2026"}


@pytest.fixture
def monitor_headers():
    """Headers with monitor API key"""
    return {"X-API-Key": "ward_monitor_2026"}


@pytest.fixture
def invalid_headers():
    """Headers with invalid API key"""
    return {"X-API-Key": "invalid_key_123"}
