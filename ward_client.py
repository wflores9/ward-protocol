"""
ward_client.py — DEPRECATED SHIM  (Ward Protocol SDK v0.2.1)
=============================================================

This file is a backward-compatibility shim.

The monolithic ward_client.py has been refactored into the ward/ package:

    ward/constants.py     — all shared constants and LicenseTier
    ward/primitives.py    — errors, validators, crypto helpers, retry logic
    ward/client.py        — WardClient  (Module 1)
    ward/vault_monitor.py — VaultMonitor, VerifiedDefault  (Module 2)
    ward/validator.py     — ClaimValidator, ValidationResult  (Module 3)
    ward/settlement.py    — EscrowSettlement, EscrowRecord  (Module 4)
    ward/pool.py          — PoolHealthMonitor, PoolHealth  (Module 5)

Migration: replace any `from ward_client import ...` with `from ward import ...`
or with the specific sub-module (e.g. `from ward.validator import ClaimValidator`).

This shim re-exports all previously public symbols so existing code keeps working
during migration. It will be removed in v0.3.0.
"""

import warnings as _warnings

_warnings.warn(
    "ward_client is deprecated. Use `from ward import ...` instead. "
    "This shim will be removed in Ward SDK v0.3.0.",
    DeprecationWarning,
    stacklevel=2,
)

# ---------------------------------------------------------------------------
# Re-export everything from the new ward.* package
# ---------------------------------------------------------------------------

from ward.constants import (                           # noqa: F401, E402
    TF_BURNABLE,
    WARD_POLICY_TAXON,
    CREDENTIAL_NFT_TAXON,
    VALID_KYC_TYPES,
    CLAIM_RATE_LIMIT_MAX as RATE_LIMIT_ATTEMPTS,
    CLAIM_RATE_LIMIT_WINDOW_S as RATE_LIMIT_WINDOW_S,
    LicenseTier,
    DEFAULT_TESTNET_URL,
    DEFAULT_TESTNET_WS,
    DEFAULT_MAINNET_URL,
    DEFAULT_MAINNET_WS,
    MIN_COVERAGE_RATIO,
    LSF_LOAN_DEFAULT,
    XRPL_BASE_RESERVE_DROPS,
    XRPL_OWNER_RESERVE_DROPS,
    XRP_MAX_DROPS,
    RIPPLE_EPOCH_OFFSET,
)

from ward.primitives import (                          # noqa: F401, E402
    WardError,
    ValidationError,
    SecurityError,
    LedgerError,
    validate_xrpl_address,
    validate_drops_amount,
    validate_nft_id,
    validate_wallet,
    make_preimage_condition,
    generate_claim_preimage,
    get_ledger_close_time,
    ripple_time_now,
    submit_with_retry,
)

from ward.client import WardClient                     # noqa: F401, E402
from ward.vault_monitor import (                       # noqa: F401, E402
    VaultMonitor,
    VerifiedDefault,
    DefaultSignal,
)
from ward.validator import (                           # noqa: F401, E402
    ClaimValidator,
    ValidationResult,
)
from ward.settlement import (                          # noqa: F401, E402
    EscrowSettlement,
    EscrowRecord,
)
from ward.pool import (                                # noqa: F401, E402
    PoolHealthMonitor,
    PoolHealth,
)

# ---------------------------------------------------------------------------
# Shim: PREIMAGE_BYTES constant (32 bytes — generate_claim_preimage default)
# ---------------------------------------------------------------------------
PREIMAGE_BYTES: int = 32

# ---------------------------------------------------------------------------
# Shim: KYC helpers (now test-local; kept here for backward compat)
# ---------------------------------------------------------------------------
import hashlib as _hashlib                             # noqa: E402


def build_kyc_hash(kyc_type: str, subject_address: str, issued_at: int) -> str:
    """Deterministic SHA-256 KYC commitment."""
    if kyc_type not in VALID_KYC_TYPES:
        raise ValidationError(f"Unknown KYC type: {kyc_type}")
    raw = f"{kyc_type}:{subject_address}:{issued_at}"
    return _hashlib.sha256(raw.encode()).hexdigest()


def validate_kyc_hash(kyc_hash: str) -> None:
    """Validate a lowercase 64-char hex KYC hash string."""
    if not isinstance(kyc_hash, str):
        raise ValidationError("KYC hash must be a string")
    if len(kyc_hash) != 64:
        raise ValidationError(f"KYC hash must be 64 hex chars, got {len(kyc_hash)}")
    try:
        bytes.fromhex(kyc_hash)
    except ValueError as exc:
        raise ValidationError("KYC hash contains non-hex characters") from exc
    if kyc_hash != kyc_hash.lower():
        raise ValidationError("KYC hash must be lowercase hex")


# ---------------------------------------------------------------------------
# Shim: utility functions that lived in ward_client but now live elsewhere
# ---------------------------------------------------------------------------

def extract_nft_id(meta: dict) -> str:
    """Extract NFTokenID from a transaction meta dict."""
    from ward.primitives import LedgerError as _LE
    nftoken_id = meta.get("nftoken_id") or meta.get("NFTokenID")
    if nftoken_id:
        return nftoken_id
    for node in meta.get("AffectedNodes", []):
        for kind in ("CreatedNode", "ModifiedNode"):
            outer = node.get(kind, {})
            fields = outer.get("NewFields") or outer.get("FinalFields") or {}
            nfts = fields.get("NFTokens") or fields.get("nfts") or []
            for nft in nfts:
                nft_obj = nft.get("NFToken", nft)
                if nft_obj.get("NFTokenID"):
                    return nft_obj["NFTokenID"]
    raise _LE("NFTokenID not found in transaction meta")


def generate_claim_condition():
    """Return (preimage_bytes, condition_hex, fulfillment_hex)."""
    preimage = generate_claim_preimage()
    cond, fulf = make_preimage_condition(preimage)
    return preimage, cond, fulf


def calculate_coverage_ratio(usable_drops: int, active_coverage_drops: int) -> float:
    if active_coverage_drops == 0:
        return float("inf")
    return usable_drops / active_coverage_drops


def get_ledger_time(close_time_ripple: int) -> int:
    """Return XRPL close_time as-is (already Ripple epoch)."""
    return close_time_ripple


__all__ = [
    # Constants
    "TF_BURNABLE", "WARD_POLICY_TAXON", "CREDENTIAL_NFT_TAXON",
    "VALID_KYC_TYPES", "RATE_LIMIT_ATTEMPTS", "RATE_LIMIT_WINDOW_S",
    "PREIMAGE_BYTES", "LicenseTier",
    "DEFAULT_TESTNET_URL", "DEFAULT_TESTNET_WS",
    "DEFAULT_MAINNET_URL", "DEFAULT_MAINNET_WS",
    "MIN_COVERAGE_RATIO", "LSF_LOAN_DEFAULT",
    "XRPL_BASE_RESERVE_DROPS", "XRPL_OWNER_RESERVE_DROPS",
    "XRP_MAX_DROPS", "RIPPLE_EPOCH_OFFSET",
    # Errors
    "WardError", "ValidationError", "SecurityError", "LedgerError",
    # Validators
    "validate_xrpl_address", "validate_drops_amount", "validate_nft_id",
    "validate_wallet",
    # Crypto
    "make_preimage_condition", "generate_claim_preimage", "generate_claim_condition",
    "get_ledger_close_time", "ripple_time_now",
    # Submission
    "submit_with_retry",
    # Classes
    "WardClient",
    "VaultMonitor", "VerifiedDefault", "DefaultSignal",
    "ClaimValidator", "ValidationResult",
    "EscrowSettlement", "EscrowRecord",
    "PoolHealthMonitor", "PoolHealth",
    # KYC
    "build_kyc_hash", "validate_kyc_hash",
    # Utilities
    "extract_nft_id", "calculate_coverage_ratio", "get_ledger_time",
]
