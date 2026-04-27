"""
Ward Protocol — Shared primitives.

Errors, validators, and utilities used by every SDK module.
Import from here; do not duplicate in module files.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import secrets
import time
from typing import Optional, Tuple

from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import autofill, submit_and_wait
from xrpl.core.addresscodec import is_valid_classic_address
from xrpl.models import Ledger, ServerInfo
from xrpl.models.transactions import Transaction
from xrpl.wallet import Wallet

from ward.constants import (
    RETRYABLE_ENGINE_RESULTS,
    XRP_MAX_DROPS,
    RIPPLE_EPOCH_OFFSET,
)

logger = logging.getLogger("ward.primitives")

# ---------------------------------------------------------------------------
# Domain exceptions
# ---------------------------------------------------------------------------

class WardError(Exception):
      """Base exception for all Ward Protocol errors."""

class ValidationError(WardError):
      """Input failed a Ward pre-flight validation check."""

class SecurityError(WardError):
      """A security invariant was violated (e.g. transfer flag set on policy NFT)."""

class LedgerError(WardError):
      """An XRPL ledger operation failed or returned an unexpected result."""

# ---------------------------------------------------------------------------
# Input validators
# ---------------------------------------------------------------------------

def validate_xrpl_address(address: str, label: str = "address") -> None:
      """
          Raise ValidationError if *address* is not a valid XRPL classic address.

              Uses xrpl-py's codec directly — no regex approximation.
                  """
      if not isinstance(address, str) or not is_valid_classic_address(address):
                raise ValidationError(
                              f"Invalid {label}: {address!r} is not a valid XRPL classic address."
                )


def validate_drops_amount(drops: int, label: str = "amount") -> None:
      """
          Raise ValidationError if *drops* is not a positive integer within
              XRPL supply limits (0 < drops <= 100 billion XRP in drops).
                  """
      if not isinstance(drops, int) or drops <= 0:
                raise ValidationError(
                              f"Invalid {label}: must be a positive integer, got {drops!r}"
                )
            if drops > XRP_MAX_DROPS:
                      raise ValidationError(
                                    f"Invalid {label}: {drops} exceeds maximum XRP supply "
                                    f"({XRP_MAX_DROPS} drops)"
                      )


def validate_nft_id(nft_id: str, label: str = "NFT token ID") -> None:
      """
          Raise ValidationError if *nft_id* is not a valid XRPL NFT token ID
              (exactly 64 upper- or lower-case hex characters).
                  """
    if not isinstance(nft_id, str) or not re.fullmatch(r"[0-9A-Fa-f]{64}", nft_id):
              raise ValidationError(
                            f"Invalid {label}: expected 64 hex chars, got {nft_id!r}"
              )


def validate_wallet(wallet: object, label: str = "wallet") -> Wallet:
      """
          Raise ValidationError if *wallet* is not an xrpl.wallet.Wallet instance.
              Returns the wallet typed correctly so callers get static-analysis benefit.
                  """
    if not isinstance(wallet, Wallet):
              raise ValidationError(
                            f"Invalid {label}: expected xrpl.wallet.Wallet instance, "
                            f"got {type(wallet).__name__!r}. "
                            "Ward never stores wallet keys — pass a live Wallet object."
              )
          return wallet

# ---------------------------------------------------------------------------
# XRPL ledger-time helpers
# ---------------------------------------------------------------------------

async def get_ledger_close_time(client: AsyncJsonRpcClient) -> int:
      """
          Return the current validated ledger close_time (Ripple epoch seconds).

              Tries Ledger(validated=True) first; falls back to ServerInfo.
                  Raises LedgerError if neither call succeeds.
                      """
    try:
              resp = await client.request(Ledger(ledger_index="validated"))
              if resp.is_successful():
                            close_time = resp.result.get("ledger", {}).get("close_time", 0)
                            if close_time:
                                              return int(close_time)
    except Exception:
        pass  # fall through to ServerInfo

    try:
              resp = await client.request(ServerInfo())
              if resp.is_successful():
                            validated = resp.result.get("info", {}).get("validated_ledger", {})
                            close_time = validated.get("close_time", 0)
                            if close_time:
                                              return int(close_time)
    except Exception:
        pass

    raise LedgerError(
              "Could not obtain validated-ledger close_time from XRPL node. "
              "Tried Ledger(validated) and ServerInfo."
    )


def ripple_time_now() -> int:
      """Return the current time as a Ripple epoch timestamp (approximate)."""
    return int(time.time()) - RIPPLE_EPOCH_OFFSET

# ---------------------------------------------------------------------------
# PREIMAGE-SHA-256 escrow condition helpers
# ---------------------------------------------------------------------------

def make_preimage_condition(preimage: bytes) -> Tuple[str, str]:
      """
          Derive a PREIMAGE-SHA-256 condition/fulfillment pair.

              Args:
                      preimage: Raw secret bytes (32 bytes recommended).

                          Returns:
                                  (condition_hex, fulfillment_hex) — both upper-case hex strings
                                          suitable for EscrowCreate.condition and EscrowFinish.fulfillment.
                                              """
    digest = hashlib.sha256(preimage).digest()
    # PREIMAGE-SHA-256 ASN.1 prefix: A0 25 80 20 <32-byte hash> 81 01 20
    condition_bytes = (
              bytes([0xA0, 0x25, 0x80, 0x20])
              + digest
              + bytes([0x81, 0x01, 0x20])
    )
    # Fulfillment: A0 22 80 20 <32-byte preimage>
    fulfillment_bytes = (
              bytes([0xA0, 0x22, 0x80, 0x20])
              + preimage
    )
    return condition_bytes.hex().upper(), fulfillment_bytes.hex().upper()


def generate_claim_preimage() -> bytes:
      """Return 32 cryptographically-random bytes for a new escrow preimage."""
    return secrets.token_bytes(32)

# ---------------------------------------------------------------------------
# Submission with retry  (Fix #6 — retryable XRPL errors)
# ---------------------------------------------------------------------------

async def submit_with_retry(
      tx: Transaction,
      client: AsyncJsonRpcClient,
      wallet: Wallet,
      *,
      max_attempts: int = 3,
      base_backoff_s: float = 4.0,
) -> object:
      """
          Submit a pre-autofilled transaction, retrying on retryable engine results.

              Retryable results (defined in constants.RETRYABLE_ENGINE_RESULTS):
                      telINSUF_FEE_P, terRETRY, terQUEUED, terPRE_SEQ

                          Non-retryable failures raise LedgerError immediately.

                              Args:
                                      tx:            Pre-autofilled Transaction object.
                                              client:        Active AsyncJsonRpcClient.
                                                      wallet:        Signer wallet (key used in-memory only).
                                                              max_attempts:  Total attempts before giving up (default 3).
                                                                      base_backoff_s: Base wait between retries; doubles each attempt
                                                                                              (default 4.0 s ≈ one ledger close).

                                                                                                  Returns:
                                                                                                          Successful Response object.
                                                                                                          
                                                                                                              Raises:
                                                                                                                      LedgerError on non-retryable failure or exhausted retries.
                                                                                                                          """
    last_result = ""
    for attempt in range(1, max_attempts + 1):
              try:
                            response = await submit_and_wait(tx, client, wallet, autofill=False)
except Exception as exc:
            raise LedgerError(f"XRPL submission raised exception: {exc}") from exc

        if response.is_successful():
                      return response

        engine_result = response.result.get("engine_result", "unknown")
        engine_msg    = response.result.get("engine_result_message", "")
        tx_result     = (
                      response.result.get("meta", {}).get("TransactionResult", "unknown")
        )

        if engine_result not in RETRYABLE_ENGINE_RESULTS:
                      raise LedgerError(
                                        f"Transaction failed (non-retryable): "
                                        f"engine_result={engine_result!r}  "
                                        f"tx_result={tx_result!r}  "
                                        f"message={engine_msg!r}"
                      )

        last_result = engine_result
        if attempt < max_attempts:
                      wait_s = base_backoff_s * (2 ** (attempt - 1))
                      logger.warning(
                          "Retryable engine result %r (attempt %d/%d) — "
                          "waiting %.1fs before retry",
                          engine_result, attempt, max_attempts, wait_s,
                      )
                      await asyncio.sleep(wait_s)

    raise LedgerError(
              f"Transaction failed after {max_attempts} attempts "
              f"(last engine_result={last_result!r})"
    )
