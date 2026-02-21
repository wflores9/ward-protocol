"""
Pytest fixtures and configuration for Ward Protocol tests
"""

import pytest
import asyncio
from httpx import AsyncClient
import os

# Set test environment
os.environ["DATABASE_NAME"] = "ward_protocol_test"
os.environ["PRODUCTION"] = "false"
os.environ["DEBUG"] = "true"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client():
    """Create async HTTP client for API testing"""
    from main import app
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def admin_headers():
    """Admin API key headers"""
    return {"X-API-Key": os.getenv("API_KEY_ADMIN", "ward_admin_2026")}


@pytest.fixture
def monitor_headers():
    """Monitor API key headers"""
    return {"X-API-Key": os.getenv("API_KEY_MONITOR", "ward_monitor_2026")}


@pytest.fixture
def invalid_headers():
    """Invalid API key headers"""
    return {"X-API-Key": "invalid_key_12345"}
