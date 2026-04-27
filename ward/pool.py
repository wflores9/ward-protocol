"""
Ward Protocol — Module 5: PoolHealthMonitor

On-chain solvency and dynamic premium monitoring for insurance pools.

Fixes applied:
    #1  Extracted from ward_client.py monolith into own module.
    #3  AsyncJsonRpcClient used as async context manager.
    #7  active_coverage_drops derived on-chain from AccountNFTs (trust boundary fix).
    #7  Owner reserve calculated correctly: base + (OwnerCount × 2 XRP).
    #3  License tier enforcement integrated (Starter/Standard/Enterprise).
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.models import AccountInfo, AccountNFTs
from xrpl.utils import hex_to_str

from ward.constants import (
    DEFAULT_TESTNET_URL,
    LicenseTier,
    MIN_COVERAGE_RATIO,
    RISK_TIER_THRESHOLDS,
    TIER_BASE_RATES,
    TIER_MINT_GATES,
    TIER_MULTIPLIERS,
    WARD_POLICY_TAXON,
    XRPL_BASE_RESERVE_DROPS,
    XRPL_OWNER_RESERVE_DROPS,
)
from ward.primitives import LedgerError, ValidationError, validate_xrpl_address

logger = logging.getLogger("ward.pool")


# ---------------------------------------------------------------------------
# PoolHealth snapshot
# ---------------------------------------------------------------------------


@dataclass
class PoolHealth:
    """Point-in-time snapshot of pool solvency. All values from on-chain data."""

    pool_address:          str
    balance_drops:         int
    usable_drops:          int    # balance minus reserves
    active_coverage_drops: int    # sum of all live policy coverage amounts
    owner_count:           int    # on-chain OwnerCount (for reserve calc)
    coverage_ratio:        float  # usable / active_coverage (inf if no exposure)
    is_solvent:            bool   # ratio >= MIN_COVERAGE_RATIO
    dynamic_premium_rate:  float  # annualised rate for current tier
    risk_tier:             str    # "safest" | "safe" | "moderate" | "elevated" | "high"

    @property
    def balance_xrp(self) -> float:
        return self.balance_drops / 1_000_000

    @property
    def usable_xrp(self) -> float:
        return self.usable_drops / 1_000_000

    @property
    def active_coverage_xrp(self) -> float:
        return self.active_coverage_drops / 1_000_000


# ---------------------------------------------------------------------------
# PoolHealthMonitor
# ---------------------------------------------------------------------------


class PoolHealthMonitor:
    """
    Module 5 — On-chain pool solvency and dynamic premium monitoring.

    Dynamic premium formula (Ward Protocol spec Appendix B):
        base_rate    = 1–5% annual, based on risk tier
        multiplier   = 0.5×–2.0×, based on coverage ratio
        premium_rate = base_rate × multiplier × (term_days / 365)

    Coverage ratio tiers:
        ≥ 5.0×  → safest    1% × 0.50 = 0.50% annual
        ≥ 3.0×  → safe      2% × 0.75 = 1.50% annual
        ≥ 2.0×  → moderate  3% × 1.00 = 3.00% annual
        ≥ 1.5×  → elevated  4% × 1.50 = 6.00% annual
        < 1.5×  → high      5% × 2.00 = 10.0% annual

    Trust boundary fix:
        active_coverage_drops is now derived on-chain by reading all Ward
        policy NFTs (taxon=WARD_POLICY_TAXON) held in the pool’s NFTokenPage
        and summing the “c” (coverage_drops) field from each NFT’s URI metadata.
        It is NO LONGER accepted as a caller-supplied parameter.
    """

    def __init__(
        self,
        pool_address: str,
        xrpl_url: str = DEFAULT_TESTNET_URL,
        license_tier: str = LicenseTier.STARTER,
    ) -> None:
        validate_xrpl_address(pool_address, "pool_address")
        self._pool_address  = pool_address
        self._url           = xrpl_url
        self._license_tier  = license_tier.lower()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_health(self) -> PoolHealth:
        """
        Fetch and calculate current pool health entirely from on-chain data.

        Steps:
            1. Fetch AccountInfo → balance_drops, owner_count.
            2. Compute usable_drops = balance - base_reserve - (owner_count * owner_reserve).
            3. Fetch all Ward policy NFTs from AccountNFTs → sum coverage amounts.
            4. Compute coverage_ratio, risk_tier, dynamic_premium_rate.

        Returns:
            PoolHealth snapshot.

        Raises:
            LedgerError: if XRPL requests fail.
        """
        async with AsyncJsonRpcClient(self._url) as client:
            # Step 1: Account balance + owner count
            account_resp = await client.request(
                AccountInfo(account=self._pool_address, ledger_index="validated")
            )
            if not account_resp.is_successful():
                raise LedgerError(
                    f"AccountInfo failed for {self._pool_address}: "
                    f"{account_resp.result}"
                )

            acct_data    = account_resp.result["account_data"]
            balance_drops = int(acct_data["Balance"])
            owner_count   = int(acct_data.get("OwnerCount", 0))

            # Step 2: Usable balance (minus reserves)
            reserve = XRPL_BASE_RESERVE_DROPS + (owner_count * XRPL_OWNER_RESERVE_DROPS)
            usable_drops = max(0, balance_drops - reserve)

            # Step 3: Active coverage from on-chain NFTs
            active_coverage_drops = await self._sum_active_coverage(client)

        # Step 4: Compute ratios and tier
        if active_coverage_drops == 0:
            coverage_ratio = float("inf")
        else:
            coverage_ratio = usable_drops / active_coverage_drops

        risk_tier    = self._classify_tier(coverage_ratio)
        base_rate    = TIER_BASE_RATES.get(risk_tier, 0.05)
        multiplier   = TIER_MULTIPLIERS.get(risk_tier, 2.0)
        premium_rate = base_rate * multiplier

        return PoolHealth(
            pool_address=self._pool_address,
            balance_drops=balance_drops,
            usable_drops=usable_drops,
            active_coverage_drops=active_coverage_drops,
            owner_count=owner_count,
            coverage_ratio=coverage_ratio,
            is_solvent=coverage_ratio >= MIN_COVERAGE_RATIO,
            dynamic_premium_rate=premium_rate,
            risk_tier=risk_tier,
        )

    def is_minting_allowed(
        self,
        health: PoolHealth,
        license_tier: Optional[str] = None,
    ) -> bool:
        """
        Check whether new policy minting is allowed given the pool’s risk tier
        and the license tier’s mint gate.

        "high" always blocks minting regardless of license tier.

        Args:
            health:       Current PoolHealth snapshot from get_health().
            license_tier: Override license tier; defaults to self._license_tier.

        Returns:
            True if minting is permitted.
        """
        tier = (license_tier or self._license_tier).lower()
        allowed_risk_tiers = LicenseTier.TIER_MINT_GATES.get(tier, set())
        return health.risk_tier in allowed_risk_tiers

    def calculate_premium(
        self,
        health: PoolHealth,
        coverage_drops: int,
        period_days: int,
    ) -> Dict[str, int]:
        """
        Calculate the policy premium in drops for given coverage and term.

        Args:
            coverage_drops: Coverage amount in drops.
            period_days:    Policy term in days.
            health:         Current pool health (provides dynamic_premium_rate).

        Returns:
            Dict with keys:
                premium_drops    — total premium (minimum 1 drop).
                coverage_drops   — echo of the input.
                period_days      — echo of the input.
                annual_rate      — annualised rate used.
        """
        annual_rate   = health.dynamic_premium_rate
        premium_drops = int(coverage_drops * annual_rate * period_days / 365)
        if premium_drops < 1:
            premium_drops = 1
        return {
            "premium_drops":  premium_drops,
            "coverage_drops": coverage_drops,
            "period_days":    period_days,
            "annual_rate":    annual_rate,
        }

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    async def _sum_active_coverage(self, client: AsyncJsonRpcClient) -> int:
        """
        Sum the coverage amounts of all active Ward policy NFTs held by the pool.

        Reads AccountNFTs, filters by WARD_POLICY_TAXON, decodes URI metadata,
        and sums the “c” (coverage_drops) field.

        Returns:
            Total active coverage in drops.
        """
        total = 0
        marker = None

        while True:
            kwargs: Dict = {
                "account":  self._pool_address,
                "nft_taxon": WARD_POLICY_TAXON,
                "limit":    200,
            }
            if marker:
                kwargs["marker"] = marker

            resp = await client.request(AccountNFTs(**kwargs))
            if not resp.is_successful():
                logger.warning(
                    "AccountNFTs failed for %s: %s",
                    self._pool_address, resp.result,
                )
                break

            for nft in resp.result.get("account_nfts", []):
                if nft.get("NFTokenTaxon") != WARD_POLICY_TAXON:
                    continue
                uri_hex = nft.get("URI", "")
                if not uri_hex:
                    continue
                try:
                    uri_str = bytes.fromhex(uri_hex).decode("utf-8")
                    meta    = json.loads(uri_str)
                    # Support both compact ("c") and legacy ("coverage_drops") keys
                    raw = meta.get("c") or meta.get("coverage_drops")
                    if raw is not None:
                        total += int(raw)
                except Exception:
                    continue

            marker = resp.result.get("marker")
            if not marker:
                break

        return total

    @staticmethod
    def _classify_tier(ratio: float) -> str:
        """Return the risk tier string for the given coverage ratio."""
        for threshold, tier in RISK_TIER_THRESHOLDS:
            if ratio >= threshold:
                return tier
        return "high"
