"""
Ward Protocol — Shared constants.

Single source of truth for all magic numbers and flag definitions
used across the SDK modules. Import from here; never re-define.

Tier mapping (mirrors index.html licensing tiers):
    Starter    — SDK access, email support.
    Standard   — Hosted Enterprise API, onboarding engineer.
    Enterprise — White-label, SLA, legal opinion.
"""

# ---------------------------------------------------------------------------
# Network endpoints
# ---------------------------------------------------------------------------

DEFAULT_TESTNET_URL: str = "https://s.altnet.rippletest.net:51234/"
DEFAULT_TESTNET_WS:  str = "wss://s.altnet.rippletest.net:51233/"
DEFAULT_MAINNET_URL: str = "https://xrplcluster.com/"
DEFAULT_MAINNET_WS:  str = "wss://xrplcluster.com/"

# ---------------------------------------------------------------------------
# XLS-20 NFToken flags
# ---------------------------------------------------------------------------

TF_BURNABLE:  int = 0x00000001   # Issuer can burn the NFT
TF_ONLY_XRP:  int = 0x00000002   # Not used by Ward, but present in xrpl-py
# TF_TRANSFERABLE intentionally omitted — Ward policies are non-transferable

# ---------------------------------------------------------------------------
# Ward Protocol NFT taxon values  (XLS-20 §4.3)
# ---------------------------------------------------------------------------

WARD_POLICY_TAXON:    int = 282   # Default-protection policy NFT
CREDENTIAL_NFT_TAXON: int = 283   # KYC/AML credential NFT

# ---------------------------------------------------------------------------
# KYC / credential
# ---------------------------------------------------------------------------

VALID_KYC_TYPES: frozenset = frozenset({"KYC_VERIFIED", "AML_CLEARED", "ACCREDITED_INVESTOR"})
MAX_CREDENTIAL_URI_LEN: int = 256   # bytes, not hex chars

# ---------------------------------------------------------------------------
# XLS-66 loan-state flags
# ---------------------------------------------------------------------------

LSF_LOAN_DEFAULT:  int = 0x00000001
LSF_LOAN_IMPAIRED: int = 0x00000002

# ---------------------------------------------------------------------------
# XRPL on-chain constants
# ---------------------------------------------------------------------------

RIPPLE_EPOCH_OFFSET:     int = 946684800        # Unix ts of Ripple epoch (Jan 1 2000)
XRPL_BASE_RESERVE_DROPS: int = 20_000_000       # 20 XRP base account reserve
XRPL_OWNER_RESERVE_DROPS: int = 2_000_000       # 2 XRP per owned object
XRP_MAX_DROPS: int = 100_000_000_000_000_000    # 100 billion XRP in drops

# ---------------------------------------------------------------------------
# Ward business parameters
# ---------------------------------------------------------------------------

MIN_COVERAGE_RATIO: float = 1.5    # Pool must hold ≥1.5× active coverage
ESCROW_DISPUTE_HOURS: int = 48     # Escrow finish window after creation
ESCROW_CANCEL_HOURS: int  = 72     # Escrow cancel window if claimant fails
DEFAULT_CONFIRM_COUNT: int = 3     # Ledger closes required before default confirmed

# ---------------------------------------------------------------------------
# Rate limiting  (ClaimValidator)
# ---------------------------------------------------------------------------

CLAIM_RATE_LIMIT_MAX:      int = 3    # Max claim attempts per NFT per window
CLAIM_RATE_LIMIT_WINDOW_S: int = 300  # Window size in seconds (5 minutes)

# ---------------------------------------------------------------------------
# Retryable XRPL engine results  (submit_with_retry)
# ---------------------------------------------------------------------------

RETRYABLE_ENGINE_RESULTS: frozenset = frozenset({
    "telINSUF_FEE_P",
    "terRETRY",
    "terQUEUED",
    "terPRE_SEQ",
})

# ---------------------------------------------------------------------------
# Licensing tier definitions  (mirrors index.html tiers)
# ---------------------------------------------------------------------------


class LicenseTier:
    STARTER    = "starter"
    STANDARD   = "standard"
    ENTERPRISE = "enterprise"

    # Maximum risk tier at which each license level may mint new policies.
    # Tiers in ascending risk: safest < safe < moderate < elevated < high.
    # "high" always blocks ALL tiers — pool is undercollateralised.
    TIER_MINT_GATES: dict = {
        "starter":    {"safest", "safe", "moderate"},
        "standard":   {"safest", "safe", "moderate", "elevated"},
        "enterprise": {"safest", "safe", "moderate", "elevated"},
    }


# ---------------------------------------------------------------------------
# Pool risk-tier thresholds  (coverage ratio bands)
# ---------------------------------------------------------------------------

RISK_TIER_THRESHOLDS: list = [
    (5.0, "safest"),
    (3.0, "safe"),
    (2.0, "moderate"),
    (1.5, "elevated"),
    (0.0, "high"),
]

# Base annual premium rates by tier (annualised)
TIER_BASE_RATES: dict = {
    "safest":   0.01,    # 1.0%
    "safe":     0.02,    # 2.0%
    "moderate": 0.03,    # 3.0%
    "elevated": 0.04,    # 4.0%
    "high":     0.05,    # 5.0%
}

# Premium multipliers by tier
TIER_MULTIPLIERS: dict = {
    "safest":   0.50,
    "safe":     0.75,
    "moderate": 1.00,
    "elevated": 1.50,
    "high":     2.00,
}

# ---------------------------------------------------------------------------
# Module-level aliases for backward compatibility
# (TIER_MINT_GATES lives inside LicenseTier class but modules may import it directly)
# ---------------------------------------------------------------------------

TIER_MINT_GATES = LicenseTier.TIER_MINT_GATES
