"""
Ward Protocol — Shared primitives.

Errors, validators, and utilities used by every SDK module.
Import from here; never duplicate in module files.

Fixes applied:
    #4  No long-lived client instance attributes.
    #6  submit_with_retry handles retryable XRPL engine results.
    #7  validate_wallet() enforces xrpl.wallet.Wallet at every call boundary.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
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
    RIPPLE_EPOCH_OFFSET,
    XRP_MAX_DROPS,
)

logger = logging.getLogger("ward.primitives")


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class WardError(Exception):
    """Base error for all Ward Protocol exceptions."""


class ValidationError(WardError):
    """Input failed pre-condition checks (addresses, amounts, etc.)."""


class SecurityError(WardError):
    """Security invariant violation detected."""


class LedgerError(WardError):
    """XRPL ledger interaction failed."""


# ---------------------------------------------------------------------------
# Address and amount validators
# ---------------------------------------------------------------------------


def validate_xrpl_address(address: str, label: str = "address") -> None:
    """
    Assert that address is a valid XRPL classic address.

    Raises:
        ValidationError: if address is invalid or known-bad.
    """
    if not isinstance(address, str) or not address:
        raise ValidationError(f"{label} must be a non-empty string")
    if not is_valid_classic_address(address):
        raise ValidationError(
            f"{label} '{address}' is not a valid XRPL classic address"
        )


def validate_drops_amount(drops: int, label: str = "amount") -> None:
    """
    Assert that drops is a positive integer within XRPL limits.

    Raises:
        ValidationError: if drops is invalid.
    """
    if not isinstance(drops, int) or isinstance(drops, bool):
        raise ValidationError(f"{label} must be an integer, got {type(drops).__name__}")
    if drops <= 0:
        raise ValidationError(f"{label} must be > 0, got {drops}")
    if drops > XRP_MAX_DROPS:
        raise ValidationError(
            f"{label} {drops} exceeds maximum XRP supply ({XRP_MAX_DROPS} drops)"
        )


def validate_nft_id(nft_id: str, label: str = "NFT token ID") -> None:
    """
    Assert that nft_id is a 64-character uppercase hex string.

    Raises:
        ValidationError: if nft_id is invalid.
    """
    if not isinstance(nft_id, str) or not nft_id:
        raise ValidationError(f"{label} must be a non-empty string")
    if len(nft_id) != 64:
        raise ValidationError(
            f"{label} must be exactly 64 hex chars, got {len(nft_id)}"
        )
    if not all(c in "0123456789ABCDEF" for c in nft_id):
        raise ValidationError(
            f"{label} must be uppercase hex (0-9, A-F)"
        )


def validate_wallet(wallet: object, label: str = "wallet") -> Wallet:
    """
    Assert that wallet is an xrpl.wallet.Wallet instance with a valid address.

    Returns the wallet (typed) for use in the calling scope.

    Raises:
        ValidationError: if wallet is not a valid Wallet.
    """
    if not isinstance(wallet, Wallet):
        raise ValidationError(
            f"{label} must be an xrpl.wallet.Wallet instance, got {type(wallet).__name__}"
        )
    validate_xrpl_address(wallet.classic_address, f"{label}.classic_address")
    return wallet


# ---------------------------------------------------------------------------
# XRPL time utilities
# ---------------------------------------------------------------------------


async def get_ledger_close_time(client: AsyncJsonRpcClient) -> int:
    """
    Fetch the close_time of the most recently validated ledger.

    Tries Ledger(validated) first, then ServerInfo as fallback.

    Args:
        client: Open AsyncJsonRpcClient.

    Returns:
        Ripple epoch close_time (seconds since Jan 1 2000).

    Raises:
        LedgerError: if neither request succeeds.
    """
    try:
        resp = await client.request(Ledger(ledger_index="validated"))
        if resp.is_successful():
            close_time = resp.result.get("ledger", {}).get("close_time", 0)
            if close_time:
                return int(close_time)
    except Exception:
        pass

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
    """Return the current time as a Ripple epoch timestamp."""
    return int(time.time()) - RIPPLE_EPOCH_OFFSET


# ---------------------------------------------------------------------------
# Crypto — PREIMAGE-SHA-256 condition / fulfillment
# ---------------------------------------------------------------------------


def make_preimage_condition(preimage: bytes) -> Tuple[str, str]:
    """
    Derive a PREIMAGE-SHA-256 condition/fulfillment pair.

    Args:
        preimage: Raw secret bytes (must be exactly 32 bytes).

    Returns:
        (condition_hex, fulfillment_hex) — both upper-case hex strings
        suitable for EscrowCreate.condition and EscrowFinish.fulfillment.

    Raises:
        ValueError: if preimage is not exactly 32 bytes.
    """
    if len(preimage) != 32:
        raise ValueError(f"Preimage must be exactly 32 bytes, got {len(preimage)}")

    digest = hashlib.sha256(preimage).digest()
    # PREIMAGE-SHA-256 ASN.1 encoding
    condition_bytes = bytes([0xA0, 0x25, 0x80, 0x20]) + digest + bytes([0x81, 0x01, 0x20])
    fulfillment_bytes = bytes([0xA0, 0x22, 0x80, 0x20]) + preimage
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
    max_attempts: int = 3,
    base_delay: float = 1.0,
) -> object:
    """
    Submit a signed transaction with retry on retryable XRPL engine results.

    Retryable results: telINSUF_FEE_P, terRETRY, terQUEUED, terPRE_SEQ.

    Args:
        tx:           The transaction to submit (will be autofilled + signed).
        client:       Open AsyncJsonRpcClient.
        wallet:       Signing wallet.
        max_attempts: Maximum submission attempts.
        base_delay:   Initial retry delay in seconds (doubles each attempt).

    Returns:
        The successful XRPL response object.

    Raises:
        LedgerError: after all attempts fail.
    """
    last_exc: Optional[Exception] = None
    delay = base_delay

    for attempt in range(1, max_attempts + 1):
        try:
            response = await submit_and_wait(tx, client, wallet)
        except Exception as exc:
            last_exc = exc
            logger.warning("submit attempt %d raised: %s", attempt, exc)
            if attempt < max_attempts:
                await asyncio.sleep(delay)
                delay *= 2
            continue

        engine_result = (
            response.result.get("meta", {}).get("TransactionResult", "")
            or response.result.get("engine_result", "")
        )

        if response.is_successful():
            return response

        if engine_result in RETRYABLE_ENGINE_RESULTS:
            logger.warning(
                "Retryable XRPL result %s on attempt %d/%d",
                engine_result, attempt, max_attempts,
            )
            if attempt < max_attempts:
                await asyncio.sleep(delay)
                delay *= 2
            continue

        raise LedgerError(
            f"XRPL transaction failed with result '{engine_result}': "
            f"{response.result}"
        )

    raise LedgerError(
        f"Transaction failed after {max_attempts} attempts. "
        f"Last error: {last_exc}"
    )
