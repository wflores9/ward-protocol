"""Tests for XLS-80 Permissioned Domain Manager."""
import pytest
from unittest.mock import AsyncMock, MagicMock
from core.permissioned_domains import PermissionedDomainManager


@pytest.fixture
def manager():
    mock_client = AsyncMock()
    return PermissionedDomainManager(xrpl_client=mock_client)


class TestPermissionedDomainManager:
    def test_init(self, manager):
        assert manager.client is not None

    def test_generate_domain_id(self, manager):
        domain_id = manager.generate_domain_id("rOwnerAddress", 1)
        assert isinstance(domain_id, str)
        assert len(domain_id) == 64

    def test_generate_domain_id_deterministic(self, manager):
        id1 = manager.generate_domain_id("rOwner", 1)
        id2 = manager.generate_domain_id("rOwner", 1)
        assert id1 == id2

    def test_generate_domain_id_unique(self, manager):
        id1 = manager.generate_domain_id("rOwner", 1)
        id2 = manager.generate_domain_id("rOwner", 2)
        assert id1 != id2

    def test_encode_credential_type(self, manager):
        result = manager._encode_credential_type("KYC")
        assert result == "4B5943"  # KYC in hex uppercase

    def test_encode_credential_type_longer(self, manager):
        result = manager._encode_credential_type("ACCREDITED_INVESTOR")
        assert isinstance(result, str)
        assert len(result) > 0

    @pytest.mark.asyncio
    async def test_create_domain_empty_credentials_raises(self, manager):
        mock_wallet = MagicMock()
        with pytest.raises(ValueError, match="1-10 entries"):
            await manager.create_domain(mock_wallet, [])

    @pytest.mark.asyncio
    async def test_create_domain_too_many_credentials_raises(self, manager):
        mock_wallet = MagicMock()
        creds = [{"issuer": f"r{i}", "credential_type": "KYC"} for i in range(11)]
        with pytest.raises(ValueError, match="1-10 entries"):
            await manager.create_domain(mock_wallet, creds)

    @pytest.mark.asyncio
    async def test_create_domain_missing_fields_raises(self, manager):
        mock_wallet = MagicMock()
        with pytest.raises(ValueError, match="issuer and credential_type"):
            await manager.create_domain(mock_wallet, [{"issuer": "rAddr"}])

    def test_domain_id_hash_format(self, manager):
        domain_id = manager.generate_domain_id("rTestAddress123", 42)
        assert all(c in "0123456789abcdef" for c in domain_id)
