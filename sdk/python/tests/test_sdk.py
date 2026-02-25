"""
Ward Protocol SDK Test Suite
Tests models, client methods, and API endpoints.
"""

import pytest
import sys
sys.path.insert(0, "/home/wflores/ward-protocol/sdk/python")

from datetime import datetime
from ward_protocol_pkg.models import Pool, PoolsResponse, QuoteResponse, SwapResponse


# ─── Model Tests ────────────────────────────────────────────────────────────

class TestPoolModel:

    def test_valid_pool(self):
        pool = Pool(
            pool_id="AMM:rGrbBvT3rEJKP65pvZK55Hy5zzPgQZV8e3",
            asset1="XRP", asset2="USD",
            asset1_issuer=None,
            asset2_issuer="rqL4w3MHBS6xsZmfmfZg4sDSFi5Dd3NSz",
            tvl=1025.0, volume_24h=0.0,
            apr=0.0, fee_rate=0.003,
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow(),
        )
        assert pool.asset1 == "XRP"
        assert pool.asset2 == "USD"
        assert pool.fee_rate == 0.003
        assert pool.asset1_issuer is None

    def test_pool_from_dict(self):
        data = {
            "pool_id": "AMM:TEST",
            "asset1": "XRP", "asset2": "USD",
            "asset1_issuer": None,
            "asset2_issuer": "rIssuer123",
            "tvl": 5000.0, "volume_24h": 100.0,
            "apr": 5.0, "fee_rate": 0.003,
            "created_at": "2026-02-25T00:00:00",
            "last_updated": "2026-02-25T00:00:00",
        }
        pool = Pool.model_validate(data)
        assert pool.pool_id == "AMM:TEST"
        assert pool.tvl == 5000.0


class TestPoolsResponse:

    def test_pools_response(self):
        now = datetime.utcnow()
        pool = Pool(
            pool_id="AMM:TEST", asset1="XRP", asset2="USD",
            asset1_issuer=None, asset2_issuer=None,
            tvl=1000.0, volume_24h=0.0, apr=0.0, fee_rate=0.003,
            created_at=now, last_updated=now,
        )
        resp = PoolsResponse(pools=[pool], total=1, timestamp=now)
        assert resp.total == 1
        assert len(resp.pools) == 1
        assert resp.pools[0].asset1 == "XRP"


class TestQuoteResponse:

    def test_quote_response(self):
        quote = QuoteResponse(
            asset_in="XRP", asset_out="USD",
            amount_in=100.0, amount_out=97.5,
            fee=0.3, fee_rate=0.003,
            price_impact=0.5,
            pool_id="AMM:TEST",
            rate=0.975,
        )
        assert quote.amount_out == 97.5
        assert quote.fee_rate == 0.003
        assert quote.rate == 0.975


class TestSwapResponse:

    def test_swap_response(self):
        swap = SwapResponse(
            status="success",
            tx_hash="ABC123",
            wallet="rTestWallet",
            asset_in="XRP", asset_out="USD",
            amount_in=100.0, amount_out=97.5,
            fee=0.3, price_impact=0.5,
            pool_id="AMM:TEST",
            executed_at="2026-02-25T00:00:00Z",
        )
        assert swap.status == "success"
        assert swap.tx_hash == "ABC123"


# ─── API Endpoint Tests ──────────────────────────────────────────────────────

from fastapi.testclient import TestClient
import sys
sys.path.insert(0, '/home/wflores/ward-protocol')
from sdk.python.main import app

client = TestClient(app)


class TestPoolsEndpoint:

    def test_get_pools_status(self):
        resp = client.get("/pools")
        assert resp.status_code == 200

    def test_get_pools_structure(self):
        resp = client.get("/pools")
        data = resp.json()
        assert "pools" in data
        assert "total" in data
        assert isinstance(data["pools"], list)
        assert data["total"] == len(data["pools"])

    def test_get_pools_fields(self):
        resp = client.get("/pools")
        pool = resp.json()["pools"][0]
        assert "pool_id" in pool
        assert "asset1" in pool
        assert "asset2" in pool
        assert "tvl" in pool
        assert "fee_rate" in pool


class TestSinglePoolEndpoint:

    def test_get_existing_pool(self):
        pools = client.get("/pools").json()["pools"]
        pool_id = pools[0]["pool_id"]
        resp = client.get(f"/pools/{pool_id}")
        assert resp.status_code == 200
        assert resp.json()["pool_id"] == pool_id

    def test_get_missing_pool(self):
        resp = client.get("/pools/AMM:DOESNOTEXIST")
        assert resp.status_code == 404


class TestQuoteEndpoint:

    def test_valid_quote(self):
        resp = client.get("/quote?asset_in=XRP&asset_out=USD&amount_in=100")
        assert resp.status_code == 200
        data = resp.json()
        assert data["asset_in"] == "XRP"
        assert data["asset_out"] == "USD"
        assert data["amount_out"] > 0
        assert data["amount_out"] < 100  # fee + impact means less out

    def test_quote_fee_applied(self):
        resp = client.get("/quote?asset_in=XRP&asset_out=USD&amount_in=100")
        data = resp.json()
        assert data["fee"] > 0
        assert data["fee_rate"] == 0.003

    def test_quote_missing_pool(self):
        resp = client.get("/quote?asset_in=XRP&asset_out=BTC&amount_in=100")
        assert resp.status_code == 404


class TestSwapEndpoint:

    def test_successful_swap(self):
        resp = client.post(
            "/swap?asset_in=XRP&asset_out=USD&amount_in=10&min_amount_out=5&wallet=rTest"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert len(data["tx_hash"]) == 64
        assert data["amount_out"] > 0

    def test_slippage_protection(self):
        resp = client.post(
            "/swap?asset_in=XRP&asset_out=USD&amount_in=10&min_amount_out=9999&wallet=rTest"
        )
        assert resp.status_code == 400
        assert "Slippage" in resp.json()["detail"]

    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
