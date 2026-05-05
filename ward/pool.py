"""
Ward Protocol - Module 5: PoolHealthMonitor

On-chain solvency and dynamic premium monitoring for insurance pools.

Fixes applied:
    #1  Extracted from ward_client.py monolith into own module.
    #3  AsyncJsonRpcClient used as async context manager.
    #7  active_coverage_drops derived on-chain from AccountNFTs (trust boundary fix).
    #7  Owner reserve calculated correctly: base + (OwnerCount x 2 XRP).
    #3  License tier enforcement integrated (Starter/Standard/Enterprise).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Dict

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.models import AccountInfo, AccountNFTs

from ward.constants import (
    DEFAULT_TESTNET_URL,
    MIN_COVERAGE_RATIO,
    RISK_TIER_THRESHOLDS,
    TIER_BASE_RATES,
    TIER_MULTIPLIERS,
    WARD_POLICY_TAXON,
    XRPL_BASE_RESERVE_DROPS,
    XRPL_OWNER_RESERVE_DROPS,
    LicenseTier,
)
from ward.primitives import (
    LedgerError,
    ValidationError,
    validate_drops,
    validate_xrpl_address,
)

logger = logging.getLogger("ward.pool")


@dataclass(frozen=True)
class PoolHealth:
    pool_address:           str
    balance_drops:          int
    usable_drops:           int
    active_coverage_drops:  int
    owner_count:            int
    coverage_ratio:         float
    is_solvent:             bool
    dynamic_premium_rate:   float
    risk_tier:              str

    def balance_xrp(self) -> float:
        return self.balance_drops / 1_000_000

    def usable_xrp(self) -> float:
        return self.usable_drops / 1_000_000

    def active_coverage_xrp(self) -> float:
        return self.active_coverage_drops / 1_000_000


class PoolHealthMonitor:
    """
    Monitor solvency and compute dynamic premiums for a Ward insurance pool.

    Reads on-chain state only - no caller-supplied balance or coverage inputs.

    Trust boundary:
        active_coverage_drops is always derived from on-chain AccountNFTs.
        It is NEVER accepted as a caller-supplied parameter.
    """

    def __init__(
        self,
        pool_address: str,
        url: str = DEFAULT_TESTNET_URL,
    ) -> None:
        validate_xrpl_address(pool_address, "pool_address")
        self._pool_address = pool_address
        self._url = url

    async def get_health(self) -> PoolHealth:
        """
        Fetch on-chain state and return a PoolHealth snapshot.
        """
        async with AsyncJsonRpcClient(self._url) as client:
            # Step 1: Account info
            resp = await client.request(
                AccountInfo(account=self._pool_address, ledger_index="validated")
            )
            if not resp.is_successful():
                raise LedgerError(
                    f"AccountInfo failed for {self._pool_address}: {resp.result}"
                )

            account_data  = resp.result["account_data"]
            balance_drops = int(account_data["Balance"])
            owner_count   = int(account_data.get("OwnerCount", 0))

            # Step 2: Compute usable balance
            reserve_drops = (
                XRPL_BASE_RESERVE_DROPS
                + (owner_count * XRPL_OWNER_RESERVE_DROPS)
            )
            usable_drops = max(0, balance_drops - reserve_drops)

            # Step 3: Sum active coverage from on-chain NFTs
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
        license_tier: str = "starter",
    ) -> bool:
        """
        Return True if minting is allowed for this pool health and license tier.
        """
        allowed = LicenseTier.TIER_MINT_GATES.get(license_tier, set())
        return health.risk_tier in allowed

    def calculate_premium(
        self,
        health: PoolHealth,
        coverage_drops: int,
        period_days: int,
        license_tier: str = "starter",
    ) -> dict:
        """
        Calculate premium in drops for a given coverage amount and period.

        Args:
            health:         PoolHealth snapshot from get_health().
            coverage_drops: Coverage amount in drops.
            period_days:    Coverage period in days.
            license_tier:   License tier string.

        Returns:
            Dict with key "premium_drops" (int).
        """
        if not self.is_minting_allowed(health, license_tier):
            raise ValidationError(
                f"Minting not allowed: pool risk tier {health.risk_tier!r} "
                f"exceeds limit for license tier {license_tier!r}"
            )

        premium_drops = int(
            coverage_drops * health.dynamic_premium_rate * period_days / 365
        )
        return {"premium_drops": max(1, premium_drops)}

    async def _sum_active_coverage(self, client: AsyncJsonRpcClient) -> int:
        """
        Sum the coverage amounts of all active Ward policy NFTs held by the pool.

        Reads AccountNFTs, filters by WARD_POLICY_TAXON, decodes URI metadata,
        and sums the "c" (coverage_drops) field.
        """
        total = 0
        marker = None

        while True:
            kwargs: Dict = {
                "account": self._pool_address,
                "limit":   200,
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
                    metadata = json.loads(bytes.fromhex(uri_hex).decode("utf-8"))
                    raw_coverage = int(
                        metadata.get("coverage_drops")
                        or metadata.get("c")
                        or 0
                    )
                    validate_drops(raw_coverage, "coverage_drops")
                    total += raw_coverage
                except Exception as exc:
                    logger.debug("Skipping NFT with unparseable URI: %s", exc)

            marker = resp.result.get("marker")
            if not marker:
                break

        return total

    @staticmethod
    def _classify_tier(coverage_ratio: float) -> str:
        """
        Classify the pool's risk tier based on the coverage ratio.

        RISK_TIER_THRESHOLDS is a list of (threshold, tier_name) tuples
        sorted in descending order of threshold.

        Args:
            coverage_ratio: usable_drops / active_coverage_drops.

        Returns:
            Risk tier string ("safest", "safe", "moderate", "elevated", "high").
        """
        for threshold, tier_name in RISK_TIER_THRESHOLDS:
            if coverage_ratio >= threshold:
                return tier_name
        return "high"
