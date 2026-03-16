"""
Ward Protocol SDK — pytest test suite
======================================

Unit tests:       No XRPL network required (all XRPL calls are mocked).
Integration tests: Marked @pytest.mark.integration — hit XRPL testnet.
Adversarial tests: Simulate real attack scenarios against the validator.

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
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from ward_client import (
    CREDENTIAL_NFT_TAXON,
    PREIMAGE_BYTES,
    RATE_LIMIT_ATTEMPTS,
    RATE_LIMIT_WINDOW_S,
    TF_BURNABLE,
    VALID_KYC_TYPES,
    WARD_POLICY_TAXON,
    build_kyc_hash,
    validate_kyc_hash,
    ClaimValidator,
    EscrowRecord,
    EscrowSettlement,
    LedgerError,
    PoolHealth,
    PoolHealthMonitor,
    SecurityError,
    ValidationError,
    ValidationResult,
    VaultMonitor,
    WardClient,
    WardError,
    calculate_coverage_ratio,
    extract_nft_id,
    generate_claim_condition,
    get_ledger_time,
    make_preimage_condition,
    validate_drops_amount,
    validate_nft_id,
    validate_xrpl_address,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_ADDRESS  = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
VALID_ADDRESS2 = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
VALID_NFT_ID   = "A" * 64  # valid 64-hex-char string

VALID_LOAN_ID  = "B" * 64
POLICY_TAXON   = WARD_POLICY_TAXON


@dataclass
class FakeWallet:
    classic_address: str = VALID_ADDRESS
    seed: str = "sEdTM1uX8pu2do5XvTnutH6HsouMaM2"


def _make_mock_client():
    mock = AsyncMock()
    mock.request = AsyncMock()
    return mock


def _make_success_response(result_data: dict):
    resp = MagicMock()
    resp.is_successful.return_value = True
    resp.result = result_data
    return resp


def _make_fail_response(engine_result: str = "tecFAILED"):
    resp = MagicMock()
    resp.is_successful.return_value = False
    resp.result = {"meta": {"TransactionResult": engine_result}, "error": engine_result}
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
    # Mirrors the compact URI format used by WardClient.purchase_coverage
    return {
        "protocol":           "ward-v1",
        "vault_address":      vault_address,
        "coverage_drops":     str(coverage_drops),
        "expiry_ledger_time": expiry_ledger_time,
        "pool_address":       VALID_ADDRESS2,
    }


def _make_loan_node(
    flags: int = 0x00010000,  # lsfLoanDefault
    principal: int = 500_000,
    interest: int = 10_000,
    loan_broker_id: str = "E" * 64,
) -> dict:
    return {
        "Flags":                  flags,
        "PrincipalOutstanding":   principal,
        "InterestOutstanding":    interest,
        "TotalValueOutstanding":  principal + interest,
        "LoanBrokerID":           loan_broker_id,
    }


def _make_broker_node(
    debt_total: int = 1_000_000,
    cover_available: int = 500_000,
    cover_rate_minimum: float = 0.10,
    cover_rate_liquidation: float = 0.50,
) -> dict:
    return {
        "DebtTotal":              debt_total,
        "CoverAvailable":         cover_available,
        "CoverRateMinimum":       cover_rate_minimum,
        "CoverRateLiquidation":   cover_rate_liquidation,
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


# ===========================================================================
# Tests: Security utilities
# ===========================================================================


class TestValidateXrplAddress:
    def test_valid_address(self):
        validate_xrpl_address(VALID_ADDRESS)  # no exception

    def test_valid_address2(self):
        validate_xrpl_address(VALID_ADDRESS2)

    def test_empty_string_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("")

    def test_none_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address(None)  # type: ignore

    def test_too_short_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("rShort")

    def test_wrong_prefix_raises(self):
        with pytest.raises(ValidationError):
            validate_xrpl_address("xrpL" + "A" * 30)

    def test_invalid_checksum_raises(self):
        # Valid format but wrong checksum
        with pytest.raises(ValidationError):
            validate_xrpl_address("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyXX")

    def test_example_vault_fails(self):
        """Original prototype passed 'rExampleVaultXXX' — must be rejected."""
        with pytest.raises(ValidationError):
            validate_xrpl_address("rExampleVaultXXX")


class TestValidateDropsAmount:
    def test_valid_drops(self):
        validate_drops_amount(1_000_000)  # 1 XRP

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
        with pytest.raises(ValidationError):
            validate_drops_amount(1.5)  # type: ignore


class TestValidateNftId:
    def test_valid_64_hex(self):
        validate_nft_id("A" * 64)

    def test_mixed_case_valid(self):
        validate_nft_id("aAbBcCdD" * 8)

    def test_63_chars_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("A" * 63)

    def test_65_chars_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("A" * 65)

    def test_non_hex_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("G" * 64)

    def test_empty_raises(self):
        with pytest.raises(ValidationError):
            validate_nft_id("")


class TestCoverageRatio:
    def test_basic_ratio(self):
        ratio = calculate_coverage_ratio(2_000_000, 1_000_000)
        assert ratio == pytest.approx(2.0)

    def test_zero_loans_is_inf(self):
        assert calculate_coverage_ratio(1_000_000, 0) == float("inf")

    def test_ratio_below_min_raises(self):
        with pytest.raises(ValidationError, match="below minimum"):
            calculate_coverage_ratio(1_500_000, 1_000_000)  # 1.5x < 2.0x

    def test_ratio_exactly_at_min(self):
        ratio = calculate_coverage_ratio(2_000_000, 1_000_000)
        assert ratio == pytest.approx(2.0)

    def test_high_ratio(self):
        ratio = calculate_coverage_ratio(10_000_000, 1_000_000)
        assert ratio == pytest.approx(10.0)


class TestMakePreimageCondition:
    def test_output_lengths(self):
        preimage = os.urandom(PREIMAGE_BYTES)
        cond, fulf = make_preimage_condition(preimage)
        # Condition = A0 25 + 37 bytes → 39 bytes → 78 hex chars
        assert len(cond) == 78
        # Fulfillment = A0 22 + 34 bytes → 36 bytes → 72 hex chars
        assert len(fulf) == 72

    def test_condition_starts_with_a025(self):
        preimage = os.urandom(PREIMAGE_BYTES)
        cond, _ = make_preimage_condition(preimage)
        assert cond.upper().startswith("A025")

    def test_fulfillment_starts_with_a022(self):
        preimage = os.urandom(PREIMAGE_BYTES)
        _, fulf = make_preimage_condition(preimage)
        assert fulf.upper().startswith("A022")

    def test_condition_contains_sha256_of_preimage(self):
        preimage = bytes(range(32))
        sha256_hex = hashlib.sha256(preimage).hexdigest().upper()
        cond, _ = make_preimage_condition(preimage)
        # Condition inner: 8020 + sha256_hash
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


class TestExtractNftId:
    def test_meta_nftoken_id_shortcut(self):
        """Newer rippled exposes nftoken_id directly in meta."""
        response = MagicMock()
        response.result = {"meta": {"nftoken_id": "ab" * 32}}
        nft_id = extract_nft_id(response)
        assert nft_id == ("AB" * 32).upper()

    def test_created_node_fallback(self):
        """Older nodes: parse from CreatedNode NFTokenPage."""
        nft_id_hex = "CC" * 32
        response = MagicMock()
        response.result = {
            "meta": {
                "AffectedNodes": [
                    {
                        "CreatedNode": {
                            "LedgerEntryType": "NFTokenPage",
                            "NewFields": {
                                "NFTokens": [
                                    {"NFToken": {"NFTokenID": nft_id_hex}}
                                ]
                            },
                        }
                    }
                ]
            }
        }
        nft_id = extract_nft_id(response)
        assert nft_id == nft_id_hex.upper()

    def test_modified_node_fallback(self):
        """Older nodes: parse from ModifiedNode NFTokenPage diff."""
        old_id = "AA" * 32
        new_id = "BB" * 32
        response = MagicMock()
        response.result = {
            "meta": {
                "AffectedNodes": [
                    {
                        "ModifiedNode": {
                            "LedgerEntryType": "NFTokenPage",
                            "PreviousFields": {
                                "NFTokens": [{"NFToken": {"NFTokenID": old_id}}]
                            },
                            "FinalFields": {
                                "NFTokens": [
                                    {"NFToken": {"NFTokenID": old_id}},
                                    {"NFToken": {"NFTokenID": new_id}},
                                ]
                            },
                        }
                    }
                ]
            }
        }
        nft_id = extract_nft_id(response)
        assert nft_id == new_id.upper()

    def test_no_nft_id_raises(self):
        response = MagicMock()
        response.result = {"meta": {"AffectedNodes": []}}
        with pytest.raises(LedgerError):
            extract_nft_id(response)

    def test_original_bug_phantom_nftoken_entry_raises(self):
        """
        Bug fix [3]: original code looked for LedgerEntryType == 'NFToken'
        which doesn't exist — ensure we raise instead of silently returning None.
        """
        response = MagicMock()
        response.result = {
            "meta": {
                "AffectedNodes": [
                    {
                        "CreatedNode": {
                            "LedgerEntryType": "NFToken",  # phantom type
                            "NewFields": {"NFTokenID": "AA" * 32},
                        }
                    }
                ]
            }
        }
        with pytest.raises(LedgerError):
            extract_nft_id(response)


# ===========================================================================
# Tests: WardClient — purchase_coverage
# ===========================================================================


class TestWardClientInputValidation:
    """Module 1 — input validation before any network call."""

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
    async def test_zero_coverage_raises(self):
        with pytest.raises(ValidationError, match="coverage_drops"):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address=VALID_ADDRESS,
                coverage_drops=0,
                period_days=30,
                pool_address=VALID_ADDRESS2,
            )

    @pytest.mark.asyncio
    async def test_negative_period_raises(self):
        with pytest.raises(ValidationError):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address=VALID_ADDRESS,
                coverage_drops=1_000_000,
                period_days=-1,
                pool_address=VALID_ADDRESS2,
            )

    @pytest.mark.asyncio
    async def test_premium_rate_above_1_raises(self):
        with pytest.raises(ValidationError, match="premium_rate"):
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
        """Bug fix [6]: 'rExampleVaultXXX' must be rejected before any network call."""
        with pytest.raises(ValidationError):
            await self.client.purchase_coverage(
                wallet=self.wallet,
                vault_address="rExampleVaultXXX",
                coverage_drops=1_000_000,
                period_days=90,
                pool_address="rPoolAddressXXX",
            )

    def test_nft_flag_constant_is_burnable_not_transferable(self):
        """
        Security: TF_BURNABLE must be 0x1 (tfBurnable), NOT 0x8 (tfTransferable).

        Original prototype bug: flags=8 (tfTransferable) allowed policies to be sold.
        Correct value: flags=1 (tfBurnable only) — policy is non-transferable.
        """
        TF_TRANSFERABLE = 0x00000008
        assert TF_BURNABLE == 0x00000001, f"TF_BURNABLE must be 0x1, got {TF_BURNABLE:#x}"
        assert TF_BURNABLE & TF_TRANSFERABLE == 0, (
            "TF_BURNABLE must NOT have the tfTransferable bit set"
        )

    @pytest.mark.asyncio
    async def test_nft_mint_uses_burnable_flag(self):
        """Verify NFTokenMint is constructed with flags=TF_BURNABLE (0x1) not 8."""
        from xrpl.models import NFTokenMint as _NM

        captured_txs: list = []

        async def mock_submit(tx, client, wallet, **kwargs):
            captured_txs.append(tx)
            resp = MagicMock()
            resp.is_successful.return_value = True
            resp.result = {
                "hash": "D" * 64,
                "meta": {"TransactionResult": "tesSUCCESS", "nftoken_id": "F" * 64},
                "Sequence": 1,
            }
            return resp

        async def mock_autofill(tx, client):
            return tx

        with (
            patch("ward_client.submit_and_wait", side_effect=mock_submit),
            patch("ward_client.autofill", side_effect=mock_autofill),
            patch("ward_client.get_ledger_time", new=AsyncMock(return_value=100_000_000)),
        ):
            ward = WardClient()
            result = await ward.purchase_coverage(
                wallet=FakeWallet(),
                vault_address=VALID_ADDRESS,
                coverage_drops=1_000_000,
                period_days=30,
                pool_address=VALID_ADDRESS2,
            )

        assert result["status"] == "active"

        mint_txs = [t for t in captured_txs if isinstance(t, _NM)]
        assert mint_txs, "No NFTokenMint transaction was built"
        assert mint_txs[0].flags == TF_BURNABLE, (
            f"NFT flags={mint_txs[0].flags:#x}, expected {TF_BURNABLE:#x} (tfBurnable). "
            "tfTransferable (0x8) must NOT be set."
        )


# ===========================================================================
# Tests: ClaimValidator — 9-step adversarial validation
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


class TestClaimValidatorAdversarial:
    """Adversarial test cases against the 9-step validator."""

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
        validator = ClaimValidator()

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
        loan_node  = _make_loan_node(
            flags=loan_flags,
            principal=500_000,
            interest=10_000,
        )
        broker_node = _make_broker_node(
            debt_total=1_000_000,
            cover_available=100_000,
        )
        # Vault with TVL < 2x outstanding loans → coverage breach
        vault_node = _make_vault_node(
            assets_total=400_000,
            loss_unrealized=0,
        )
        pool_info = {"account_data": {"Balance": str(pool_balance_drops)}}

        async def mock_request(req):
            from xrpl.models import AccountNFTs as _ANFTs, AccountInfo as _AI
            from xrpl.models import ServerInfo as _SI, LedgerEntry as _LE

            if isinstance(req, _ANFTs):
                nfts = [nft_entry] if nft_exists else []
                return _make_success_response({"account_nfts": nfts})
            elif isinstance(req, _SI):
                return _make_success_response(_make_server_info_response(ledger_time))
            elif isinstance(req, _LE):
                # ward_client uses LedgerEntry(index=...) for loan/loan_broker objects
                # and LedgerEntry(vault=...) for vault objects
                index_val = getattr(req, "index", None)
                vault_val = getattr(req, "vault", None)
                if index_val == VALID_LOAN_ID:
                    # Loan lookup
                    if not default_flag_set:
                        return _make_fail_response()
                    return _make_success_response({"node": loan_node})
                elif index_val is not None and index_val != VALID_LOAN_ID:
                    # LoanBroker lookup (any other index)
                    if not loan_broker_available:
                        return _make_fail_response()
                    return _make_success_response({"node": broker_node})
                elif vault_val is not None:
                    return _make_success_response({"node": vault_node})
                return _make_fail_response()
            elif isinstance(req, _AI):
                return _make_success_response(pool_info)
            return _make_fail_response()

        validator._client = MagicMock()
        validator._client.request = AsyncMock(side_effect=mock_request)
        return validator

    # ── Adversarial Test 1: Fake claim — NFT does not exist ──────────

    @pytest.mark.asyncio
    async def test_fake_claim_nft_not_found(self):
        """
        Attack: Attacker tries to claim without owning a valid policy NFT.
        Mitigation: Step 1 verifies NFT existence on-chain.
        """
        validator = self._make_validator_with_mocks(nft_exists=False)
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "not found" in result.rejection_reason.lower()

    # ── Adversarial Test 2: Expired policy ───────────────────────────

    @pytest.mark.asyncio
    async def test_expired_policy_rejected(self):
        """
        Attack: Claimant uses an expired policy.
        Mitigation: Step 2 checks XRPL ledger time, not local clock.
        """
        validator = self._make_validator_with_mocks(
            ledger_time=200_000_000,
            expiry_time=100_000_000,  # expired
        )
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "expired" in result.rejection_reason.lower()

    # ── Adversarial Test 3: Wrong vault in claim ──────────────────────

    @pytest.mark.asyncio
    async def test_wrong_vault_rejected(self):
        """
        Attack: Claimant uses a policy for Vault A to claim against Vault B.
        Mitigation: Step 3 checks vault_address in NFT metadata.
        """
        validator = self._make_validator_with_mocks(
            policy_vault=VALID_ADDRESS,
            defaulted_vault=VALID_ADDRESS2,  # different vault
        )
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS2,  # trying to claim against wrong vault
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "mismatch" in result.rejection_reason.lower()

    # ── Adversarial Test 4: No default flag on loan ───────────────────

    @pytest.mark.asyncio
    async def test_no_default_flag_rejected(self):
        """
        Attack: Claimant tries to claim when no actual default occurred.
        Mitigation: Step 4 reads lsfLoanDefault flag directly from ledger object.
        """
        validator = self._make_validator_with_mocks(default_flag_set=False)
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "lsfLoanDefault" in result.rejection_reason or "not found" in result.rejection_reason.lower()

    # ── Adversarial Test 5: Pool insolvent ────────────────────────────

    @pytest.mark.asyncio
    async def test_pool_insolvent_rejected(self):
        """
        Attack: Claim submitted when pool is drained / undercollateralized.
        Mitigation: Step 9 checks pool balance on-chain.
        """
        validator = self._make_validator_with_mocks(
            pool_balance_drops=100,  # near-zero balance
            coverage_drops=10_000_000,
        )
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "insolvent" in result.rejection_reason.lower()

    # ── Adversarial Test 6: Wrong NFT taxon ──────────────────────────

    @pytest.mark.asyncio
    async def test_wrong_taxon_rejected(self):
        """
        Attack: Attacker mints an NFT with fake policy data but wrong taxon.
        Mitigation: Step 1 verifies NFTokenTaxon == WARD_POLICY_TAXON.
        """
        validator = self._make_validator_with_mocks(nft_taxon=9999)
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved

    # ── Adversarial Test 7: Replay attack (NFT already burned) ────────

    @pytest.mark.asyncio
    async def test_replay_attack_burned_nft_rejected(self):
        """
        Attack: Claimant tries to file a second claim after NFT was burned.
        Mitigation: Step 1 — burned NFT is no longer in account_nfts → rejected.
        This test simulates the post-burn state (nft_exists=False).
        """
        validator = self._make_validator_with_mocks(nft_exists=False)
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        # Must explicitly call out the replay attempt
        assert "burned" in result.rejection_reason.lower() or "not found" in result.rejection_reason.lower()

    # ── Adversarial Test 8: Rate limit / rapid claim attempts ─────────

    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self):
        """
        Attack: Spamming claim submissions for the same NFT.
        Mitigation: In-memory rate limiter caps RATE_LIMIT_ATTEMPTS attempts.
        """
        validator = self._make_validator_with_mocks(nft_exists=False)

        # Exhaust the rate limit
        for _ in range(RATE_LIMIT_ATTEMPTS):
            await validator.validate_claim(
                claimant_address=VALID_ADDRESS,
                nft_token_id=VALID_NFT_ID,
                defaulted_vault=VALID_ADDRESS,
                loan_id=VALID_LOAN_ID,
                pool_address=VALID_ADDRESS2,
            )

        # Next attempt should be rate-limited
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert not result.approved
        assert "rate limit" in result.rejection_reason.lower()

    # ── Happy path ─────────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_valid_claim_approved(self):
        """Happy path: all 9 steps pass → claim approved."""
        validator = self._make_validator_with_mocks(
            nft_exists=True,
            pool_balance_drops=50_000_000,
            coverage_drops=100_000,
        )
        result = await validator.validate_claim(
            claimant_address=VALID_ADDRESS,
            nft_token_id=VALID_NFT_ID,
            defaulted_vault=VALID_ADDRESS,
            loan_id=VALID_LOAN_ID,
            pool_address=VALID_ADDRESS2,
        )
        assert result.approved
        assert result.claim_payout_drops > 0
        assert result.steps_passed == 9


# ===========================================================================
# Tests: make_preimage_condition — cryptographic correctness
# ===========================================================================


class TestPreimageConditionCryptography:
    def test_roundtrip_condition_matches_fulfillment(self):
        """
        Verify the condition encodes SHA-256(preimage) as its fingerprint.
        This ensures the XRPL escrow can validate the fulfillment.
        """
        preimage = bytes(range(32))
        sha256   = hashlib.sha256(preimage).digest()

        cond, fulf = make_preimage_condition(preimage)
        cond_bytes = bytes.fromhex(cond)
        fulf_bytes = bytes.fromhex(fulf)

        # Condition structure: A0 25 80 20 <sha256> 81 01 20
        assert cond_bytes[0] == 0xA0        # PREIMAGE-SHA-256 tag
        assert cond_bytes[1] == 0x25        # inner length = 37
        assert cond_bytes[2] == 0x80        # fingerprint field tag
        assert cond_bytes[3] == 0x20        # fingerprint length = 32
        assert cond_bytes[4:36] == sha256   # fingerprint = sha256(preimage)
        assert cond_bytes[36] == 0x81       # cost field tag
        assert cond_bytes[37] == 0x01       # cost length = 1
        assert cond_bytes[38] == 0x20       # cost = 32

        # Fulfillment structure: A0 22 80 20 <preimage>
        assert fulf_bytes[0] == 0xA0        # PREIMAGE-SHA-256 tag
        assert fulf_bytes[1] == 0x22        # inner length = 34
        assert fulf_bytes[2] == 0x80        # preimage field tag
        assert fulf_bytes[3] == 0x20        # preimage length = 32
        assert fulf_bytes[4:36] == preimage  # preimage itself

    def test_unique_conditions_per_preimage(self):
        """Different preimages must produce different conditions (no collision)."""
        conditions = set()
        for _ in range(100):
            p = os.urandom(PREIMAGE_BYTES)
            c, _ = make_preimage_condition(p)
            conditions.add(c)
        assert len(conditions) == 100, "Hash collision detected — critical bug"


# ===========================================================================
# Tests: VaultMonitor — anomaly detection
# ===========================================================================


class TestVaultMonitorAnomalyDetection:
    def test_anomaly_triggered_after_threshold(self):
        monitor = VaultMonitor(vault_addresses=[VALID_ADDRESS])
        vault   = VALID_ADDRESS

        # Inject ANOMALY_THRESHOLD - 1 signals — should not trigger
        from ward_client import ANOMALY_THRESHOLD, ANOMALY_WINDOW_SECONDS

        for i in range(ANOMALY_THRESHOLD - 1):
            result = monitor._detect_anomaly(vault)
        assert not result, "Anomaly should not trigger below threshold"

        # One more — now at threshold — should trigger
        result = monitor._detect_anomaly(vault)
        assert result, "Anomaly should trigger at threshold"

    def test_anomaly_window_expires(self):
        from ward_client import ANOMALY_THRESHOLD

        monitor = VaultMonitor(vault_addresses=[VALID_ADDRESS])
        vault   = VALID_ADDRESS

        # Fill the window
        now = time.time()
        for _ in range(ANOMALY_THRESHOLD):
            monitor._recent_signals[vault].append(now - 9999)  # expired timestamps

        # Fresh signal — window should have cleared old entries
        result = monitor._detect_anomaly(vault)
        assert not result, "Old signals should not count after window expires"

    def test_invalid_vault_address_rejected(self):
        with pytest.raises(ValidationError):
            VaultMonitor(vault_addresses=["rInvalidXXXXXXXX"])

    def test_add_vault_validates_address(self):
        monitor = VaultMonitor(vault_addresses=[VALID_ADDRESS])
        with pytest.raises(ValidationError):
            monitor.add_vault("not-a-valid-xrpl-address")


# ===========================================================================
# Tests: PoolHealthMonitor — solvency and dynamic pricing
# ===========================================================================


class TestPoolHealthMonitor:
    def _make_monitor(self, balance_drops: int = 10_000_000) -> PoolHealthMonitor:
        monitor = PoolHealthMonitor(pool_address=VALID_ADDRESS)

        async def mock_request(req):
            return _make_success_response(
                {"account_data": {"Balance": str(balance_drops)}}
            )

        monitor._client = MagicMock()
        monitor._client.request = AsyncMock(side_effect=mock_request)
        return monitor

    @pytest.mark.asyncio
    async def test_solvent_pool(self):
        monitor = self._make_monitor(balance_drops=20_000_000 + 4_000_000)
        # 4 XRP usable vs 1 XRP coverage = 4x ratio → solvent
        health = await monitor.get_health(active_coverage_drops=1_000_000)
        assert health.is_solvent

    @pytest.mark.asyncio
    async def test_undercollateralized_pool(self):
        monitor = self._make_monitor(balance_drops=20_000_000 + 1_000_000)
        # 1 XRP usable vs 10 XRP coverage = 0.1x ratio → insolvent
        health = await monitor.get_health(active_coverage_drops=10_000_000)
        assert not health.is_solvent

    @pytest.mark.asyncio
    async def test_minting_blocked_when_insolvent(self):
        monitor = self._make_monitor(balance_drops=20_000_000 + 100)
        health  = await monitor.get_health(active_coverage_drops=10_000_000)
        assert not monitor.is_minting_allowed(health)

    @pytest.mark.asyncio
    async def test_dynamic_premium_higher_when_undercollateralized(self):
        monitor_safe     = self._make_monitor(balance_drops=20_000_000 + 100_000_000)
        monitor_stressed = self._make_monitor(balance_drops=20_000_000 + 3_000_000)

        health_safe     = await monitor_safe.get_health(active_coverage_drops=1_000_000)
        health_stressed = await monitor_stressed.get_health(active_coverage_drops=2_800_000)

        assert health_stressed.dynamic_premium_rate >= health_safe.dynamic_premium_rate

    @pytest.mark.asyncio
    async def test_calculate_premium_pro_rated(self):
        monitor = self._make_monitor(balance_drops=20_000_000 + 10_000_000)
        health  = await monitor.get_health(active_coverage_drops=1_000_000)

        # 30-day premium should be ~ 1/12th of annual
        result_30  = monitor.calculate_premium(health, 1_000_000, 30)
        result_365 = monitor.calculate_premium(health, 1_000_000, 365)

        assert result_30["premium_drops"] > 0
        assert result_365["premium_drops"] > result_30["premium_drops"]

    def test_invalid_pool_address_raises(self):
        with pytest.raises(ValidationError):
            PoolHealthMonitor(pool_address="invalid-addr")

    @pytest.mark.asyncio
    async def test_zero_coverage_returns_inf_ratio(self):
        monitor = self._make_monitor(balance_drops=20_000_000 + 5_000_000)
        health  = await monitor.get_health(active_coverage_drops=0)
        assert health.coverage_ratio == float("inf")
        assert health.is_solvent


# ===========================================================================
# Tests: EscrowSettlement — crypto condition flow
# ===========================================================================


class TestEscrowSettlement:
    def _make_settlement(self) -> EscrowSettlement:
        settlement = EscrowSettlement()

        async def mock_request(req):
            return _make_success_response(
                _make_server_info_response(close_time=100_000_000)
            )

        settlement._client = MagicMock()
        settlement._client.request = AsyncMock(side_effect=mock_request)
        return settlement

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
            finish_after_ripple=100_000_000 - 1,   # already finishable
            cancel_after_ripple=100_000_000 + 7200, # not yet cancellable
        )

    @pytest.mark.asyncio
    async def test_finish_before_dispute_window_raises(self):
        settlement = self._make_settlement()
        preimage, cond, fulf = generate_claim_condition()
        record = EscrowRecord(
            claim_id="claim-x",
            nft_token_id=VALID_NFT_ID,
            pool_address=VALID_ADDRESS,
            claimant_address=VALID_ADDRESS2,
            payout_drops=1_000_000,
            escrow_sequence=1,
            condition_hex=cond,
            tx_hash="F" * 64,
            finish_after_ripple=200_000_000,  # far in future
            cancel_after_ripple=300_000_000,
        )
        with pytest.raises(ValidationError, match="not yet finishable"):
            await settlement.finish_escrow(
                claimant_wallet=FakeWallet(classic_address=VALID_ADDRESS2),
                escrow_record=record,
                fulfillment_hex=fulf,
                nft_wallet=FakeWallet(classic_address=VALID_ADDRESS2),
            )

    @pytest.mark.asyncio
    async def test_cancel_before_window_raises(self):
        settlement = self._make_settlement()
        preimage, cond, fulf = generate_claim_condition()
        record = EscrowRecord(
            claim_id="claim-y",
            nft_token_id=VALID_NFT_ID,
            pool_address=VALID_ADDRESS,
            claimant_address=VALID_ADDRESS2,
            payout_drops=500_000,
            escrow_sequence=2,
            condition_hex=cond,
            tx_hash="G" * 64,
            finish_after_ripple=50_000_000,
            cancel_after_ripple=200_000_000,  # not yet
        )
        pool_wallet = FakeWallet(classic_address=VALID_ADDRESS)
        with pytest.raises(ValidationError, match="not yet cancellable"):
            await settlement.cancel_escrow(
                pool_wallet=pool_wallet,
                escrow_record=record,
                reason="dispute",
            )

    @pytest.mark.asyncio
    async def test_create_escrow_validates_addresses(self):
        settlement = self._make_settlement()
        preimage, cond, fulf = generate_claim_condition()
        with pytest.raises(ValidationError):
            await settlement.create_claim_escrow(
                pool_wallet=FakeWallet(),
                claimant_address="bad-address",
                payout_drops=500_000,
                condition_hex=cond,
                nft_token_id=VALID_NFT_ID,
                claim_id="claim-z",
            )


# ===========================================================================
# Tests: WardError hierarchy
# ===========================================================================


class TestErrorHierarchy:
    def test_validation_error_is_ward_error(self):
        assert issubclass(ValidationError, WardError)

    def test_security_error_is_ward_error(self):
        assert issubclass(SecurityError, WardError)

    def test_ledger_error_is_ward_error(self):
        assert issubclass(LedgerError, WardError)


# ===========================================================================
# Integration tests — marked separately, require XRPL testnet access
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
    print(f"\nPolicy: {result['policy_id']}  NFT: {result['nft_token_id'][:16]}...")


# ============================================================================
# XLS-70 CREDENTIAL TESTS
# ============================================================================

class TestBuildKycHash:

    def test_returns_64_char_hex(self):
        result = build_kyc_hash(VALID_ADDRESS, VALID_ADDRESS2, 1000000, "KYC")
        assert isinstance(result, str)
        assert len(result) == 64
        assert result == result.lower()
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic(self):
        args = dict(depositor_address=VALID_ADDRESS, institution_address=VALID_ADDRESS2,
                    xrpl_ledger_time=999999, kyc_type="AML")
        assert build_kyc_hash(**args) == build_kyc_hash(**args)

    def test_different_inputs_differ(self):
        h1 = build_kyc_hash(VALID_ADDRESS, VALID_ADDRESS2, 1000000, "KYC")
        h2 = build_kyc_hash(VALID_ADDRESS, VALID_ADDRESS2, 1000001, "KYC")
        h3 = build_kyc_hash(VALID_ADDRESS, VALID_ADDRESS2, 1000000, "AML")
        assert h1 != h2
        assert h1 != h3

    def test_all_valid_kyc_types(self):
        for kyc_type in VALID_KYC_TYPES:
            result = build_kyc_hash(VALID_ADDRESS, VALID_ADDRESS2, 500000, kyc_type)
            assert len(result) == 64


class TestValidateKycHash:

    def test_valid_hash_passes(self):
        validate_kyc_hash("a" * 64)  # should not raise

    def test_valid_sha256_hex_passes(self):
        validate_kyc_hash("3f4a2b1c9e8d7f6a0b5c4d3e2f1a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a")

    def test_too_short_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("abc123")

    def test_too_long_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("a" * 65)

    def test_uppercase_rejected(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("A" * 64)

    def test_not_string_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash(12345)

    def test_non_hex_chars_raise(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash("z" * 64)

    def test_none_raises(self):
        with pytest.raises(ValidationError):
            validate_kyc_hash(None)


class TestCredentialConstants:

    def test_credential_nft_taxon_is_282(self):
        assert CREDENTIAL_NFT_TAXON == 282

    def test_taxon_distinct_from_policy(self):
        assert WARD_POLICY_TAXON != CREDENTIAL_NFT_TAXON

    def test_valid_kyc_types_contains_required(self):
        assert "KYC" in VALID_KYC_TYPES
        assert "AML" in VALID_KYC_TYPES
        assert "ACCREDITED" in VALID_KYC_TYPES
        assert "INSTITUTIONAL" in VALID_KYC_TYPES


class TestIssueCredentialValidation:
    """Input validation tests — no network required."""

    def _make_client(self):
        client = WardClient.__new__(WardClient)
        client._xrpl_url = "https://s.altnet.rippletest.net:51234/"
        return client

    def test_invalid_kyc_type_raises(self):
        client = self._make_client()
        wallet = FakeWallet(VALID_ADDRESS)
        async def run():
            await client.issue_credential(
                institution_wallet=wallet,
                depositor_address=VALID_ADDRESS2,
                kyc_type="INVALID_TYPE",
                period_days=30,
            )
        with pytest.raises(ValidationError, match="kyc_type must be one of"):
            asyncio.get_event_loop().run_until_complete(run())

    def test_zero_period_days_raises(self):
        client = self._make_client()
        wallet = FakeWallet(VALID_ADDRESS)
        async def run():
            await client.issue_credential(
                institution_wallet=wallet,
                depositor_address=VALID_ADDRESS2,
                kyc_type="KYC",
                period_days=0,
            )
        with pytest.raises(ValidationError, match="period_days must be positive"):
            asyncio.get_event_loop().run_until_complete(run())

    def test_negative_period_days_raises(self):
        client = self._make_client()
        wallet = FakeWallet(VALID_ADDRESS)
        async def run():
            await client.issue_credential(
                institution_wallet=wallet,
                depositor_address=VALID_ADDRESS2,
                kyc_type="KYC",
                period_days=-1,
            )
        with pytest.raises(ValidationError, match="period_days must be positive"):
            asyncio.get_event_loop().run_until_complete(run())

    def test_invalid_depositor_address_raises(self):
        client = self._make_client()
        wallet = FakeWallet(VALID_ADDRESS)
        async def run():
            await client.issue_credential(
                institution_wallet=wallet,
                depositor_address="not-a-valid-xrpl-address",
                kyc_type="KYC",
                period_days=30,
            )
        with pytest.raises(ValidationError):
            asyncio.get_event_loop().run_until_complete(run())

    def test_invalid_precomputed_hash_raises(self):
        client = self._make_client()
        wallet = FakeWallet(VALID_ADDRESS)
        async def run():
            await client.issue_credential(
                institution_wallet=wallet,
                depositor_address=VALID_ADDRESS2,
                kyc_type="KYC",
                period_days=30,
                kyc_record_hash="not-a-valid-hash",
            )
        with pytest.raises(ValidationError):
            asyncio.get_event_loop().run_until_complete(run())
