package org.ward;

/**
 * Ward Protocol constants — mirrors ward/constants.py.
 *
 * ward_signed = false — Ward builds unsigned transactions; institutions sign.
 */
public final class WardConstants {

    private WardConstants() {}

    // NFT taxon values (XLS-20)
    public static final int WARD_POLICY_TAXON     = 281;   // Default-protection policy NFT
    public static final int WARD_CREDENTIAL_TAXON = 282;   // KYC/AML credential NFT

    // NFT flags
    public static final int TF_BURNABLE    = 0x00000001;   // Policy NFTs are burnable
    public static final int TF_TRANSFERABLE = 0x00000008;  // Deliberately ABSENT from policy NFTs

    // Loan state flag (XLS-66)
    public static final long LSF_LOAN_DEFAULT = 0x00010000L;

    // Risk constants
    public static final double MIN_COVERAGE_RATIO        = 1.5;
    public static final int    CLAIM_RATE_LIMIT_MAX      = 3;
    public static final int    CLAIM_RATE_LIMIT_WINDOW_S = 300;
    public static final int    ESCROW_DISPUTE_HOURS      = 72;
    public static final int    ESCROW_CANCEL_HOURS       = 96;

    // XRPL reserve (mainnet values, in drops)
    public static final long XRPL_BASE_RESERVE_DROPS  = 2_000_000L;
    public static final long XRPL_OWNER_RESERVE_DROPS =   200_000L;
    public static final long XRP_MAX_DROPS = 100_000_000_000_000_000L;

    // Time
    public static final long RIPPLE_EPOCH_OFFSET = 946_684_800L;

    // Network endpoints
    public static final String DEFAULT_TESTNET_URL = "https://s.altnet.rippletest.net:51234/";
    public static final String DEFAULT_TESTNET_WS  = "wss://s.altnet.rippletest.net:51233/";
    public static final String DEFAULT_MAINNET_URL = "https://xrplcluster.com/";
    public static final String DEFAULT_MAINNET_WS  = "wss://xrplcluster.com/";

    // Heartbeat timeout for VaultMonitor WebSocket
    public static final int MONITOR_HEARTBEAT_TIMEOUT_S = 60;

    /** Returns the current time as a Ripple epoch timestamp. */
    public static long rippleTimeNow() {
        return System.currentTimeMillis() / 1000L - RIPPLE_EPOCH_OFFSET;
    }

    /** Validates that drops is a non-negative integer within XRPL limits. */
    public static void validateDrops(long drops, String label) {
        if (drops < 0) {
            throw new IllegalArgumentException(label + " must be >= 0, got " + drops);
        }
        if (drops > XRP_MAX_DROPS) {
            throw new IllegalArgumentException(
                label + " " + drops + " exceeds max XRP supply (" + XRP_MAX_DROPS + " drops)"
            );
        }
    }
}
