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
from dataclasses import dataclass
from typing import Optional, Tuple

from xrpl.asyncio.clients import AsyncJsonRpcClient


from xrpl.models import AccountInfo, AccountNFTs, LedgerEntry

from ward.constants import (
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
    WardError,
    check_rate_limit,
    get_ledger_close_time,
    validate_loan_id,
    validate_nft_id,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.validator")


@dataclass
class ValidationResult:
    approved: bool
    claim_payout_drops: int = 0
    vault_loss_drops: int = 0
    policy_coverage_drops: int = 0
    rejection_reason: str = ""
    steps_passed: int = 0


# Sentinel returned by _step1_verify_nft_exists when NFT has wrong taxon.
_WRONG_TAXON = object()


class ClaimValidator:
    """
    Validate Ward Protocol claims against on-chain state.

    All 9 steps read directly from the XRPL ledger.
    No off-chain data is trusted.

    Input validation errors are returned as ValidationResult(approved=False)
    rather than raised as exceptions, so callers can handle them uniformly.
    """

    def __init__(self, url: str = DEFAULT_TESTNET_URL) -> None:
        self._url = url

    async def validate_claim(
        self,
        *,
        claimant_address: str,
        nft_token_id: str,
        defaulted_vault: str,
        loan_id: str,
        pool_address: str,
    ) -> ValidationResult:
        """
        Run all 9 validation steps and return a ValidationResult.

        Input validation errors are returned as ValidationResult(approved=False,
        steps_passed=0) rather than raised as exceptions.
        """
        # -- Input validation at boundary (2.10 address injection) ----------
        try:
            validate_xrpl_address(claimant_address, "claimant_address")
            validate_xrpl_address(defaulted_vault, "defaulted_vault")
            validate_xrpl_address(pool_address, "pool_address")
            validate_nft_id(nft_token_id)
            validate_loan_id(loan_id)
        except ValidationError as exc:
            return ValidationResult(
                approved=False,
                rejection_reason=str(exc),
                steps_passed=0,
            )

        # FIX #14: wrap all ledger I/O so LedgerError/WardError always returns
        # ValidationResult rather than propagating as an unhandled exception.
        try:
            _raw_client = AsyncJsonRpcClient(self._url)
            if not hasattr(_raw_client, '__aenter__'):
                _raw_client.__aenter__ = lambda: _raw_client
                _raw_client.__aexit__ = lambda *a: None
            async with _raw_client as client:
                # Steps 1, 4, pool-info run concurrently.
                nft_data, (default_flag, vault_loss), pool_info = await asyncio.gather(
                    self._step1_verify_nft_exists(
                        client, claimant_address, nft_token_id
                    ),
                    self._step4_verify_default_flag(client, loan_id),
                    self._fetch_pool_info(client, pool_address),
                )

                if nft_data is _WRONG_TAXON:
                    return self._reject(
                        1,
                        f"Wrong NFT taxon: policy taxon mismatch (expected {WARD_POLICY_TAXON})",
                    )

                if nft_data is None:
                    return self._reject(
                        1, f"NFT {nft_token_id[:16]}... not found (burned/missing)."
                    )
                logger.info("Step 1 passed")

                metadata, meta_err = self._parse_nft_metadata(nft_data)
                if meta_err:
                    return self._reject(2, meta_err)

                expiry_err = await self._step2_check_expiry(client, metadata)
                if expiry_err:
                    return self._reject(2, expiry_err)
                logger.info("Step 2 passed")

                # TODO(HIGH): verify premium payment on-chain for this NFT's token ID.
                # A fake NFT minted without paying a premium passes all 9 validation
                # steps. Query account_tx for the pool address to confirm a matching
                # Payment transaction exists before approving any claim.

                vault_err = self._step3_verify_vault_binding(metadata, defaulted_vault)
                if vault_err:
                    return self._reject(3, vault_err)
                logger.info("Step 3 passed")

                if not default_flag:
                    return self._reject(4, "Loan default flag not set on-chain.")
                logger.info("Step 4 passed")

                if vault_loss <= 0:
                    return self._reject(5, f"Vault loss not positive: {vault_loss}")
                logger.info("Step 5 passed")

                breach_err, breached = await self._step6_check_coverage_breach(
                    client, pool_address, defaulted_vault, min_balance=vault_loss
                )
                if breach_err and not breached:
                    return self._reject(6, breach_err)
                logger.info("Step 6 passed")

                step7_err = await self._step7_verify_nft_live(
                    client, claimant_address, nft_token_id
                )
                if step7_err:
                    return self._reject(7, step7_err)
                logger.info("Step 7 passed")

                step8_err = await self._step8_verify_claimant_holds_nft(
                    client, claimant_address, nft_token_id
                )
                if step8_err:
                    return self._reject(8, step8_err)
                logger.info("Step 8 passed")

                policy_coverage = int(
                    metadata.get("coverage_drops") or metadata.get("c") or 0
                )
                payout = min(vault_loss, policy_coverage)

                # Step 9: rate-limit per NFT token ID (2.12) then pool solvency.
                # Rate-limit checked here so steps 1–8 (cheap chain reads) run first
                # and the window is only consumed when the claim is otherwise valid.
                try:
                    check_rate_limit(nft_token_id)
                except ValidationError as exc:
                    return self._reject(9, str(exc))

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

        except LedgerError as exc:
            logger.error("LedgerError during claim validation: %s", exc)
            return ValidationResult(
                approved=False,
                rejection_reason=f"Ledger error: {exc}",
            )
        except WardError as exc:
            logger.error("WardError during claim validation: %s", exc)
            return ValidationResult(
                approved=False,
                rejection_reason=f"Ward error: {exc}",
            )

    # ------------------------------------------------------------------ #
    # Step helpers                                                         #
    # ------------------------------------------------------------------ #

    async def _step1_verify_nft_exists(self, client, claimant: str, nft_token_id: str):
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
        """
        Verify loan default.

        Returns (default_flag_set: bool, vault_loss_drops: int).
        If LedgerEntry succeeds, the loan has defaulted.
        vault_loss is read from TotalValueOutstanding (principal + interest).
        """
        try:
            resp = await client.request(LedgerEntry(index=loan_id))
            if not resp.is_successful():
                return False, 0
            node = resp.result.get("node", {})
            flags = int(node.get("Flags", 0))
            if not (flags & LSF_LOAN_DEFAULT):
                return False, 0
            vault_loss = int(
                node.get("TotalValueOutstanding")
                or node.get("PrincipalOutstanding")
                or node.get("Amount")
                or 0
            )
            return True, vault_loss
        except Exception as exc:
            logger.error("step4 error: %s", exc)
            return False, 0

    async def _step6_check_coverage_breach(
        self,
        client,
        pool_address: str,
        defaulted_vault: str,
        min_balance: int = 0,
    ) -> Tuple[Optional[str], bool]:
        """Return (error_str, breached_bool).

        When min_balance > 0, also reject if usable drops are insufficient to
        cover the claimed amount even if the pool is technically solvent.
        """
        try:
            resp = await client.request(AccountInfo(account=pool_address))
            if not resp.is_successful():
                return "Pool AccountInfo failed", False
            acct = resp.result.get("account_data", {})
            balance = int(acct.get("Balance", 0))
            owner_count = int(acct.get("OwnerCount", 0))
            reserve = XRPL_BASE_RESERVE_DROPS + (owner_count * XRPL_OWNER_RESERVE_DROPS)
            usable = balance - reserve
            if usable < 0:
                return f"Pool insolvent: usable={usable}", True
            if min_balance > 0 and usable < min_balance:
                return (
                    f"Pool has insufficient balance: usable={usable} drops "
                    f"< required={min_balance} drops",
                    False,
                )
            return None, False
        except Exception as exc:
            logger.error("step6 error: %s", exc)
            return f"Coverage breach check failed: {exc}", False

    async def _step7_verify_nft_live(
        self, client, claimant_address: str, nft_token_id: str
    ) -> Optional[str]:
        """Step 7: Replay protection — verify NFT still exists (not burned)."""
        nft = await self._step1_verify_nft_exists(
            client, claimant_address, nft_token_id
        )
        if nft is None:
            return (
                f"Replay protection failed: NFT {nft_token_id[:16]}... has been burned"
            )
        if nft is _WRONG_TAXON:
            return "Replay protection failed: NFT taxon mismatch"
        return None

    async def _step8_verify_claimant_holds_nft(
        self, client, claimant_address: str, nft_token_id: str
    ) -> Optional[str]:
        """Step 8: Verify claimant currently holds the NFT (not transferred)."""
        nft = await self._step1_verify_nft_exists(
            client, claimant_address, nft_token_id
        )
        if nft is None or nft is _WRONG_TAXON:
            return (
                f"Claimant {claimant_address[:8]}... does not currently hold "
                f"NFT {nft_token_id[:16]}..."
            )
        return None

    @staticmethod
    def _step3_verify_vault_binding(
        metadata: dict, defaulted_vault: str
    ) -> Optional[str]:
        """
        Step 3: Verify the NFT covers the specific vault being claimed against.

        Cross-vault claims are rejected: an NFT minted for vault A cannot be
        used to claim against vault B, even within a multi-vault batch.
        """
        meta_vault = metadata.get("vault_address") or metadata.get("v", "")
        if meta_vault != defaulted_vault:
            return (
                f"Cross-vault claim rejected: NFT covers {meta_vault!r}, "
                f"claim is against {defaulted_vault!r}"
            )
        return None

    def _step9_check_pool_solvency(self, pool_info, payout: int) -> Optional[str]:
        if pool_info is None:
            return "Pool info unavailable"
        balance = int(pool_info.get("Balance", 0))
        owner_count = int(pool_info.get("OwnerCount", 0))
        reserve = XRPL_BASE_RESERVE_DROPS + (owner_count * XRPL_OWNER_RESERVE_DROPS)
        usable = balance - reserve
        if usable < payout:
            return f"Pool insolvent: usable={usable} < payout={payout}"
        ratio = usable / max(payout, 1)
        if ratio < MIN_COVERAGE_RATIO:
            return f"Pool coverage ratio {ratio:.2f} < minimum {MIN_COVERAGE_RATIO}"
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
