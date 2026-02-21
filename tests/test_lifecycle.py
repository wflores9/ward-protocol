"""App lifecycle and startup/shutdown tests."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestAppLifecycle:
    """Test application startup and shutdown sequences."""

    @pytest.mark.asyncio
    async def test_startup_sequence(self):
        with patch("main.startup_database", new_callable=AsyncMock) as mock_db, \
             patch("main.startup_xrpl", new_callable=AsyncMock) as mock_xrpl, \
             patch("main.log_auth_configuration") as mock_auth, \
             patch("main.log_rate_limit_config") as mock_rate, \
             patch("main.log_security_headers_config") as mock_sec:
            from main import app
            for handler in app.router.on_startup:
                await handler()
            mock_db.assert_called_once()
            mock_xrpl.assert_called_once()
            mock_auth.assert_called_once()
            mock_rate.assert_called_once()
            mock_sec.assert_called_once()

    @pytest.mark.asyncio
    async def test_shutdown_sequence(self):
        with patch("main.shutdown_xrpl", new_callable=AsyncMock) as mock_xrpl, \
             patch("main.shutdown_database", new_callable=AsyncMock) as mock_db:
            from main import app
            for handler in app.router.on_shutdown:
                await handler()
            mock_xrpl.assert_called_once()
            mock_db.assert_called_once()

    def test_app_metadata(self):
        from main import app
        assert app.title == "Ward Protocol API"
        assert app.version == "0.1.0"
        assert app.docs_url == "/docs"
        assert app.redoc_url == "/redoc"

    def test_openapi_tags(self):
        from main import app
        tags = app.openapi_tags
        tag_names = [t["name"] for t in tags]
        assert "Public" in tag_names
        assert "Permissioned Domains" in tag_names
        assert "Admin" in tag_names
        assert "Monitoring" in tag_names

    def test_docs_description(self):
        from main import app
        assert "XLS-80" in app.description
        assert "Ward Protocol" in app.description
