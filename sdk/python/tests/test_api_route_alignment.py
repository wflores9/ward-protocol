from pathlib import Path
from types import SimpleNamespace
import sys

from fastapi.testclient import TestClient
from xrpl.wallet import Wallet

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import main


def test_purchase_route_calls_sdk_signature(monkeypatch):
    captured = {}

    class FakeWardClient:
        def __init__(self, url):
            captured["url"] = url

        async def purchase_coverage(self, **kwargs):
            captured.update(kwargs)
            return {"nft_token_id": "A" * 64, "premium_tx": "B" * 64, "mint_tx": "C" * 64}

    monkeypatch.setattr(main, "WardClient", FakeWardClient)

    client = TestClient(main.app)
    resp = client.post(
        "/purchase",
        headers={"X-Institution-Key": "test-key"},
        json={
            "wallet_seed": "sEdTM1uX8pu2do5XvTnutH6HsouMaM2",
            "vault_id": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            "pool_address": "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1",
            "coverage_drops": 1000,
            "duration_days": 30,
        },
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["ward_signed"] is False
    assert payload["flow"] == "F·03"
    assert isinstance(captured["wallet"], Wallet)
    assert captured["vault_address"] == "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
    assert captured["pool_address"] == "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1"
    assert captured["period_days"] == 30


def test_validate_route_calls_sdk_signature(monkeypatch):
    captured = {}

    class FakeClaimValidator:
        def __init__(self, url):
            captured["url"] = url

        async def validate_claim(self, **kwargs):
            captured.update(kwargs)
            return SimpleNamespace(
                approved=True,
                claim_payout_drops=100,
                vault_loss_drops=120,
                policy_coverage_drops=200,
                rejection_reason="",
                steps_passed=9,
            )

    monkeypatch.setattr(main, "ClaimValidator", FakeClaimValidator)

    client = TestClient(main.app)
    resp = client.post(
        "/validate",
        headers={"X-Institution-Key": "test-key"},
        json={
            "vault_id": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            "policy_nft_id": "A" * 64,
            "claimant_address": "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1",
            "loan_id": "B" * 64,
            "pool_address": "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1",
        },
    )
    assert resp.status_code == 200
    payload = resp.json()
    assert payload["ward_signed"] is False
    assert payload["flow"] == "F·05"
    assert payload["checks_total"] == 9
    assert payload["checks_passed"] == 9
    assert captured["defaulted_vault"] == "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
    assert captured["nft_token_id"] == "A" * 64
    assert captured["loan_id"] == "B" * 64
    assert captured["pool_address"] == "rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1"
