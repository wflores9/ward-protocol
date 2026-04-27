"""
Ward Protocol — Shared constants.

Single source of truth for all magic numbers, flags, URLs, and tier
definitions used across the SDK modules.  Import from here only —
never re-define in module files.

Tier mapping (mirrors index.html licensing tiers):
    Starter   — SDK access, email support.          No hosted API.
        Standard  — Hosted Enterprise API, onboarding.  Most popular.
            Enterprise— White-label, SLA, legal opinion.    Full Rails.
            """

            # ---------------------------------------------------------------------------
            # Network endpoints
            # ---------------------------------------------------------------------------

            DEFAULT_TESTNET_URL: str = "https://s.altnet.rippletest.net:51234/"
            DEFAULT_TESTNET_WS: str  = "wss://s.altnet.rippletest.net:51233/"
            DEFAULT_MAINNET_URL: str = "https://xrplcluster.com/"
            DEFAULT_MAINNET_WS: str  = "wss://xrplcluster.com/"

            # ---------------------------------------------------------------------------
            # XLS-20 NFToken flags
            # ---------------------------------------------------------------------------

            TF_BURNABLE: int     = 0x00000001   # Issuer can burn — used for policy settlement
            TF_ONLY_XRP: int     = 0x00000002   # Not used by Ward; kept for completeness
            # TF_TRANSFERABLE intentionally omitted — Ward policies are NON-TRANSFERABLE

            # ---------------------------------------------------------------------------
            # Ward Protocol NFT taxon values  (XLS-20 §4.3)
            # ---------------------------------------------------------------------------

            WARD_POLICY_TAXON: int      = 282    # Default-protection policy NFT
            CREDENTIAL_NFT_TAXON: int   = 283    # KYC/AML credential NFT (XLS-70)

            # ---------------------------------------------------------------------------
            # KYC / credential
            # ---------------------------------------------------------------------------

            VALID_KYC_TYPES: frozenset = frozenset({"KYC_VERIFIED", "AML_CLEARED", "ACCREDITED_INVESTOR"})
            MAX_CREDENTIAL_URI_LEN: int = 256    # bytes, not hex chars

            # ---------------------------------------------------------------------------
            # XLS-66 loan-state flags
            # ---------------------------------------------------------------------------

            LSF_LOAN_DEFAULT: int   = 0x00000001
            LSF_LOAN_IMPAIRED: int  = 0x00000002

            # ---------------------------------------------------------------------------
            # XRPL on-chain constants
            # ---------------------------------------------------------------------------

            RIPPLE_EPOCH_OFFSET: int = 946684800           # Unix ts of Ripple epoch (2000-01-01)
            XRPL_BASE_RESERVE_DROPS: int  = 20_000_000     # 20 XRP base reserve
            XRPL_OWNER_RESERVE_DROPS: int = 2_000_000      # 2 XRP per owned object
            XRP_MAX_DROPS: int = 100_000_000_000_000_000   # 100 billion XRP

            # ---------------------------------------------------------------------------
            # Ward business parameters
            # ---------------------------------------------------------------------------

            MIN_COVERAGE_RATIO: float  = 1.5    # Pool must hold ≥1.5× active coverage to mint
            ESCROW_DISPUTE_HOURS: int  = 48     # Escrow finish window after default confirmed
            ESCROW_CANCEL_HOURS: int   = 72     # Escrow cancel window if claim not finalised
            DEFAULT_CONFIRM_COUNT: int = 3      # Ledger closes required before default is "verified"

            # ---------------------------------------------------------------------------
            # Rate limiting  (ClaimValidator — adversarial-hardened)
            # ---------------------------------------------------------------------------

            CLAIM_RATE_LIMIT_MAX: int     = 3    # Max claim attempts per NFT per window
            CLAIM_RATE_LIMIT_WINDOW_S: int = 300 # Window size in seconds (5 minutes)

            # ---------------------------------------------------------------------------
            # Licensing tier definitions  (mirrors index.html tiers)
            # ---------------------------------------------------------------------------
            # These are used by PoolHealthMonitor.is_minting_allowed() to enforce
            # tier-gated feature availability.
            #
            #   Starter    — open SDK, self-serve.  Pool minting allowed up to MODERATE.
            #   Standard   — hosted API, onboarding.  Pool minting allowed up to ELEVATED.
            #   Enterprise — white-label, SLA.  Pool minting allowed at all tiers.
            #
            # The tier enum value is also embedded in NFT metadata so the on-chain policy
            # record is self-describing.

            class LicenseTier:
                STARTER    = "starter"
                    STANDARD   = "standard"
                        ENTERPRISE = "enterprise"

                        # Maximum risk tier at which each license level may mint new policies.
                        # Tiers in ascending risk: safest < safe < moderate < elevated < high.
                        TIER_MINT_GATES: dict = {
                            LicenseTier.STARTER:    {"safest", "safe", "moderate"},
                                LicenseTier.STANDARD:   {"safest", "safe", "moderate", "elevated"},
                                    LicenseTier.ENTERPRISE: {"safest", "safe", "moderate", "elevated"},
                                        # "high" tier blocks ALL license levels — pool is undercollateralised
                                        }

                                        # ---------------------------------------------------------------------------
                                        # Pool risk-tier thresholds  (coverage ratio → tier label)
                                        # ---------------------------------------------------------------------------

                                        RISK_TIER_THRESHOLDS: list = [
                                            (5.0, "safest"),
                                                (3.0, "safe"),
                                                    (2.0, "moderate"),
                                                        (1.5, "elevated"),
                                                            (0.0, "high"),
                                                            ]

                                                            # Base annual premium rates by risk tier
                                                            TIER_BASE_RATES: dict = {
                                                                "safest":   0.01,
                                                                    "safe":     0.02,
                                                                        "moderate": 0.03,
                                                                            "elevated": 0.04,
                                                                                "high":     0.05,
                                                                                }

                                                                                # Dynamic multipliers by risk tier
                                                                                TIER_MULTIPLIERS: dict = {
                                                                                    "safest":   0.50,
                                                                                        "safe":     0.75,
                                                                                            "moderate": 1.00,
                                                                                                "elevated": 1.50,
                                                                                                    "high":     2.00,
                                                                                                    }
                                                                                                    
                                                                                                    # ---------------------------------------------------------------------------
                                                                                                    # Retryable XRPL engine results  (used by _submit_with_retry)
                                                                                                    # ---------------------------------------------------------------------------
                                                                                                    
                                                                                                    RETRYABLE_ENGINE_RESULTS: frozenset = frozenset({
                                                                                                        "telINSUF_FEE_P",
                                                                                                            "terRETRY",
                                                                                                                "terQUEUED",
                                                                                                                    "terPRE_SEQ",
                                                                                                                    })
                                                                                                                    
