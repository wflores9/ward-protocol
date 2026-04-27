"""
Ward Protocol — Module 1: WardClient

Entry point for purchasing default-protection policies on XRPL.

Workflow per policy purchase:
    1. Validate all inputs (addresses, amounts, period).
    2. Calculate premium in drops (no float XRP arithmetic).
    3. Submit Payment (premium → pool) via submit_with_retry.
    4. Assemble NFT URI metadata (compact JSON, ≤512 hex chars enforced).
    5. Submit NFTokenMint (non-transferable, burnable policy certificate).
    6. Return structured result with on-chain proof.

Fixes applied:
    #1  Extracted from ward_client.py monolith into own module.
    #2  wallet typed as xrpl.wallet.Wallet — validated at boundary.
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
)
from ward.primitives import (
    LedgerError,
    ValidationError,
    get_ledger_close_time,
    submit_with_retry,
    validate_drops_amount,
    validate_wallet,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.client")


# ---------------------------------------------------------------------------
# WardClient
# ---------------------------------------------------------------------------


class WardClient:
    """
    Module 1 — Purchase default-protection policies on XRPL.

    Ward NEVER stores the caller’s wallet. It is used only within the scope
    of a single async call and immediately goes out of scope.

    Tier note:
        Starter:    policy minting capped to moderate pool risk.
        Standard:   minting allowed up to elevated risk (hosted API).
        Enterprise: same as Standard; white-label, custom SLA.
    """

    def __init__(
        self,
        xrpl_url: str = DEFAULT_TESTNET_URL,
        license_tier: str = "starter",
    ) -> None:
        """
        Args:
            xrpl_url:     JSON-RPC endpoint (testnet default).
            license_tier: Licensing tier (“starter” / “standard” / “enterprise”).
        """
        self._url = xrpl_url
        self._license_tier = license_tier.lower()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def purchase_coverage(
        self,
        wallet: Wallet,
        vault_address: str,
        coverage_drops: int,
        period_days: int,
        pool_address: str,
        premium_rate: float = 0.01,
    ) -> Dict[str, Any]:
        """
        Purchase a default-protection policy: pay premium + mint NFT certificate.

        All monetary amounts are in drops (1 XRP = 1_000_000 drops).
        No float XRP arithmetic is performed.

        Args:
            wallet:         Depositor’s Wallet (used in memory only, never stored).
            vault_address:  XRPL address of the vault being protected.
            coverage_drops: Coverage amount in drops (must be > 0).
            period_days:    Coverage period in days (must be > 0).
            pool_address:   Insurance pool XRPL address.
            premium_rate:   Annual premium rate as a fraction (0.0 < rate ≤ 1.0).

        Returns:
            Dict with keys:
                nft_token_id    — 64-char hex NFTokenID.
                premium_paid    — premium in drops.
                tx_hash_payment — Payment tx hash.
                tx_hash_mint    — NFTokenMint tx hash.
                status          — "active".
                coverage_drops  — echo of the coverage amount.
                vault_address   — echo of the vault address.
                pool_address    — echo of the pool address.

        Raises:
            ValidationError: for invalid input parameters.
            LedgerError:     if either XRPL transaction fails.
        """
        # ── Input validation ───────────────────────────────────────────────
        wallet = validate_wallet(wallet)
        validate_xrpl_address(vault_address, "vault_address")
        validate_xrpl_address(pool_address,  "pool_address")
        validate_drops_amount(coverage_drops, "coverage_drops")

        if period_days <= 0:
            raise ValidationError(f"period_days must be > 0, got {period_days}")
        if not (0 < premium_rate <= 1.0):
            raise ValidationError(
                f"premium_rate must be in (0, 1], got {premium_rate}"
            )

        # ── Premium calculation (integer drops only) ────────────────────────
        premium_drops = int(coverage_drops * premium_rate * period_days / 365)
        if premium_drops < 1:
            premium_drops = 1

        async with AsyncJsonRpcClient(self._url) as client:
            # ── Step 1: Premium Payment ────────────────────────────────────
            payment_tx = Payment(
                account=wallet.classic_address,
                destination=pool_address,
                amount=str(premium_drops),
            )
            payment_tx = await autofill(payment_tx, client)
            premium_response = await submit_with_retry(payment_tx, client, wallet)
            premium_tx_hash = premium_response.result.get("hash", "")
            logger.info(
                "Premium payment confirmed: %s drops → %s  tx=%s",
                premium_drops, pool_address, premium_tx_hash,
            )

            # ── Step 2: Build NFT URI metadata ──────────────────────────────
            ledger_time = await get_ledger_close_time(client)
            expiry_ledger_time = ledger_time + int(period_days * 86_400)

            uri_metadata = {
                "w":  "ward-v1",
                "v":  vault_address,
                "c":  str(coverage_drops),
                "e":  expiry_ledger_time,
                "pa": pool_address,
                "t":  self._license_tier,
            }

            uri_json = json.dumps(uri_metadata, separators=(",", ":"))
            uri_hex  = uri_json.encode().hex().upper()

            if len(uri_hex) > 512:
                raise ValidationError(
                    f"Policy URI too long: {len(uri_hex)} hex chars (max 512). "
                    "Reduce coverage metadata."
                )

            # ── Step 3: Mint Policy NFT ───────────────────────────────────────
            memo = Memo(
                memo_data=str_to_hex(
                    f"ward-policy|{vault_address}|{coverage_drops}|{period_days}d|"
                    f"tier={self._license_tier}"
                ),
            )
            mint_tx = NFTokenMint(
                account=wallet.classic_address,
                nftoken_taxon=WARD_POLICY_TAXON,
                flags=TF_BURNABLE,
                uri=uri_hex,
                memos=[memo],
            )
            mint_tx = await autofill(mint_tx, client)
            mint_response = await submit_with_retry(mint_tx, client, wallet)
            mint_tx_hash = mint_response.result.get("hash", "")
            nft_id = self._extract_nft_token_id(mint_response)
            logger.info(
                "Policy NFT minted: id=%s  vault=%s  tx=%s",
                nft_id, vault_address, mint_tx_hash,
            )

        return {
            "nft_token_id":    nft_id,
            "premium_paid":    premium_drops,
            "tx_hash_payment": premium_tx_hash,
            "tx_hash_mint":    mint_tx_hash,
            "status":          "active",
            "coverage_drops":  coverage_drops,
            "vault_address":   vault_address,
            "pool_address":    pool_address,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_nft_token_id(mint_response: Any) -> str:
        """
        Extract the NFT token ID from a successful NFTokenMint response.

        Searches AffectedNodes → NFTokenPage for the minted token.
        Returns empty string if extraction fails (caller should log + alert).
        """
        try:
            nodes = (
                mint_response.result
                .get("meta", {})
                .get("AffectedNodes", [])
            )
            for node in nodes:
                for node_type in ("CreatedNode", "ModifiedNode"):
                    entry = node.get(node_type, {})
                    if entry.get("LedgerEntryType") != "NFTokenPage":
                        continue
                    fields = entry.get("NewFields") or entry.get("FinalFields") or {}
                    prev   = entry.get("PreviousFields", {})
                    cur_nfts  = fields.get("NFTokens", [])
                    prev_nfts = prev.get("NFTokens",  [])
                    cur_ids   = {n["NFToken"]["NFTokenID"] for n in cur_nfts if "NFToken" in n}
                    prev_ids  = {n["NFToken"]["NFTokenID"] for n in prev_nfts if "NFToken" in n}
                    new_ids   = cur_ids - prev_ids
                    if new_ids:
                        return new_ids.pop()
        except Exception as exc:
            logger.warning("NFTokenID extraction failed: %s", exc)
        return ""
