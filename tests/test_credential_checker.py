"""Tests for XLS-70 Credential Checker."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta
from core.credential_checker import CredentialChecker


@pytest.fixture
def checker():
    mock_client = AsyncMock()
    return CredentialChecker(xrpl_client=mock_client, cache_ttl_seconds=3600)


class TestCredentialChecker:
    def test_init(self, checker):
        assert checker.cache == {}
        assert checker.cache_ttl == timedelta(seconds=3600)

    def test_get_cache_key(self, checker):
        key = checker._get_cache_key("rAccount", "rIssuer", "KYC")
        assert key == "rAccount:rIssuer:KYC"

    def test_cache_valid_fresh(self, checker):
        entry = {"cached_at": datetime.utcnow(), "has_credential": True}
        assert checker._is_cache_valid(entry) is True

    def test_cache_invalid_expired(self, checker):
        entry = {"cached_at": datetime.utcnow() - timedelta(hours=2), "has_credential": True}
        assert checker._is_cache_valid(entry) is False

    def test_cache_invalid_empty(self, checker):
        assert checker._is_cache_valid({}) is False
        assert checker._is_cache_valid(None) is False

    def test_cache_invalid_no_timestamp(self, checker):
        entry = {"has_credential": True}
        assert checker._is_cache_valid(entry) is False

    @pytest.mark.asyncio
    async def test_check_credential_cache_hit(self, checker):
        key = "rAcc:rIss:KYC"
        checker.cache[key] = {
            "cached_at": datetime.utcnow(),
            "has_credential": True
        }
        result = await checker.check_credential("rAcc", "rIss", "KYC", use_cache=True)
        assert result is True
        checker.client.request.assert_not_called()

    @pytest.mark.asyncio
    async def test_check_credential_both_exist(self, checker):
        mock_resp = MagicMock()
        mock_resp.is_successful.return_value = True
        checker.client.request = AsyncMock(return_value=mock_resp)
        result = await checker.check_credential("rAccount", "rIssuer", "KYC", use_cache=False)
        assert result is True
        assert checker.client.request.call_count == 2

    @pytest.mark.asyncio
    async def test_check_credential_account_missing(self, checker):
        success_resp = MagicMock()
        success_resp.is_successful.return_value = True
        fail_resp = MagicMock()
        fail_resp.is_successful.return_value = False
        checker.client.request = AsyncMock(side_effect=[fail_resp, success_resp])
        result = await checker.check_credential("rBad", "rIssuer", "KYC", use_cache=False)
        assert result is False

    @pytest.mark.asyncio
    async def test_check_credential_exception(self, checker):
        checker.client.request = AsyncMock(side_effect=Exception("network error"))
        result = await checker.check_credential("rAcc", "rIss", "KYC", use_cache=False)
        assert result is False

    @pytest.mark.asyncio
    async def test_check_credential_caches_result(self, checker):
        mock_resp = MagicMock()
        mock_resp.is_successful.return_value = True
        checker.client.request = AsyncMock(return_value=mock_resp)
        await checker.check_credential("rAcc", "rIss", "KYC", use_cache=True)
        key = "rAcc:rIss:KYC"
        assert key in checker.cache
        assert checker.cache[key]["has_credential"] is True
