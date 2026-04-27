"""
Ward Protocol SDK — Public Package API  v0.2.1

    from ward import WardClient, VaultMonitor, ClaimValidator
    from ward import EscrowSettlement, PoolHealthMonitor
    from ward import ValidationError, LedgerError, LicenseTier
    from ward import PoolHealth, VerifiedDefault, ValidationResult
"""

__version__ = "0.2.1"

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
    validate_wallet,
    make_preimage_condition,
    generate_claim_preimage,
    submit_with_retry,
)
from ward.constants import (
    LicenseTier,
    DEFAULT_TESTNET_URL,
    DEFAULT_TESTNET_WS,
    DEFAULT_MAINNET_URL,
    DEFAULT_MAINNET_WS,
    WARD_POLICY_TAXON,
    MIN_COVERAGE_RATIO,
)

__all__ = [
    # Core SDK
    "WardClient",
    "VaultMonitor", "VerifiedDefault", "DefaultSignal",
    "ClaimValidator", "ValidationResult",
    "EscrowSettlement", "EscrowRecord",
    "PoolHealthMonitor", "PoolHealth",
    # Errors
    "WardError", "ValidationError", "SecurityError", "LedgerError",
    # Utilities
    "validate_xrpl_address", "validate_drops_amount", "validate_wallet",
    "make_preimage_condition", "generate_claim_preimage", "submit_with_retry",
    # Constants
    "LicenseTier",
    "DEFAULT_TESTNET_URL", "DEFAULT_TESTNET_WS",
    "DEFAULT_MAINNET_URL", "DEFAULT_MAINNET_WS",
    "WARD_POLICY_TAXON", "MIN_COVERAGE_RATIO",
]
