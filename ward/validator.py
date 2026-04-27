"""
Ward Protocol — Module 3: ClaimValidator

9-step adversarial-hardened claim validation.
All state sourced from XRPL. No off-chain inputs trusted.

Fixes: #1 Extracted. #3 asyncio.gather for steps 1/4/9. #7 dual URI format.
"""

from __future__ import annotations
import asyncio, json, logging, time
from collections import deque
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.models import AccountInfo, AccountNFTs, LedgerEntry

from ward.constants import (
    CLAIM_RATE_LIMIT_MAX, CLAIM_RATE_LIMIT_WINDOW_S, DEFAULT_TESTNET_URL,
    LSF_LOAN_DEFAULT, MIN_COVERAGE_RATIO, WARD_POLICY_TAXON,
    XRPL_BASE_RESERVE_DROPS, XRPL_OWNER_RESERVE_DROPS,
)
from ward.primitives import (
    LedgerError, ValidationError, get_ledger_close_time,
    validate_nft_id, validate_xrpl_address,
)

logger = logging.getLogger("ward.validator")


@dataclass
class ValidationResult:
    approved:              bool
    claim_payout_drops:    int  = 0
    vault_loss_drops:      int  = 0
    policy_coverage_drops: int  = 0
    rejection_reason:      str  = ""
    steps_passed:          int  = 0


class ClaimValidator:
    """9-step adversarial-hardened claim validation. Steps 1/4/9 concurrent."""

    def __init__(self, xrpl_url: str = DEFAULT_TESTNET_URL) -> None:
        self._url = xrpl_url
        self._rate_limits: Dict[str, deque] = {}

    async def validate_claim(
        self,
        claimant_address: str,
        nft_token_id:     str,
        defaulted_vault:  str,
        loan_id:          str,
        pool_address:     str,
    ) -> ValidationResult:
        try:
            validate_xrpl_address(claimant_address, "claimant_address")
            validate_xrpl_address(defaulted_vault,  "defaulted_vault")
            validate_xrpl_address(pool_address,     "pool_address")
            validate_nft_id(nft_token_id, "nft_token_id")
        except ValidationError as exc:
            return self._reject(0, str(exc))

        if not self._check_rate_limit(nft_token_id):
            return self._reject(
                0,
                f"Rate limit exceeded: max {CLAIM_RATE_LIMIT_MAX} attempts "
                f"per {CLAIM_RATE_LIMIT_WINDOW_S}s per policy NFT.",
            )

        async with AsyncJsonRpcClient(self._url) as client:
            nft_data, loan_node, pool_info = await asyncio.gather(
                self._step1_verify_nft_exists(client, claimant_address, nft_token_id),
                self._step4_verify_default_flag(client, loan_id),
                self._fetch_pool_info(client, pool_address),
            )

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

            if loan_node is None:
                return self._reject(4, f"Loan {loan_id[:16]}... lsfLoanDefault not set.")
            logger.info("Step 4 passed")

            vault_loss, loss_err = await self._step5_calculate_loss(client, loan_node)
            if loss_err:
                return self._reject(5, loss_err)
            if vault_loss <= 0:
                return self._reject(5, "Vault loss is zero.")
            logger.info("Step 5 passed: %d drops", vault_loss)

            breached, breach_err = await self._step6_verify_coverage_breach(client, loan_node, defaulted_vault)
            if breach_err and not breached:
                return self._reject(6, breach_err)
            logger.info("Step 6 passed")

            logger.info("Step 7 passed: replay protection OK (NFT live)")
            logger.info("Step 8 passed: claimant holds NFT")

            policy_coverage = int(metadata.get("coverage_drops") or metadata.get("c") or 0)
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

    # ------------------------------------------------------------------
    async def _step1_verify_nft_exists(self, client, claimant, nft_token_id):
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
                            return None
                        return nft
                marker = resp.result.get("marker")
                if not marker:
                    break
        except Exception as exc:
            logger.error("step1 error: %s", exc)
        return None

    @staticmethod
    def _parse_nft_metadata(nft_data: dict) -> Tuple[dict, Optional[str]]:
        uri_hex = nft_data.get("URI", "")
        if not uri_hex:
            return {}, "NFT has no URI"
        try:
            metadata = json.loads(bytes.fromhex(uri_hex).decode("utf-8"))
            if "w" in metadata:
                if not metadata["w"].startswith("ward/"):
                    return {}, f"Unknown URI schema: {metadata['w']!r}"
                return metadata, None
            if metadata.get("protocol") not in ("ward-v1", "ward/v1"):
                return {}, f"Unknown protocol: {metadata.get('protocol')!r}"
            return metadata, None
        except Exception as exc:
            return {}, f"Metadata parse error: {exc}"

    async def _step2_check_expiry(self, client, metadata):
        expiry = metadata.get("expiry_ledger_time") or metadata.get("e")
        if expiry is None:
            return "Missing expiry in metadata"
        try:
            now = await get_ledger_close_time(client)
            if now >= int(expiry):
                return f"Policy expired (expiry={expiry}, now={now})"
            return None
        except LedgerError as exc:
            return f"Could not fetch ledger time: {exc}"

    async def _step4_verify_default_flag(self, client, loan_id):
        try:
            resp = await client.request(LedgerEntry(index=loan_id))
            if not resp.is_successful():
                return None
            node = resp.result.get("node", {})
            return node if (node.get("Flags", 0) & LSF_LOAN_DEFAULT) else None
        except Exception as exc:
            logger.error("step4 error: %s", exc)
            return None

    async def _fetch_pool_info(self, client, pool_address):
        try:
            resp = await client.request(AccountInfo(account=pool_address, ledger_index="validated"))
            return resp.result if resp.is_successful() else None
        except Exception:
            return None

    async def _step5_calculate_loss(self, client, loan_node):
        broker_id = loan_node.get("LoanBrokerID", "")
        if not broker_id:
            return 0, "Loan node missing LoanBrokerID"
        try:
            resp = await client.request(LedgerEntry(index=broker_id))
            if not resp.is_successful():
                return 0, f"LoanBroker fetch failed"
            broker      = resp.result.get("node", resp.result)
            principal   = int(loan_node.get("PrincipalOutstanding", 0))
            interest    = int(loan_node.get("InterestOutstanding",  0))
            debt_total  = int(broker.get("DebtTotal",              0))
            cover_avail = int(broker.get("CoverAvailable",         0))
            rate_min    = float(broker.get("CoverRateMinimum",     0))
            rate_liq    = float(broker.get("CoverRateLiquidation", 0))
            default_amt = principal + interest
            min_cover   = int(debt_total * rate_min)
            covered     = min(int(min_cover * rate_liq), default_amt, cover_avail)
            return default_amt - covered, None
        except Exception as exc:
            return 0, f"Step 5 error: {exc}"

    async def _step6_verify_coverage_breach(self, client, loan_node, vault_address):
        try:
            resp = await client.request(LedgerEntry(vault=vault_address))
            if not resp.is_successful():
                return False, f"Vault fetch failed"
            vault       = resp.result.get("node", resp.result)
            tvl         = int(vault.get("AssetsTotal", 0)) - int(vault.get("LossUnrealized", 0))
            outstanding = int(loan_node.get("TotalValueOutstanding", 0))
            if outstanding <= 0:
                return False, "Outstanding loans = 0"
            if tvl / outstanding < MIN_COVERAGE_RATIO:
                return True, None
            return False, f"Ratio {tvl/outstanding:.2f}x >= {MIN_COVERAGE_RATIO}x"
        except Exception as exc:
            return False, f"Step 6 error: {exc}"

    @staticmethod
    def _step9_check_pool_solvency(pool_info, payout_drops):
        if pool_info is None:
            return "Could not fetch pool account info"
        try:
            data    = pool_info.get("account_data", {})
            balance = int(data.get("Balance",    0))
            owners  = int(data.get("OwnerCount", 0))
            reserve = XRPL_BASE_RESERVE_DROPS + owners * XRPL_OWNER_RESERVE_DROPS
            avail   = balance - reserve
            if avail < payout_drops:
                return (
                    f"Pool insolvent: available {avail/1e6:.2f} XRP "
                    f"< payout {payout_drops/1e6:.2f} XRP"
                )
            return None
        except Exception as exc:
            return f"Step 9 error: {exc}"

    def _reject(self, step, reason):
        logger.warning("CLAIM REJECTED step %d: %s", step, reason)
        return ValidationResult(
            approved=False, rejection_reason=reason, steps_passed=max(0, step - 1)
        )

    def _check_rate_limit(self, nft_token_id):
        now    = time.monotonic()
        window = self._rate_limits.setdefault(nft_token_id, deque(maxlen=CLAIM_RATE_LIMIT_MAX))
        while window and now - window[0] > CLAIM_RATE_LIMIT_WINDOW_S:
            window.popleft()
        if len(window) >= CLAIM_RATE_LIMIT_MAX:
            return False
        window.append(now)
        return True
