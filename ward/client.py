"""
Ward Protocol — Module 1: WardClient

Entry point for purchasing default-protection policies on XRPL.

Workflow per policy purchase:
  1. Validate all inputs (addresses, amounts, period).
    2. Calculate premium in drops (no float XRP arithmetic).
      3. Submit Payment  (premium → pool) via submit_with_retry.
        4. Assemble NFT URI metadata (compact JSON, ≤512 hex chars enforced).
          5. Submit NFTokenMint  (non-transferable, burnable policy certificate).
            6. Return structured result with on-chain proof.

            Fixes applied:
              #1  Extracted from ward_client.py monolith into own module.
                #2  wallet typed as xrpl.wallet.Wallet — validated at boundary.
                  #3  AsyncJsonRpcClient used as async context manager per call (no leak).
                    #6  submit_with_retry used for both Payment and NFTokenMint.
                      #7  URI hex length assertion enforced before any network call.
                      """

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

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
          Module 1 — Policy purchase: premium payment + non-transferable NFT mint.

              Ward NEVER holds wallet keys.  The caller supplies a live Wallet object
                  that is used only for the duration of the call and never stored.

                      NFT policy invariants enforced on every mint:
                            - tfBurnable (0x1): pool can burn the NFT to settle a confirmed claim.
                                  - tfTransferable NOT set: policy cannot be sold or re-hypothecated.
                                        - URI ≤ 512 hex chars: enforced before any network call (XRPL limit).
                                              - Non-transferability verified in ClaimValidator step 1 before payout.

                                                  Tier behaviour (mirrors index.html licensing tiers):
                                                        Starter    — self-serve SDK; no rate-limit override.
                                                              Standard   — hosted API; onboarding engineer assists integration.
                                                                    Enterprise — white-label; SLA + legal opinion; no feature restrictions.
                                                                        The license_tier is embedded in NFT memo metadata so the on-chain policy
                                                                            record is self-describing and auditable.
                                                                                """

    def __init__(
              self,
              xrpl_url: str = DEFAULT_TESTNET_URL,
              license_tier: str = "starter",
    ) -> None:
              """
                      Args:
                                  xrpl_url:     JSON-RPC endpoint (testnet default).
                                              license_tier: One of "starter", "standard", "enterprise".
                                                                        Embedded in policy memo; affects PoolHealthMonitor
                                                                                                  mint-gate checks.  Does not change client behaviour
                                                                                                                            directly — gate enforcement is in PoolHealthMonitor.
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
                                      No float XRP arithmetic is performed — all calculations stay in drops.

                                              Args:
                                                          wallet:         Depositor's Wallet (key used in memory only, never stored).
                                                                      vault_address:  XLS-66 vault being insured.
                                                                                  coverage_drops: Maximum payout in drops.
                                                                                              period_days:    Policy term in days (positive integer).
                                                                                                          pool_address:   Insurance pool address (premium destination).
                                                                                                                      premium_rate:   Annual premium rate in (0, 1.0] (default 0.01 = 1%).
                                                                                                                      
                                                                                                                              Returns:
                                                                                                                                          {
                                                                                                                                                          "policy_id":      Human-readable label  "pol_WRD_<first8>",
                                                                                                                                                                          "nft_token_id":   On-chain NFT token ID (64 hex chars),
                                                                                                                                                                                          "premium_drops":  Premium paid in drops,
                                                                                                                                                                                                          "premium_tx":     Payment transaction hash,
                                                                                                                                                                                                                          "mint_tx":        NFTokenMint transaction hash,
                                                                                                                                                                                                                                          "expiry_ledger_time": Policy expiry in Ripple epoch seconds,
                                                                                                                                                                                                                                                          "license_tier":   License tier embedded in memo,
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                              Raises:
                                                                                                                                                                                                                                                                                          ValidationError: on bad inputs (before any network call).
                                                                                                                                                                                                                                                                                                      LedgerError:     on XRPL submission failure.
                                                                                                                                                                                                                                                                                                              """
              # ── Input validation ──────────────────────────────────────────
              wallet = validate_wallet(wallet)
        validate_xrpl_address(vault_address, "vault_address")
        validate_xrpl_address(pool_address,  "pool_address")
        validate_drops_amount(coverage_drops, "coverage_drops")

        if not isinstance(period_days, int) or period_days <= 0:
                      raise ValidationError(
                                        f"period_days must be a positive integer, got {period_days!r}"
                      )
                  if not (0 < premium_rate <= 1.0):
                                raise ValidationError(
                                                  f"premium_rate must be in (0, 1.0], got {premium_rate!r}"
                                )

        # ── Use client as context manager — no leaked connections ─────
        async with AsyncJsonRpcClient(self._url) as client:

                      # ── Ledger time for expiry ────────────────────────────────
                      now_ledger = await get_ledger_close_time(client)
                      period_seconds    = period_days * 86_400
                      expiry_ledger_time = now_ledger + period_seconds

            # ── Premium calculation (integer drops only) ──────────────
                      # annual_premium = coverage * rate
            # pro-rata       = annual * (period_days / 365)
            # Result rounded up to next drop to avoid zero-premium edge.
            annual_premium_drops = int(coverage_drops * premium_rate)
            premium_drops = max(
                              1,
                              round(annual_premium_drops * period_days / 365)
            )
            validate_drops_amount(premium_drops, "calculated premium")

            # ── Step 1: Pay premium to pool ───────────────────────────
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
                              premium_drops, pool_address, premium_tx_hash
            )

            # ── Step 2: Build NFT URI metadata ────────────────────────
            # URI field: compact JSON with core identifiers only.
            # Keep small — XRPL enforces ≤512 hex chars.
            uri_metadata = {
                              "w":  "ward/v1",                      # schema identifier
                              "v":  vault_address,
                              "c":  str(coverage_drops),
                              "e":  expiry_ledger_time,
                              "p":  pool_address,
                              "lt": self._license_tier,             # license tier on-chain
            }
            uri_hex = str_to_hex(json.dumps(uri_metadata, separators=(",", ":")))

            # Hard assertion — catch schema bloat before any network call
            if len(uri_hex) > 512:
                              raise ValidationError(
                                                    f"Policy URI is {len(uri_hex)} hex chars "
                                                    f"(XRPL max 512).  Reduce field sizes or contact Ward."
                              )

            # Extended metadata → Memo (no size limit on Memo fields)
            ext_metadata = json.dumps(
                              {
                                                    "premium_drops": str(premium_drops),
                                                    "period_days":   period_days,
                                                    "premium_tx":    premium_tx_hash,
                                                    "license_tier":  self._license_tier,
                              },
                              separators=(",", ":"),
            )

            # ── Step 3: Mint policy NFT ───────────────────────────────
            mint_tx = NFTokenMint(
                              account=wallet.classic_address,
                              nftoken_taxon=WARD_POLICY_TAXON,
                              # tfBurnable ONLY — no tfTransferable
                              flags=TF_BURNABLE,
                              uri=uri_hex,
                              memos=[
                                                    Memo(
                                                                              memo_type=str_to_hex("ward/policy"),
                                                                              memo_data=str_to_hex(ext_metadata),
                                                    )
                              ],
            )
            mint_tx = await autofill(mint_tx, client)
            mint_response = await submit_with_retry(mint_tx, client, wallet)

            nft_token_id = self._extract_nft_token_id(mint_response)
            mint_tx_hash = mint_response.result.get("hash", "")

            logger.info(
                              "Policy NFT minted: %s  vault=%s  coverage=%s drops  "
                              "expiry=%s  tier=%s",
                              nft_token_id, vault_address, coverage_drops,
                              expiry_ledger_time, self._license_tier,
            )

            policy_id = f"pol_WRD_{nft_token_id[:8]}"

            return {
                              "policy_id":           policy_id,
                              "nft_token_id":        nft_token_id,
                              "premium_drops":       premium_drops,
                              "premium_tx":          premium_tx_hash,
                              "mint_tx":             mint_tx_hash,
                              "expiry_ledger_time":  expiry_ledger_time,
                              "license_tier":        self._license_tier,
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
                                                                    if entry.get("LedgerEntryType") == "NFTokenPage":
                                                                                              fields = entry.get("FinalFields") or entry.get("NewFields", {})
                                                                                              for token in fields.get("NFTokens", []):
                                                                                                                            nft = token.get("NFToken", {})
                                                                                                                            token_id = nft.get("NFTokenID", "")
                                                                                                                            if token_id:
                                                                                                                                                              return token_id
                                                                                                except Exception as exc:
                                                                                  logger.warning("NFT token ID extraction failed: %s", exc)
                                                                              return ""
                                                
