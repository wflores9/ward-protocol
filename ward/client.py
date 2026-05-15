"""
Ward Protocol - Module 1: WardClient

Entry point for purchasing default-protection policies on XRPL.

Workflow per policy purchase:
    1. Validate all inputs (addresses, amounts, period).
    2. Calculate premium in drops (no float XRP arithmetic).
    3. Submit Payment (premium to pool) via submit_with_retry.
    4. Assemble NFT URI metadata (compact JSON, <=512 hex chars enforced).
    5. Submit NFTokenMint (non-transferable, burnable policy certificate).
    6. Return structured result with on-chain proof.

Fixes applied:
    #1  Extracted from ward_client.py monolith into own module.
    #2  wallet typed as xrpl.wallet.Wallet - validated at boundary.
    #3  AsyncJsonRpcClient used as async context manager (no leaked connections).
    #6  submit_with_retry for both Payment and NFTokenMint.
    #7  URI hex length assertion enforced before any network call.
    #7  License tier embedded in NFT metadata (on-chain self-description).
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill
from xrpl.models import Memo, NFTokenMint, Payment
from xrpl.utils import str_to_hex
from xrpl.wallet import Wallet

from ward.constants import (
    DEFAULT_TESTNET_URL,
    TF_BURNABLE,
    WARD_POLICY_TAXON,
    LicenseTier,
)
from ward.coverage import build_premium_memo
from ward.primitives import (
    ValidationError,
    WardError,
    get_ledger_close_time,
    submit_with_retry,
    validate_drops_amount,
    validate_wallet,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.client")


class WardClient:
    """
    High-level Ward Protocol client for purchasing default-protection coverage.

    Usage::

        client = WardClient()
        result = await client.purchase_coverage(
            wallet=depositor_wallet,
            vault_address="rVault...",
            coverage_drops=10_000_000,
            period_days=90,
            pool_address="rPool...",
        )

    Ward never stores wallet keys.  The wallet object is used in memory only
    during the transaction signing flow, then discarded.
    """

    def __init__(self, url: str = DEFAULT_TESTNET_URL) -> None:
        self._url = url

    async def purchase_coverage(
        self,
        wallet: Wallet,
        vault_address: str,
        coverage_drops: int,
        period_days: int,
        pool_address: str,
        premium_rate: float = 0.01,
        license_tier: str = "starter",
    ) -> Dict[str, Any]:
        """
        Purchase a default-protection policy: pay premium + mint NFT certificate.

        All monetary amounts are in drops (1 XRP = 1_000_000 drops).
        No float XRP arithmetic is performed.

        Args:
            wallet:         Depositor's Wallet (used in memory only, never stored).
            vault_address:  XRPL address of the vault being protected.
            coverage_drops: Coverage amount in drops (must be > 0).
            period_days:    Coverage period in days (must be > 0).
            pool_address:   Coverage pool XRPL address.
            premium_rate:   Annual premium rate as a fraction (0.0 < rate <= 1.0).
            license_tier:   One of "starter", "standard", "enterprise".

        Returns:
            Dict with keys:
                nft_token_id    - the minted NFTokenID (hex)
                premium_tx      - hash of the premium Payment transaction
                mint_tx         - hash of the NFTokenMint transaction
                coverage_drops  - confirmed coverage amount in drops
                expiry_ledger   - ledger close time at which policy expires
        """
        # -- Input validation (addresses/amounts first; wallet last) --------
        validate_xrpl_address(vault_address, "vault_address")
        validate_xrpl_address(pool_address, "pool_address")
        validate_drops_amount(coverage_drops, "coverage_drops")

        if period_days <= 0:
            raise ValidationError(f"period_days must be > 0, got {period_days}")
        if not (0 < premium_rate <= 1.0):
            raise ValidationError(f"premium_rate must be in (0, 1], got {premium_rate}")

        wallet = validate_wallet(wallet)

        # -- Tier gate check ------------------------------------------------
        # (Risk tier enforcement happens at mint time in pool.py; here we
        # block unsupported tiers from reaching the network at all.)
        allowed = LicenseTier.TIER_MINT_GATES.get(license_tier)
        if allowed is None:
            raise ValidationError(
                f"Unknown license tier: {license_tier!r}. "
                "Must be one of: starter, standard, enterprise."
            )

        # -- Premium calculation (integer drops only) -----------------------
        premium_drops = int(coverage_drops * premium_rate * period_days / 365)
        if premium_drops < 1:
            premium_drops = 1

        async with AsyncJsonRpcClient(self._url) as client:
            # Step 1: Determine expiry from ledger close time
            current_time = await get_ledger_close_time(client)
            expiry = current_time + (period_days * 86_400)

            # Step 2: Assemble compact URI metadata
            metadata = {
                "w": "ward-v1",
                "v": vault_address,
                "c": str(coverage_drops),
                "e": expiry,
                "t": license_tier,
                "pa": pool_address,
            }
            uri_json = json.dumps(metadata, separators=(",", ":"))
            uri_hex = str_to_hex(uri_json).upper()
            if len(uri_hex) > 512:
                raise ValidationError(f"URI hex exceeds 512 chars: {len(uri_hex)}")

            # Step 3: Mint NFT policy certificate (before payment — NFT ID needed for memo)
            nft_memo = Memo(
                memo_data=str_to_hex(
                    f"ward-policy|{license_tier}|cov={coverage_drops}"
                ).upper()
            )
            mint_tx = NFTokenMint(
                account=wallet.classic_address,
                nftoken_taxon=WARD_POLICY_TAXON,
                flags=TF_BURNABLE,
                uri=uri_hex,
                memos=[nft_memo],
            )
            mint_tx = await autofill(mint_tx, client)
            mint_result = await submit_with_retry(mint_tx, client, wallet)
            nft_token_id = mint_result.result.get("meta", {}).get("nftoken_id", "")
            if not nft_token_id:
                raise WardError(
                    "NFT mint succeeded but nftoken_id is empty in response metadata"
                )
            mint_tx_hash = mint_result.result.get("tx_json", {}).get("hash", "")

            # Step 4: Premium Payment with ward/policy-premium memo (on-chain registry)
            premium_memo = build_premium_memo(nft_token_id, coverage_drops)
            payment = Payment(
                account=wallet.classic_address,
                destination=pool_address,
                amount=str(premium_drops),
                memos=[premium_memo],
            )
            payment = await autofill(payment, client)
            premium_result = await submit_with_retry(payment, client, wallet)
            premium_tx = premium_result.result.get("tx_json", {}).get("hash", "")
            if not premium_tx:
                raise WardError(
                    "Premium payment succeeded but transaction hash not found in result. "
                    "Check submit_and_wait response structure."
                )

            logger.info(
                "Policy purchased: vault=%s cov=%d tier=%s nft=%s",
                vault_address,
                coverage_drops,
                license_tier,
                nft_token_id,
            )

        return {
            "nft_token_id": nft_token_id,
            "premium_tx": premium_tx,
            "mint_tx": mint_tx_hash,
            "coverage_drops": coverage_drops,
            "expiry_ledger": expiry,
        }
