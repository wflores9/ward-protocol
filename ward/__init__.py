"""
Ward Protocol SDK — Public Package API  v0.2.2

    from ward import WardClient, VaultMonitor, ClaimValidator
    from ward import EscrowSettlement, PoolHealthMonitor
    from ward import ValidationError, LedgerError, LicenseTier
    from ward import PoolHealth, VerifiedDefault, ValidationResult

Changelog:
    v0.2.2  Add ripple_time_now, get_ledger_close_time exports;
            full __all__ with all constants; aligned with ward_client.py shim.
    v0.2.1  Add ClaimValidator, ValidationResult, EscrowSettlement, EscrowRecord.
    v0.2.0  Initial modular split from ward_client monolith.
"""


__version__ = "0.2.2"


from ward.client import WardClient
from ward.vault_monitor import VaultMonitor, VerifiedDefault, DefaultSignal
from ward.validator import ClaimValidator, ValidationResult
from ward.settlement import EscrowSettlement, EscrowRecord
from ward.pool import PoolHealthMonitor, PoolHealth
from ward.primitives import (
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
from ward.constants import (
    LicenseTier,
    DEFAULT_TESTNET_URL,
    DEFAULT_TESTNET_WS,
    DEFAULT_MAINNET_URL,
    DEFAULT_MAINNET_WS,
    WARD_POLICY_TAXON,
    CREDENTIAL_NFT_TAXON,
    TF_BURNABLE,
    VALID_KYC_TYPES,
    MIN_COVERAGE_RATIO,
    LSF_LOAN_DEFAULT,
    XRPL_BASE_RESERVE_DROPS,
    XRPL_OWNER_RESERVE_DROPS,
    XRP_MAX_DROPS,
    RIPPLE_EPOCH_OFFSET,
    CLAIM_RATE_LIMIT_MAX,
    CLAIM_RATE_LIMIT_WINDOW_S,
    ESCROW_DISPUTE_HOURS,
    ESCROW_CANCEL_HOURS,
)


__all__ = [
    # Core SDK classes
    "WardClient",
    "VaultMonitor", "VerifiedDefault", "DefaultSignal",
    "ClaimValidator", "ValidationResult",
    "EscrowSettlement", "EscrowRecord",
    "PoolHealthMonitor", "PoolHealth",

    # Errors
    "WardError", "ValidationError", "SecurityError", "LedgerError",

    # Validators / crypto utilities
    "validate_xrpl_address", "validate_drops_amount", "validate_nft_id",
    "validate_wallet",
    "make_preimage_condition", "generate_claim_preimage",
    "get_ledger_close_time", "ripple_time_now",
    "submit_with_retry",

    # Licensing tier
    "LicenseTier",

    # Network endpoints
    "DEFAULT_TESTNET_URL", "DEFAULT_TESTNET_WS",
    "DEFAULT_MAINNET_URL", "DEFAULT_MAINNET_WS",

    # NFT / taxon constants
    "WARD_POLICY_TAXON", "CREDENTIAL_NFT_TAXON", "TF_BURNABLE",
    "VALID_KYC_TYPES",

    # Risk / rate constants
    "MIN_COVERAGE_RATIO",
    "CLAIM_RATE_LIMIT_MAX", "CLAIM_RATE_LIMIT_WINDOW_S",
    "ESCROW_DISPUTE_HOURS", "ESCROW_CANCEL_HOURS",

    # XRPL chain constants
    "LSF_LOAN_DEFAULT",
    "XRPL_BASE_RESERVE_DROPS", "XRPL_OWNER_RESERVE_DROPS",
    "XRP_MAX_DROPS", "RIPPLE_EPOCH_OFFSET",
]
