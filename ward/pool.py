"""
Ward Protocol — Module 5: PoolHealthMonitor

On-chain solvency and dynamic premium monitoring for insurance pools.

All data is sourced exclusively from XRPL — no off-chain state.

Fixes applied:
  #1  Extracted from ward_client.py monolith into own module.
    #3  AsyncJsonRpcClient used as context manager — no leaked connections.
      #7  active_coverage_drops is now derived on-chain from AccountNFTs
            (not accepted as a caller-supplied parameter — was a trust boundary
                  violation that allowed anyone to pass 0 and always get "safest" tier).
                    #7  Owner reserve accounted for correctly (base + OwnerCount * 2 XRP).
                      #3  License tier enforcement (Starter/Standard/Enterprise) integrated into
                            is_minting_allowed() — mirrors index.html licensing tiers exactly.
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
      """
          Point-in-time snapshot of pool solvency.  All values from on-chain data.
              """
      pool_address:          str
      balance_drops:         int
      usable_drops:          int         # balance minus reserves
    active_coverage_drops: int         # sum of all live policy coverage amounts
    owner_count:           int         # on-chain OwnerCount (for reserve calc)
    coverage_ratio:        float       # usable / active_coverage (inf if no exposure)
    is_solvent:            bool        # ratio >= MIN_COVERAGE_RATIO
    dynamic_premium_rate:  float       # annualised rate for current tier
    risk_tier:             str         # "safest" | "safe" | "moderate" | "elevated" | "high"

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
                                                                                  < 1.5×  → high      5% × 2.00 = 10.0% annual  ← minting BLOCKED for ALL tiers

                                                                                      License tier mint gates (mirrors index.html):
                                                                                              Starter    — may mint at safest / safe / moderate
                                                                                                      Standard   — may mint at safest / safe / moderate / elevated
                                                                                                              Enterprise — same as Standard (high always blocked by pool state)
                                                                                                              
                                                                                                                  Trust boundary fix:
                                                                                                                          active_coverage_drops is now derived on-chain by reading all Ward
                                                                                                                                  policy NFTs (taxon=WARD_POLICY_TAXON) held in the pool's NFTokenPage
                                                                                                                                          and summing the "c" (coverage_drops) field from each NFT's URI
                                                                                                                                                  metadata.  It is never accepted as a caller-supplied parameter.
                                                                                                                                                      """

    def __init__(
              self,
              pool_address: str,
              xrpl_url: str = DEFAULT_TESTNET_URL,
              license_tier: str = LicenseTier.STARTER,
    ) -> None:
              """
                      Args:
                                  pool_address:  XRPL address of the insurance pool.
                                              xrpl_url:      JSON-RPC endpoint.
                                                          license_tier:  Licensing tier of the integrating institution
                                                                                     ("starter", "standard", "enterprise").
                                                                                                                Controls which risk tiers allow new policy minting.
                                                                                                                        """
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
                                                                                                              LedgerError: if any XRPL request fails.
                                                                                                                      """
              async with AsyncJsonRpcClient(self._url) as client:
                            # ── Step 1: account balance + owner count ────────────────
                            info_resp = await client.request(
                                              AccountInfo(account=self._pool_address, ledger_index="validated")
                            )
                            if not info_resp.is_successful():
                                              raise LedgerError(
                                                                    f"Cannot fetch pool AccountInfo for {self._pool_address}: "
                                                                    f"{info_resp.result}"
                                              )

                            account_data  = info_resp.result.get("account_data", {})
                            balance_drops = int(account_data.get("Balance", 0))
                            owner_count   = int(account_data.get("OwnerCount", 0))

                  # ── Step 2: usable drops (subtract both reserve types) ────
                            # Base reserve: 20 XRP flat
                  # Owner reserve: 2 XRP × OwnerCount
            # Both are locked and unavailable for payouts.
            total_reserve = (
                              XRPL_BASE_RESERVE_DROPS
                              + owner_count * XRPL_OWNER_RESERVE_DROPS
            )
            usable_drops = max(0, balance_drops - total_reserve)

            # ── Step 3: derive active coverage from on-chain NFTs ────
            active_coverage_drops = await self._sum_active_coverage(client)

            # ── Step 4: coverage ratio + tier ────────────────────────
            if active_coverage_drops > 0:
                              coverage_ratio = usable_drops / active_coverage_drops
else:
                  coverage_ratio = float("inf")

            risk_tier        = self._classify_tier(coverage_ratio)
            base_rate        = TIER_BASE_RATES[risk_tier]
            multiplier       = TIER_MULTIPLIERS[risk_tier]
            dynamic_rate     = base_rate * multiplier
            is_solvent       = coverage_ratio >= MIN_COVERAGE_RATIO

            health = PoolHealth(
                              pool_address=self._pool_address,
                              balance_drops=balance_drops,
                              usable_drops=usable_drops,
                              active_coverage_drops=active_coverage_drops,
                              owner_count=owner_count,
                              coverage_ratio=coverage_ratio,
                              is_solvent=is_solvent,
                              dynamic_premium_rate=dynamic_rate,
                              risk_tier=risk_tier,
            )

            if not is_solvent:
                              logger.warning(
                                                    "POOL UNDERCOLLATERALISED: tier=%s  ratio=%.2fx  "
                                                    "usable=%.2f XRP  coverage=%.2f XRP  "
                                                    "NEW POLICY MINTING BLOCKED",
                                                    risk_tier,
                                                    coverage_ratio,
                                                    usable_drops / 1_000_000,
                                                    active_coverage_drops / 1_000_000,
                              )

            return health

    def is_minting_allowed(self, health: PoolHealth) -> bool:
              """
                      Return True if new policies may be minted given current pool health
                              and the instance's license tier.

                                      Rules:
                                                - "high" tier (ratio < 1.5×) always blocks minting regardless of
                                                            license tier — pool is undercollateralised.
                                                                      - For other tiers, the license tier gate applies
                                                                                  (see TIER_MINT_GATES in constants.py).

                                                                                          Args:
                                                                                                      health: PoolHealth snapshot from get_health().
                                                                                                      
                                                                                                              Returns:
                                                                                                                          True if minting is permitted, False otherwise.
                                                                                                                                  """
              if health.risk_tier == "high":
                            logger.warning(
                                              "Minting blocked: pool is undercollateralised (tier=high  "
                                              "ratio=%.2fx < %.1fx minimum)",
                                              health.coverage_ratio, MIN_COVERAGE_RATIO,
                            )
                            return False

              allowed_tiers = TIER_MINT_GATES.get(self._license_tier, set())
              if health.risk_tier not in allowed_tiers:
                            logger.warning(
                                              "Minting blocked by license tier gate: "
                                              "license=%s  pool_tier=%s  allowed=%s",
                                              self._license_tier, health.risk_tier, allowed_tiers,
                            )
                            return False

              return True

    def calculate_premium(
              self,
              coverage_drops: int,
              period_days: int,
              health: PoolHealth,
    ) -> int:
              """
                      Calculate the policy premium in drops for given coverage and term.

                              Uses the dynamic premium rate from the supplied PoolHealth snapshot.
                                      All arithmetic stays in integer drops.

                                              Args:
                                                          coverage_drops: Coverage amount in drops.
                                                                      period_days:    Policy term in days.
                                                                                  health:         Current pool health (provides dynamic_premium_rate).

                                                                                          Returns:
                                                                                                      Premium in drops (minimum 1 drop).
                                                                                                              """
              annual_premium = int(coverage_drops * health.dynamic_premium_rate)
              pro_rata = max(1, round(annual_premium * period_days / 365))
              return pro_rata

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _sum_active_coverage(self, client: AsyncJsonRpcClient) -> int:
              """
                      Fetch all Ward policy NFTs held by the pool account and sum their
                              coverage amounts from URI metadata.

                                      Only NFTs with taxon == WARD_POLICY_TAXON are counted.
                                              NFTs with malformed or missing URI metadata are skipped with a warning.

                                                      Returns:
                                                                  Total active coverage in drops (0 if no policies found).
                                                                          """
              total_coverage = 0
              marker: Optional[str] = None

        while True:
                      kwargs: Dict = dict(
                                        account=self._pool_address,
                                        ledger_index="validated",
                                        limit=400,
                      )
                      if marker:
                                        kwargs["marker"] = marker

                      resp = await client.request(AccountNFTs(**kwargs))
                      if not resp.is_successful():
                                        raise LedgerError(
                                                              f"AccountNFTs failed for {self._pool_address}: {resp.result}"
                                        )

                      for nft in resp.result.get("account_nfts", []):
                                        if nft.get("NFTokenTaxon") != WARD_POLICY_TAXON:
                                                              continue
                                                          uri_hex = nft.get("URI", "")
                                        if not uri_hex:
                                                              continue
                                                          try:
                                                                                uri_str = hex_to_str(uri_hex)
                                                                                meta    = json.loads(uri_str)
                                                                                coverage = int(meta.get("c", 0))
                                                                                if coverage > 0:
                                                                                                          total_coverage += coverage
                                                            except Exception as exc:
                                            logger.warning(
                                                "Skipping NFT %s — URI parse error: %s",
                                                nft.get("NFTokenID", "?"), exc,
                                            )

                      marker = resp.result.get("marker")
                      if not marker:
                                        break

                  logger.debug(
                                "Pool %s: %d drops active coverage derived from on-chain NFTs",
                                self._pool_address, total_coverage,
                  )
        return total_coverage

    @staticmethod
    def _classify_tier(ratio: float) -> str:
              """
                      Map a coverage ratio to a risk-tier label.

                              Thresholds (from RISK_TIER_THRESHOLDS in constants.py):
                                          ratio ≥ 5.0 → "safest"
                  ratio ≥ 3.0 → "safe"
                  ratio ≥ 2.0 → "moderate"
                  ratio ≥ 1.5 → "elevated"
                  ratio <  1.5 → "high"
              """
              for threshold, tier_name in RISK_TIER_THRESHOLDS:
                            if ratio >= threshold:
                                              return tier_name
                                      return "high"
                
