"""
Ward Protocol - Module 3: ClaimValidator

9-step adversarial-hardened claim validation.
All state sourced from XRPL. No off-chain inputs trusted.

Fixes: #1 Extracted. #3 asyncio.gather for steps 1/4/9. #7 dual URI format.
"""

from __future__ import annotations
import asyncio
import json
import logging
import time
from collections import deque
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.models import AccountInfo, AccountNFTs, LedgerEntry

from ward.constants import (
    CLAIM_RATE_LIMIT_MAX,
    CLAIM_RATE_LIMIT_WINDOW_S,
    DEFAULT_TESTNET_URL,
    LSF_LOAN_DEFAULT,
    MIN_COVERAGE_RATIO,
    WARD_POLICY_TAXON,
    XRPL_BASE_RESERVE_DROPS,
    XRPL_OWNER_RESERVE_DROPS,
)
from ward.primitives import (
    LedgerError,
    ValidationError,
    get_ledger_close_time,
    validate_nft_id,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.validator")


@dataclass
class ValidationResult:
    approved:              bool
    claim_payout_drops:    int = 0
    vault_loss_drops:      int = 0
    policy_coverage_drops: int = 0
    rejection_reason:      str = ""
    steps_passed:          int = 0


# Sentinel returned by _step1_verify_nft_exists when NFT has wrong taxon.
_WRONG_TAXON = object()


class ClaimValidator:
    """
    Validate Ward Protocol insurance claims against on-chain state.

    All 9 steps read directly from the XRPL ledger.
    No off-chain data is trusted.
    """

    def __init__(self, url: str = DEFAULT_TESTNET_URL) -> None:
        self._url = url
        self._rate_window: deque = deque()

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    async def validate_claim(
        self,
        *,
        claimant_address: str,
        nft_token_id:     str,
        defaulted_vault:  str,
        loan_id:          str,
        pool_address:     str,
    ) -> ValidationResult:
        """
        Run all 9 validation steps and return a ValidationResult.

        Args:
            claimant_address: XRPL address of the party submitting the claim.
            nft_token_id:     NFTokenID of the Ward policy NFT.
            defaulted_vault:  XRPL address of the defaulted vault.
            loan_id:          Ledger index of the XLS-66 loan entry.
            pool_address:     XRPL address of the Ward insurance pool.

        Returns:
            ValidationResult with approved=True and payout amount if valid.
        """
        validate_xrpl_address(claimant_address, "claimant_address")
        validate_xrpl_address(defaulted_vault,  "defaulted_vault")
        validate_xrpl_address(pool_address,     "pool_address")
        validate_nft_id(nft_token_id)

        self._check_rate_limit(claimant_address)

        async with AsyncJsonRpcClient(self._url) as client:
            # Steps 1, 4, 9 can start in parallel.
            nft_data, (default_flag, vault_loss), pool_info = await asyncio.gather(
                self._step1_verify_nft_exists(client, claimant_address, nft_token_id),
                self._step4_verify_default_flag(client, loan_id),
                self._fetch_pool_info(client, pool_address),
            )

            if nft_data is _WRONG_TAXON:
                return self._reject(1, f"Wrong NFT taxon: policy taxon mismatch (expected {WARD_POLICY_TAXON})")

            if nft_data is None:
                return self._reject(1, f"NFT {nft_token_id[:16]}... not found (burned/missing).")
            logger.info("Step 1 passed")

            metadata, meta_err = self._parse_nft_metadata(nft_data)
            if meta_err:
                return self._reject(2, meta_err)

            expiry_err = await self._step2_check_expiry(client, metadata)
            if expiry_err:
                return self._reject(2, expiry_err)
            logger.info("Step 2 passed")

            meta_vault = metadata.get("vault_address") or metadata.get("v", "")
            if meta_vault != defaulted_vault:
                return self._reject(3, f"Vault mismatch: {meta_vault!r} != {defaulted_vault!r}")
            logger.info("Step 3 passed")

            if not default_flag:
                return self._reject(4, "Loan default flag not set on-chain.")
            logger.info("Step 4 passed")

            loss_err = self._step5_check_vault_loss(vault_loss)
            if loss_err:
                return self._reject(5, loss_err)
            logger.info("Step 5 passed")

            breach_err, breached = await self._step6_check_coverage_breach(
                client, pool_address, defaulted_vault
            )
            if breach_err and not breached:
                return self._reject(6, breach_err)
            logger.info("Step 6 passed")

            logger.info("Step 7 passed: replay protection OK (NFT live)")
            logger.info("Step 8 passed: claimant holds NFT")

            policy_coverage = int(
                metadata.get("coverage_drops") or metadata.get("c") or 0
            )
            payout = min(vault_loss, policy_coverage)

            sol_err = self._step9_check_pool_solvency(pool_info, payout)
            if sol_err:
                return self._reject(9, sol_err)
            logger.info("Step 9 passed")

            return ValidationResult(
                approved=True,
                claim_payout_drops=payout,
                vault_loss_drops=vault_loss,
                policy_coverage_drops=policy_coverage,
                steps_passed=9,
            )

    # ------------------------------------------------------------------ #
    # Step helpers                                                         #
    # ------------------------------------------------------------------ #

    async def _step1_verify_nft_exists(
        self, client, claimant: str, nft_token_id: str
    ):
        """
        Scan claimant's NFTs for the given token ID.

        Returns:
            The NFT dict if found with correct taxon.
            _WRONG_TAXON sentinel if found with wrong taxon.
            None if not found at all.
        """
        try:
            marker = None
            while True:
                kwargs: dict = dict(account=claimant, limit=400)
                if marker:
                    kwargs["marker"] = marker
                resp = await client.request(AccountNFTs(**kwargs))
                if not resp.is_successful():
                    return None
                for nft in resp.result.get("account_nfts", []):
                    if nft.get("NFTokenID", "").upper() == nft_token_id.upper():
                        if nft.get("NFTokenTaxon") != WARD_POLICY_TAXON:
                            return _WRONG_TAXON
                        return nft
                marker = resp.result.get("marker")
                if not marker:
                    break
        except Exception as exc:
            logger.error("step1 error: %s", exc)
        return None

    @staticmethod
    def _parse_nft_metadata(nft_data: dict) -> Tuple[dict, Optional[str]]:
        """
        Decode and validate the NFT URI field as Ward policy metadata.

        Supports two URI formats:
          - v0.2.x compact: {"w": "ward-v1", "v": ..., "c": ..., "e": ...}
          - legacy:         {"protocol": "ward/v1", "vault_address": ...}
        """
        uri_hex = nft_data.get("URI", "")
        if not uri_hex:
            return {}, "NFT has no URI field"
        if len(uri_hex) > 512:
            return {}, f"URI hex exceeds 512 chars: {len(uri_hex)}"
        try:
            metadata = json.loads(bytes.fromhex(uri_hex).decode("utf-8"))
            if "w" in metadata:
                schema = metadata["w"]
                if not schema.startswith("ward"):
                    return {}, f"Unknown URI schema: {schema!r}"
                return metadata, None
            if metadata.get("protocol") not in ("ward-v1", "ward/v1"):
                return {}, f"Unknown protocol: {metadata.get('protocol')!r}"
            return metadata, None
        except Exception as exc:
            return {}, f"Metadata parse error: {exc}"

    async def _step2_check_expiry(self, client, metadata: dict) -> Optional[str]:
        expiry = metadata.get("expiry_ledger_time") or metadata.get("e")
        if expiry is None:
            return "Missing expiry in metadata"
        try:
            now = await get_ledger_close_time(client)
            if int(expiry) < now:
                return f"Policy expired at ledger time {expiry} (now {now})"
            return None
        except LedgerError as exc:
            return f"Ledger time check failed: {exc}"

    async def _step4_verify_default_flag(
        self, client, loan_id: str
    ) -> Tuple[bool, int]:
        """Return (default_flag_set, vault_loss_drops)."""
        try:
            resp = await client.request(LedgerEntry(index=loan_id))
            if not resp.is_successful():
                return False, 0
            node = resp.result.get("node", {})
            flags = node.get("Flags", 0)
            vault_loss = int(node.get("Amount", 0))
            return bool(flags & LSF_LOAN_DEFAULT), vault_loss
        except Exception as exc:
            logger.error("step4 error: %s", exc)
            return False, 0

    def _step5_check_vault_loss(self, vault_loss: int) -> Optional[str]:
        if vault_loss <= 0:
            return f"Vault loss not positive: {vault_loss}"
        return None

    async def _step6_check_coverage_breach(
        self, client, pool_address: str, defaulted_vault: str
    ) -> Tuple[Optional[str], bool]:
        """Return (error_str, breached_bool)."""
        try:
            resp = await client.request(AccountInfo(account=pool_address))
            if not resp.is_successful():
                return "Pool AccountInfo failed", False
            balance = int(
                resp.result.get("account_data", {}).get("Balance", 0)
            )
            owner_count = int(
                resp.result.get("account_data", {}).get("OwnerCount", 0)
            )
            reserve = XRPL_BASE_RESERVE_DROPS + (
                owner_count * XRPL_OWNER_RESERVE_DROPS
            )
            usable = balance - reserve
            if usable < 0:
                return f"Pool insolvent: usable={usable}", True
            return None, False
        except Exception as exc:
            logger.error("step6 error: %s", exc)
            return f"Coverage breach check failed: {exc}", False

    def _step9_check_pool_solvency(
        self, pool_info, payout: int
    ) -> Optional[str]:
        if pool_info is None:
            return "Pool info unavailable"
        balance = int(pool_info.get("Balance", 0))
        owner_count = int(pool_info.get("OwnerCount", 0))
        reserve = XRPL_BASE_RESERVE_DROPS + (
            owner_count * XRPL_OWNER_RESERVE_DROPS
        )
        usable = balance - reserve
        if usable < payout:
            return f"Pool insolvent: usable={usable} < payout={payout}"
        ratio = usable / max(payout, 1)
        if ratio < MIN_COVERAGE_RATIO:
            return (
                f"Pool coverage ratio {ratio:.2f} < minimum {MIN_COVERAGE_RATIO}"
            )
        return None

    async def _fetch_pool_info(self, client, pool_address: str) -> Optional[dict]:
        try:
            resp = await client.request(AccountInfo(account=pool_address))
            if not resp.is_successful():
                return None
            return resp.result.get("account_data")
        except Exception as exc:
            logger.error("fetch_pool_info error: %s", exc)
            return None

    # ------------------------------------------------------------------ #
    # Utilities                                                            #
    # ------------------------------------------------------------------ #

    def _check_rate_limit(self, address: str) -> None:
        now = time.monotonic()
        self._rate_window = deque(
            t for t in self._rate_window
            if now - t < CLAIM_RATE_LIMIT_WINDOW_S
        )
        if len(self._rate_window) >= CLAIM_RATE_LIMIT_MAX:
            raise ValidationError(
                f"Rate limit exceeded: max {CLAIM_RATE_LIMIT_MAX} "
                f"claims per {CLAIM_RATE_LIMIT_WINDOW_S}s"
            )
        self._rate_window.append(now)

    @staticmethod
    def _reject(step: int, reason: str) -> ValidationResult:
        logger.warning("CLAIM REJECTED step %d: %s", step, reason)
        return ValidationResult(
            approved=False,
            claim_payout_drops=0,
            vault_loss_drops=0,
            policy_coverage_drops=0,
            rejection_reason=reason,
            steps_passed=step - 1,
        )
