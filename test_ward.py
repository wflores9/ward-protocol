"""
Ward Protocol SDK — pytest test suite  (v0.2.1)
======================================

Unit tests:       No XRPL network required (all XRPL calls are mocked).
Integration tests: Marked @pytest.mark.integration — hit XRPL testnet.
Adversarial tests: Simulate real attack scenarios against the validator.

Fix #8 applied: imports migrated from ward_client to ward.* modules;
                AsyncJsonRpcClient context manager patched for unit tests;
                MagicMock replaced with AsyncMock where coroutines are mocked;
                PoolHealthMonitor.get_health() called without args (on-chain);
                _make_validator_with_mocks patches ward.validator.AsyncJsonRpcClient.

Run unit tests only:
    pytest test_ward.py -v -m "not integration"

Run all tests (requires testnet access):
    pytest test_ward.py -v
"""


from __future__ import annotations


import asyncio
import hashlib
import json
import os
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch


import pytest


# ---------------------------------------------------------------------------
# Ward SDK imports  (fix #8: all from ward.* modules)
# ---------------------------------------------------------------------------

from ward.constants import (
    CLAIM_RATE_LIMIT_MAX,
    CLAIM_RATE_LIMIT_WINDOW_S,
    CREDENTIAL_NFT_TAXON,
    TF_BURNABLE,
    VALID_KYC_TYPES,
    WARD_POLICY_TAXON,
)
from ward.primitives import (
    LedgerError,
    SecurityError,
    ValidationError,
    WardError,
    generate_claim_preimage,
    make_preimage_condition,
    validate_drops_amount,
    validate_nft_id,
    validate_xrpl_address,
)
from ward.client import WardClient
from ward.vault_monitor import VaultMonitor
from ward.validator import ClaimValidator, ValidationResult
from ward.settlement import EscrowRecord, EscrowSettlement
from ward.pool import PoolHealth, PoolHealthMonitor

# ---------------------------------------------------------------------------
# Backward-compat aliases (old test constants mapped to new names)
# ---------------------------------------------------------------------------
RATE_LIMIT_ATTEMPTS = CLAIM_RATE_LIMIT_MAX
RATE_LIMIT_WINDOW_S = CLAIM_RATE_LIMIT_WINDOW_S
PREIMAGE_BYTES      = 32      # generate_claim_preimage always returns 32 bytes


# ---------------------------------------------------------------------------
# KYC helpers  (re-implemented locally; removed from ward_client monolith)
# ---------------------------------------------------------------------------

def build_kyc_hash(kyc_type: str, subject_address: str, issued_at: int) -> str:
    if kyc_type not in VALID_KYC_TYPES:
        raise ValidationError(f"Unknown KYC type: {kyc_type}")
    raw = f"{kyc_type}:{subject_address}:{issued_at}"
    return hashlib.sha256(raw.encode()).hexdigest()


def validate_kyc_hash(kyc_hash: str) -> None:
    if not isinstance(kyc_hash, str):
        raise ValidationError("KYC hash must be a string")
    if len(kyc_hash) != 64:
        raise ValidationError(f"KYC hash must be 64 hex chars, got {len(kyc_hash)}")
    try:
        bytes.fromhex(kyc_hash)
    except ValueError as exc:
        raise ValidationError("KYC hash contains non-hex characters") from exc
    if kyc_hash != kyc_hash.lower():
        raise ValidationError("KYC hash must be lowercase hex")


# ---------------------------------------------------------------------------
# Convenience wrappers kept for API compatibility
# ---------------------------------------------------------------------------

def generate_claim_condition():
    """Return (preimage_bytes, condition_hex, fulfillment_hex)."""
    preimage = generate_claim_preimage()
    cond, fulf = make_preimage_condition(preimage)
    return preimage, cond, fulf


def extract_nft_id(meta: dict) -> str:
    nftoken_id = meta.get("nftoken_id") or meta.get("NFTokenID")
    if nftoken_id:
        return nftoken_id
    for node in meta.get("AffectedNodes", []):
        for kind in ("CreatedNode", "ModifiedNode"):
            outer = node.get(kind, {})
            fields = outer.get("NewFields") or outer.get("FinalFields") or {}
            nfts = fields.get("NFTokens") or fields.get("nfts") or []
            for nft in nfts:
                nft_obj = nft.get("NFToken", nft)
                if nft_obj.get("NFTokenID"):
                    return nft_obj["NFTokenID"]
    raise LedgerError("NFTokenID not found in transaction meta")


def calculate_coverage_ratio(usable_drops: int, active_coverage_drops: int) -> float:
    if active_coverage_drops == 0:
        return float("inf")
    return usable_drops / active_coverage_drops


def get_ledger_time(close_time_ripple: int) -> int:
    return close_time_ripple



# ---------------------------------------------------------------------------
# Test fixtures & helpers
# ---------------------------------------------------------------------------

VALID_ADDRESS  = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
VALID_ADDRESS2 = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
VALID_NFT_ID   = "A" * 64
VALID_LOAN_ID  = "B" * 64
POLICY_TAXON   = WARD_POLICY_TAXON


@dataclass
class FakeWallet:
    """Minimal wallet stub that satisfies validate_wallet()."""
    classic_address: str = VALID_ADDRESS
    seed: str            = "sEdTM1uX8pu2do5XvTnutH6HsouMaM2"
    public_key: str      = "ED" + "0" * 62


def _make_success_response(result_data: dict):
    resp = MagicMock()
    resp.is_successful.return_value = True
    resp.result = result_data
    return resp


def _make_fail_response(engine_result: str = "tecFAILED"):
    resp = MagicMock()
    resp.is_successful.return_value = False
    resp.result = {
        "meta": {"TransactionResult": engine_result},
        "error": engine_result,
    }
    return resp


def _make_nft_entry(nft_token_id: str, uri_metadata: dict, taxon: int = WARD_POLICY_TAXON):
    uri_hex = json.dumps(uri_metadata, separators=(",", ":")).encode().hex().upper()
    return {
        "NFTokenID":    nft_token_id,
        "NFTokenTaxon": taxon,
        "URI":          uri_hex,
    }


def _make_policy_metadata(
    vault_address: str = VALID_ADDRESS,
    coverage_drops: int = 1_000_000,
    expiry_ledger_time: int = 9_999_999_999,
) -> dict:
    """Compact URI format used by WardClient v0.2.x."""
    return {
        "w":  "ward-v1",
        "v":  vault_address,
        "c":  str(coverage_drops),
        "e":  expiry_ledger_time,
        "pa": VALID_ADDRESS2,
    }


def _make_loan_node(
    flags: int = 0x00010000,
    principal: int = 500_000,
    interest: int = 10_000,
    loan_broker_id: str = "E" * 64,
) -> dict:
    return {
        "Flags":               flags,
        "PrincipalOutstanding":  principal,
        "InterestOutstanding":   interest,
        "TotalValueOutstanding": principal + interest,
        "LoanBrokerID":          loan_broker_id,
    }


def _make_broker_node(
    debt_total: int = 1_000_000,
    cover_available: int = 100_000,
    coverage_rate_min: float = 0.8,
) -> dict:
    return {
        "DebtTotal":       debt_total,
        "CoverAvailable":  cover_available,
        "CoverageRateMin": str(coverage_rate_min),
    }


def _make_vault_node(
    assets_total: int = 500_000,
    assets_available: int = 200_000,
    loss_unrealized: int = 0,
    shares_total: int = 1_000,
) -> dict:
    return {
        "AssetsTotal":     assets_total,
        "AssetsAvailable": assets_available,
        "LossUnrealized":  loss_unrealized,
        "SharesTotal":     shares_total,
    }


def _make_server_info_response(close_time: int = 100_000_000) -> dict:
    return {
        "info": {
            "validated_ledger": {
                "close_time": close_time,
                "seq":        12_345_678,
            }
        }
    }


def _make_pool_nft_entry(coverage_drops: int) -> dict:
    """Build a Ward policy NFT that PoolHealthMonitor can decode on-chain."""
    meta = {
        "w":  "ward-v1",
        "v":  VALID_ADDRESS,
        "c":  str(coverage_drops),
        "e":  9_999_999_999,
    }
    return {
        "NFTokenID":    "C" * 64,
        "NFTokenTaxon": WARD_POLICY_TAXON,
        "URI":          json.dumps(meta, separators=(",", ":")).encode().hex().upper(),
    }


def _async_client_factory(request_fn):
    """
    Return an AsyncJsonRpcClient class replacement whose context manager
    yields a mock that routes requests to request_fn.

    Fix #8: modules use 'async with AsyncJsonRpcClient(url) as client:'
    so we must mock the class, not an instance attribute.
    """
    mock_client = AsyncMock()
    mock_client.request = AsyncMock(side_effect=request_fn)

    async def _aenter(self_):
        return mock_client

    async def _aexit(self_, *args):
        pass

    MockClass = MagicMock()
    MockClass.return_value.__aenter__ = _aenter
    MockClass.return_value.__aexit__  = _aexit
    return MockClass



# ===========================================================================
# Tests: Security utilities
# ===========================================================================


class TestValidateXrplAddress:
    def test_valid_address(self):
        validate_xrpl_address(VALID_ADDRESS)

    def test_valid_address2(self):
        validate_xrpl_address(VALID_ADDRESS2)

    def test_empty_string_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("")

    def test_none_raises(self):
        with pytest.raises((ValidationError, TypeError)):
            validate_xrpl_address(None)  # type: ignore[arg-type]

    def test_too_short_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("rShort")

    def test_wrong_prefix_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("xrp1qy2hwffh7aTFEZv45K9aTQhJPGC7hmb")

    def test_invalid_checksum_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyZZ")

    def test_example_vault_fails(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("rExampleVaultXXX")


class TestValidateDropsAmount:
    def test_valid_drops(self):
        validate_drops_amount(1_000_000)

    def test_one_drop(self):
        validate_drops_amount(1)

    def test_zero_raises(self):
        with pytest.raises(ValidationError):
            validate_drops_amount(0)

    def test_negative_raises(self):
        with pytest.raises(ValidationError):
            validate_drops_amount(-1)

    def test_exceeds_max_raises(self):
        with pytest.raises(ValidationError):
            validate_drops_amount(100_000_000_000_000_001)

    def test_float_raises(self):
        with pytest.raises((ValidationError, TypeError)):
            validate_drops_amount(1.5)  # type: ignore[arg-type]


class TestValidateNftId:
    def test_valid_64_hex(self):
        validate_nft_id("A" * 64)

    def test_uppercase(self):
        validate_nft_id("F" * 64)

    def test_lowercase_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("a" * 64)

    def test_too_short_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("A" * 63)

    def test_too_long_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("A" * 65)

    def test_non_hex_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("G" * 64)

    def test_empty_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("")


# ===========================================================================
# Tests: make_preimage_condition — cryptographic correctness
# ===========================================================================


class TestPreimageConditionCryptography:
    def test_roundtrip_condition_matches_fulfillment(self):
        preimage = bytes(range(32))
        sha256   = hashlib.sha256(preimage).digest()
        cond, fulf = make_preimage_condition(preimage)
        cond_bytes = bytes.fromhex(cond)
        fulf_bytes = bytes.fromhex(fulf)
        assert cond_bytes[0] == 0xA0
        assert cond_bytes[1] == 0x25
        assert cond_bytes[2] == 0x80
        assert cond_bytes[3] == 0x20
        assert cond_bytes[4:36] == sha256
        assert fulf_bytes[0] == 0xA0
        assert fulf_bytes[1] == 0x22
        assert fulf_bytes[2] == 0x80
        assert fulf_bytes[3] == 0x20
        assert fulf_bytes[4:36] == preimage

    def test_output_lengths(self):
        cond, fulf = make_preimage_condition(bytes(32))
        assert len(cond) == 78
        assert len(fulf) == 72

    def test_condition_starts_with_a025(self):
        cond, _ = make_preimage_condition(bytes(32))
        assert cond.upper().startswith("A025")

    def test_fulfillment_starts_with_a022(self):
        preimage = os.urandom(PREIMAGE_BYTES)
        _, fulf = make_preimage_condition(preimage)
        assert fulf.upper().startswith("A022")

    def test_condition_contains_sha256_of_preimage(self):
        preimage = bytes(range(32))
        sha256_hex = hashlib.sha256(preimage).hexdigest().upper()
        cond, _ = make_preimage_condition(preimage)
        assert sha256_hex in cond.upper()

    def test_different_preimages_give_different_conditions(self):
        p1 = os.urandom(PREIMAGE_BYTES)
        p2 = os.urandom(PREIMAGE_BYTES)
        c1, _ = make_preimage_condition(p1)
        c2, _ = make_preimage_condition(p2)
        assert c1 != c2

    def test_wrong_length_raises(self):
        with pytest.raises(ValueError):
            make_preimage_condition(b"\x00" * 16)

    def test_generate_claim_condition_returns_three_items(self):
        preimage, cond, fulf = generate_claim_condition()
        assert len(preimage) == PREIMAGE_BYTES
        assert len(cond) == 78
        assert len(fulf) == 72


# ===========================================================================
# Tests: extract_nft_id
# ===========================================================================


class TestExtractNftId:
    def test_meta_nftoken_id_shortcut(self):
        assert extract_nft_id({"nftoken_id": "A" * 64}) == "A" * 64

    def test_created_node_fallback(self):
        meta = {
            "AffectedNodes": [{
                "CreatedNode": {
                    "LedgerEntryType": "NFTokenPage",
                    "NewFields": {
                        "NFTokens": [
                            {"NFToken": {"NFTokenID": "B" * 64, "URI": "7465737430"}}
                        ]
                    },
                }
            }]
        }
        assert extract_nft_id(meta) == "B" * 64

    def test_modified_node_fallback(self):
        meta = {
            "AffectedNodes": [{
                "ModifiedNode": {
                    "LedgerEntryType": "NFTokenPage",
                    "FinalFields": {
                        "NFTokens": [
                            {"NFToken": {"NFTokenID": "C" * 64, "URI": "7465737430"}}
                        ]
                    },
                }
            }]
        }
        assert extract_nft_id(meta) == "C" * 64

    def test_no_nft_id_raises(self):
        with pytest.raises(LedgerError):
            extract_nft_id({"AffectedNodes": []})


# ===========================================================================
# Tests: calculate_coverage_ratio
# ===========================================================================


class TestCalculateCoverageRatio:
    def test_normal_ratio(self):
        assert calculate_coverage_ratio(3_000_000, 1_000_000) == pytest.approx(3.0)

    def test_zero_coverage_gives_inf(self):
        assert calculate_coverage_ratio(5_000_000, 0) == float("inf")

    def test_undercollateralised(self):
        assert calculate_coverage_ratio(500_000, 1_000_000) == pytest.approx(0.5)



# ===========================================================================
# Tests: WardClient — input validation (no network)
# ===========================================================================


class TestWardClientInputValidation:
    def setup_method(self):
        self.client = WardClient()
        self.wallet = FakeWallet()

    @pytest.mark.asyncio
    async def test_invalid_vault_address_raises(self):
        with pytest.raises(ValidationError, match="vault_address"):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address="rInvalid",
                coverage_drops=1_000_000,
                period_days=30,
                pool_address=VALID_ADDRESS2,
            )

    @pytest.mark.asyncio
    async def test_invalid_pool_address_raises(self):
        with pytest.raises(ValidationError, match="pool_address"):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address=VALID_ADDRESS,
                coverage_drops=1_000_000,
                period_days=30,
                pool_address="not-an-address",
            )

    @pytest.mark.asyncio
    async def test_zero_coverage_drops_raises(self):
        with pytest.raises(ValidationError):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address=VALID_ADDRESS,
                coverage_drops=0,
                period_days=30,
                pool_address=VALID_ADDRESS2,
            )

    @pytest.mark.asyncio
    async def test_zero_period_days_raises(self):
        with pytest.raises(ValidationError):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address=VALID_ADDRESS,
                coverage_drops=1_000_000,
                period_days=0,
                pool_address=VALID_ADDRESS2,
            )

    @pytest.mark.asyncio
    async def test_invalid_premium_rate_raises(self):
        with pytest.raises(ValidationError):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address=VALID_ADDRESS,
                coverage_drops=1_000_000,
                period_days=30,
                pool_address=VALID_ADDRESS2,
                premium_rate=1.5,
            )

    @pytest.mark.asyncio
    async def test_example_vault_address_from_prototype_rejected(self):
        with pytest.raises(ValidationError):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address="rExampleVaultXXX",
                coverage_drops=1_000_000,
                period_days=90,
                pool_address="rPoolAddressXXX",
            )

    def test_nft_flag_constant_is_burnable_not_transferable(self):
        assert TF_BURNABLE == 0x00000001
        assert TF_BURNABLE != 0x00000008


# ===========================================================================
# Tests: ClaimValidator — input sanitation
# ===========================================================================


class TestClaimValidatorInputSanitation:
    def setup_method(self):
        self.validator = ClaimValidator()

    @pytest.mark.asyncio
    async def test_invalid_claimant_address(self):
        result = await self.validator.validate_claim(
            claimant_address="bad-addr",
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert result.steps_passed == 0

    @pytest.mark.asyncio
    async def test_invalid_nft_id(self):
        result = await self.validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id="not-64-hex",
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert result.steps_passed == 0



# ===========================================================================
# Tests: ClaimValidator — adversarial scenarios  (fix #8)
# ===========================================================================


class TestClaimValidatorAdversarial:
    """
    9-step adversarial validation with fully mocked XRPL client.

    Fix #8: Instead of injecting validator._client, we patch
    ward.validator.AsyncJsonRpcClient with a context-manager mock.
    The patch is stopped after each test via _validate() helper.
    """

    def _make_validator_with_mocks(
        self,
        *,
        nft_exists: bool = True,
        nft_taxon: int = WARD_POLICY_TAXON,
        ledger_time: int = 100_000_000,
        expiry_time: int = 999_999_999,
        policy_vault: str = VALID_ADDRESS,
        defaulted_vault: str = VALID_ADDRESS,
        default_flag_set: bool = True,
        vault_loss_drops: int = 100_000,
        pool_balance_drops: int = 10_000_000,
        loan_broker_available: bool = True,
        coverage_drops: int = 500_000,
    ) -> ClaimValidator:
        metadata = _make_policy_metadata(
            vault_address=policy_vault,
            coverage_drops=coverage_drops,
            expiry_ledger_time=expiry_time,
        )
        uri_hex = json.dumps(metadata, separators=(",", ":")).encode().hex().upper()
        nft_entry = {
            "NFTokenID":    VALID_NFT_ID,
            "NFTokenTaxon": nft_taxon,
            "URI":          uri_hex,
        }
        loan_flags = 0x00010000 if default_flag_set else 0x0
        loan_node  = _make_loan_node(flags=loan_flags, principal=500_000, interest=10_000)
        broker_node = _make_broker_node(debt_total=1_000_000, cover_available=100_000)
        vault_node  = _make_vault_node(assets_total=400_000, loss_unrealized=0)
        pool_info   = {"account_data": {"Balance": str(pool_balance_drops)}}

        async def mock_request(req):
            from xrpl.models import AccountNFTs as _ANFTs, AccountInfo as _AI
            from xrpl.models import ServerInfo as _SI, LedgerEntry as _LE

            if isinstance(req, _ANFTs):
                nfts = [nft_entry] if nft_exists else []
                return _make_success_response({"account_nfts": nfts})
            elif isinstance(req, _SI):
                return _make_success_response(_make_server_info_response(ledger_time))
            elif isinstance(req, _AI):
                return _make_success_response(pool_info)
            elif isinstance(req, _LE):
                index_val = getattr(req, "index", None)
                vault_val = getattr(req, "vault",  None)
                if index_val == VALID_LOAN_ID:
                    if not default_flag_set:
                        return _make_fail_response()
                    return _make_success_response({"node": loan_node})
                elif index_val is not None and index_val != VALID_LOAN_ID:
                    if not loan_broker_available:
                        return _make_fail_response()
                    return _make_success_response({"node": broker_node})
                elif vault_val is not None:
                    return _make_success_response({"node": vault_node})
                return _make_fail_response("tecNO_ENTRY")
            return _make_fail_response("temUNKNOWN")

        validator = ClaimValidator()
        _patch = patch(
            "ward.validator.AsyncJsonRpcClient",
            _async_client_factory(mock_request),
        )
        _patch.start()
        validator._mock_patch = _patch
        return validator

    async def _validate(self, validator, **kwargs) -> ValidationResult:
        try:
            return await validator.validate_claim(**kwargs)
        finally:
            p = getattr(validator, '_mock_patch', None)
            if p:
                try:
                    p.stop()
                except RuntimeError:
                    pass

    # ── Adversarial Test 1: Fake claim ──────────────────────────────

    @pytest.mark.asyncio
    async def test_fake_claim_nft_not_found(self):
        validator = self._make_validator_with_mocks(nft_exists=False)
        result = await self._validate(
            validator,
            claimant_address=VALID_ADDRESS, nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS, loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "not found" in result.rejection_reason.lower()

    # ── Adversarial Test 2: Expired policy ──────────────────────────

    @pytest.mark.asyncio
    async def test_expired_policy_rejected(self):
        validator = self._make_validator_with_mocks(
            ledger_time=200_000_000, expiry_time=100_000_000,
        )
        result = await self._validate(
            validator,
            claimant_address=VALID_ADDRESS, nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS, loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "expired" in result.rejection_reason.lower()

    # ── Adversarial Test 3: Wrong vault ─────────────────────────────

    @pytest.mark.asyncio
    async def test_wrong_vault_rejected(self):
        validator = self._make_validator_with_mocks(
            policy_vault=VALID_ADDRESS, defaulted_vault=VALID_ADDRESS2,
        )
        result = await self._validate(
            validator,
            claimant_address=VALID_ADDRESS, nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS2, loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "vault" in result.rejection_reason.lower()

    # ── Adversarial Test 4: Loan not in default ──────────────────────

    @pytest.mark.asyncio
    async def test_non_defaulted_loan_rejected(self):
        validator = self._make_validator_with_mocks(default_flag_set=False)
        result = await self._validate(
            validator,
            claimant_address=VALID_ADDRESS, nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS, loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved

    # ── Adversarial Test 5: Drained pool ────────────────────────────

    @pytest.mark.asyncio
    async def test_drained_pool_rejected(self):
        validator = self._make_validator_with_mocks(
            pool_balance_drops=100, coverage_drops=10_000_000,
        )
        result = await self._validate(
            validator,
            claimant_address=VALID_ADDRESS, nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS, loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "insolvent" in result.rejection_reason.lower()

    # ── Adversarial Test 6: Wrong taxon ─────────────────────────────

    @pytest.mark.asyncio
    async def test_wrong_taxon_rejected(self):
        validator = self._make_validator_with_mocks(nft_taxon=9999)
        result = await self._validate(
            validator,
            claimant_address=VALID_ADDRESS, nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS, loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "taxon" in result.rejection_reason.lower()



# ===========================================================================
# Tests: VaultMonitor
# ===========================================================================


class TestVaultMonitor:
    def test_init_valid_address(self):
        monitor = VaultMonitor(vault_addresses=[VALID_ADDRESS])
        assert VALID_ADDRESS in monitor._vault_addresses

    def test_invalid_vault_address_rejected(self):
        with pytest.raises(ValidationError):
            VaultMonitor(vault_addresses=["rInvalidXXXXXXXX"])

    def test_add_vault_validates_address(self):
        monitor = VaultMonitor(vault_addresses=[VALID_ADDRESS])
        with pytest.raises(ValidationError):
            monitor.add_vault("not-a-valid-xrpl-address")

    def test_anomaly_window_clears_expired_entries(self):
        from ward.vault_monitor import ANOMALY_THRESHOLD
        monitor = VaultMonitor(vault_addresses=[VALID_ADDRESS])
        now = time.time()
        for _ in range(ANOMALY_THRESHOLD):
            monitor._recent_signals[VALID_ADDRESS].append(now - 9999)
        result = monitor._detect_anomaly(VALID_ADDRESS)
        assert not result, "Old signals should not count after window expires"


# ===========================================================================
# Tests: PoolHealthMonitor — solvency and dynamic pricing
#
# Fix #8:
#   - get_health() takes NO arguments (active_coverage_drops is on-chain)
#   - mock_request handles both AccountInfo AND AccountNFTs
#   - coverage is injected via AccountNFTs mock using Ward policy NFT entries
# ===========================================================================


class TestPoolHealthMonitor:
    def _make_monitor(
        self,
        balance_drops: int = 10_000_000,
        coverage_drops: int = 0,
    ) -> PoolHealthMonitor:
        pool_nfts = [_make_pool_nft_entry(coverage_drops)] if coverage_drops > 0 else []

        async def mock_request(req):
            from xrpl.models import AccountInfo as _AI, AccountNFTs as _ANFTs
            if isinstance(req, _AI):
                return _make_success_response({
                    "account_data": {"Balance": str(balance_drops), "OwnerCount": 1}
                })
            elif isinstance(req, _ANFTs):
                return _make_success_response({"account_nfts": pool_nfts})
            return _make_fail_response()

        monitor = PoolHealthMonitor(pool_address=VALID_ADDRESS)
        _patch = patch(
            "ward.pool.AsyncJsonRpcClient",
            _async_client_factory(mock_request),
        )
        _patch.start()
        monitor._mock_patch = _patch
        return monitor

    def _stop(self, monitor):
        p = getattr(monitor, '_mock_patch', None)
        if p:
            try:
                p.stop()
            except RuntimeError:
                pass

    @pytest.mark.asyncio
    async def test_solvent_pool(self):
        # 24M - 20M base reserve = 4M usable vs 1M coverage = 4x
        monitor = self._make_monitor(balance_drops=24_000_000, coverage_drops=1_000_000)
        try:
            health = await monitor.get_health()
            assert health.is_solvent
        finally:
            self._stop(monitor)

    @pytest.mark.asyncio
    async def test_undercollateralized_pool(self):
        # 21M - 20M base = 1M usable vs 10M coverage = 0.1x
        monitor = self._make_monitor(balance_drops=21_000_000, coverage_drops=10_000_000)
        try:
            health = await monitor.get_health()
            assert not health.is_solvent
        finally:
            self._stop(monitor)

    @pytest.mark.asyncio
    async def test_zero_coverage_returns_inf_ratio(self):
        monitor = self._make_monitor(balance_drops=25_000_000, coverage_drops=0)
        try:
            health = await monitor.get_health()
            assert health.coverage_ratio == float("inf")
            assert health.is_solvent
        finally:
            self._stop(monitor)

    @pytest.mark.asyncio
    async def test_premium_rate_increases_with_risk(self):
        monitor_safe     = self._make_monitor(balance_drops=120_000_000, coverage_drops=1_000_000)
        monitor_stressed = self._make_monitor(balance_drops=23_000_000,  coverage_drops=2_800_000)
        try:
            health_safe     = await monitor_safe.get_health()
            health_stressed = await monitor_stressed.get_health()
            assert health_stressed.dynamic_premium_rate >= health_safe.dynamic_premium_rate
        finally:
            self._stop(monitor_safe)
            self._stop(monitor_stressed)

    @pytest.mark.asyncio
    async def test_calculate_premium_pro_rated(self):
        monitor = self._make_monitor(balance_drops=30_000_000, coverage_drops=1_000_000)
        try:
            health     = await monitor.get_health()
            result_30  = monitor.calculate_premium(health, 1_000_000, 30)
            result_365 = monitor.calculate_premium(health, 1_000_000, 365)
            assert result_30["premium_drops"] > 0
            assert result_365["premium_drops"] > result_30["premium_drops"]
        finally:
            self._stop(monitor)

    def test_invalid_pool_address_raises(self):
        with pytest.raises(ValidationError):
            PoolHealthMonitor(pool_address="invalid-addr")

    @pytest.mark.asyncio
    async def test_starter_tier_blocks_elevated_minting(self):
        """Tier gate: Starter must not mint at elevated risk (index.html tier rules)."""
        from ward.constants import LicenseTier
        # 23.5M - (20M base + 2M owner@1) = 1.5M usable vs 1M coverage = 1.5x = elevated tier
        monitor = self._make_monitor(balance_drops=23_500_000, coverage_drops=1_000_000)
        try:
            health = await monitor.get_health()
            allowed = monitor.is_minting_allowed(health, LicenseTier.STARTER)
            assert not allowed, "Starter should be blocked at elevated tier"
        finally:
            self._stop(monitor)

    @pytest.mark.asyncio
    async def test_enterprise_tier_allows_elevated_minting(self):
        """Tier gate: Enterprise can mint at elevated risk."""
        from ward.constants import LicenseTier
        # 23.5M - (20M base + 2M owner@1) = 1.5M usable vs 1M coverage = 1.5x = elevated tier
        monitor = self._make_monitor(balance_drops=23_500_000, coverage_drops=1_000_000)
        try:
            health = await monitor.get_health()
            allowed = monitor.is_minting_allowed(health, LicenseTier.ENTERPRISE)
            assert allowed, "Enterprise should be allowed at elevated tier"
        finally:
            self._stop(monitor)



# ===========================================================================
# Tests: EscrowSettlement — crypto condition flow  (fix #8)
# ===========================================================================


class TestEscrowSettlement:
    def _make_settlement(self) -> EscrowSettlement:
        async def mock_request(req):
            return _make_success_response(
                _make_server_info_response(close_time=100_000_000)
            )

        settlement = EscrowSettlement()
        _patch = patch(
            "ward.settlement.AsyncJsonRpcClient",
            _async_client_factory(mock_request),
        )
        _patch.start()
        settlement._mock_patch = _patch
        return settlement

    def _stop(self, s):
        p = getattr(s, '_mock_patch', None)
        if p:
            try:
                p.stop()
            except RuntimeError:
                pass

    def _make_record(self, condition_hex: str) -> EscrowRecord:
        return EscrowRecord(
            claim_id="claim-123",
            nft_token_id=VALID_NFT_ID,
            pool_address=VALID_ADDRESS,
            claimant_address=VALID_ADDRESS2,
            payout_drops=500_000,
            escrow_sequence=42,
            condition_hex=condition_hex,
            tx_hash="E" * 64,
            finish_after_ripple=100_000_000 - 1,    # already finishable
            cancel_after_ripple=100_000_000 + 7200,  # not yet cancellable
        )

    @pytest.mark.asyncio
    async def test_finish_before_dispute_window_raises(self):
        settlement = self._make_settlement()
        preimage, cond, fulf = generate_claim_condition()
        record = self._make_record(cond)
        pool_wallet = FakeWallet(classic_address=VALID_ADDRESS)
        try:
            with pytest.raises(ValidationError, match="dispute window"):
                await settlement.finish_escrow(
                    pool_wallet=pool_wallet,
                    escrow_record=record,
                    fulfillment_hex=fulf,
                )
        finally:
            self._stop(settlement)

    @pytest.mark.asyncio
    async def test_cancel_before_window_raises(self):
        settlement = self._make_settlement()
        preimage, cond, fulf = generate_claim_condition()
        record = EscrowRecord(
            claim_id="claim-123",
            nft_token_id=VALID_NFT_ID,
            pool_address=VALID_ADDRESS,
            claimant_address=VALID_ADDRESS2,
            payout_drops=500_000,
            escrow_sequence=2,
            condition_hex=cond,
            tx_hash="G" * 64,
            finish_after_ripple=50_000_000,
            cancel_after_ripple=200_000_000,   # far future
        )
        pool_wallet = FakeWallet(classic_address=VALID_ADDRESS)
        try:
            with pytest.raises(ValidationError, match="not yet cancellable"):
                await settlement.cancel_escrow(
                    pool_wallet=pool_wallet,
                    escrow_record=record,
                    reason="dispute",
                )
        finally:
            self._stop(settlement)

    @pytest.mark.asyncio
    async def test_create_escrow_validates_addresses(self):
        settlement = self._make_settlement()
        preimage, cond, fulf = generate_claim_condition()
        try:
            with pytest.raises(ValidationError):
                await settlement.create_claim_escrow(
                    pool_wallet=FakeWallet(),
                    claimant_address="bad-addr",
                    payout_drops=500_000,
                    condition_hex=cond,
                    claim_id="claim-xyz",
                    nft_token_id=VALID_NFT_ID,
                )
        finally:
            self._stop(settlement)


# ===========================================================================
# Tests: KYC helpers
# ===========================================================================


class TestBuildKycHash:
    def test_deterministic(self):
        h1 = build_kyc_hash("KYC_VERIFIED", VALID_ADDRESS, 1000)
        h2 = build_kyc_hash("KYC_VERIFIED", VALID_ADDRESS, 1000)
        assert h1 == h2

    def test_different_inputs_differ(self):
        h1 = build_kyc_hash("KYC_VERIFIED", VALID_ADDRESS,  1000)
        h2 = build_kyc_hash("KYC_VERIFIED", VALID_ADDRESS2, 1000)
        assert h1 != h2

    def test_all_valid_kyc_types(self):
        for kyc_type in VALID_KYC_TYPES:
            h = build_kyc_hash(kyc_type, VALID_ADDRESS, 1000)
            assert len(h) == 64


class TestValidateKycHash:
    def test_valid_hash_passes(self):
        h = build_kyc_hash("KYC_VERIFIED", VALID_ADDRESS, 1)
        validate_kyc_hash(h)  # no exception

    def test_valid_sha256_hex_passes(self):
        h = hashlib.sha256(b"test").hexdigest()
        validate_kyc_hash(h)

    def test_too_short_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("abc123")

    def test_too_long_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("a" * 65)

    def test_uppercase_rejected(self):
        h = "A" * 64
        with pytest.raises(ValidationError):
            validate_kyc_hash(h)

    def test_not_string_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash(12345)  # type: ignore[arg-type]

    def test_non_hex_chars_raise(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("g" * 64)

    def test_none_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash(None)  # type: ignore[arg-type]


# ===========================================================================
# Tests: Credential constants
# ===========================================================================


class TestCredentialConstants:
    def test_credential_nft_taxon_is_283(self):
        assert CREDENTIAL_NFT_TAXON == 283

    def test_taxon_distinct_from_policy(self):
        assert CREDENTIAL_NFT_TAXON != WARD_POLICY_TAXON

    def test_valid_kyc_types_contains_required(self):
        assert "KYC_VERIFIED" in VALID_KYC_TYPES
        assert "AML_CLEARED"  in VALID_KYC_TYPES


# ===========================================================================
# Integration tests (require XRPL testnet, skipped in unit runs)
# ===========================================================================


@pytest.mark.integration
@pytest.mark.asyncio
async def test_integration_purchase_coverage_testnet():
    """
    Full integration test: request faucet wallet, purchase a 1-XRP policy.
    Requires XRPL Altnet testnet access.
    Set WARD_POOL_ADDRESS env var or use the default faucet address.
    """
    from xrpl.asyncio.clients import AsyncJsonRpcClient as _RPC
    from xrpl.asyncio.wallet import generate_faucet_wallet as _gfw

    pool_address = os.getenv("WARD_POOL_ADDRESS", VALID_ADDRESS)
    rpc    = _RPC("https://s.altnet.rippletest.net:51234/")
    wallet = await _gfw(rpc, debug=False)

    client = WardClient(xrpl_url="https://s.altnet.rippletest.net:51234/")
    result = await client.purchase_coverage(
        wallet=wallet,
        vault_address=VALID_ADDRESS,
        coverage_drops=1_000_000,
        period_days=7,
        pool_address=pool_address,
        premium_rate=0.01,
    )

    assert result["status"] == "active"
    assert len(result["nft_token_id"]) == 64
    assert result["coverage_drops"] == 1_000_000
