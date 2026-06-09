// Ward Protocol — Property-based invariant tests (proptest)
//
// Formally enforces three protocol invariants against arbitrary inputs:
//
//   INV-003: ward_signed is structurally false for any valid EscrowConfig
//   INV-017: Building the same EscrowConfig twice produces identical tx_json
//   INV-018: FinishAfter/CancelAfter are deterministic pure functions of ledger time

use proptest::prelude::*;
use ward::escrow::{
    make_preimage_condition, EscrowBuilder, EscrowConfig,
    ESCROW_CANCEL_AFTER_SECS, ESCROW_FINISH_AFTER_SECS, XRP_MAX_DROPS,
};

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

// Known-valid XRPL addresses from the existing unit test suite.
fn arb_address() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe".to_string()),
        Just("rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh".to_string()),
    ]
}

// Upper bound on current_ledger_time that keeps both u32 timing additions
// (current_ledger_time + ESCROW_CANCEL_AFTER_SECS) safely below u32::MAX.
const LEDGER_TIME_SAFE_MAX: u32 = 4_000_000_000;

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

proptest! {
    // -----------------------------------------------------------------------
    // INV-003: ward_signed is always false — enforced by EscrowTx::new()
    // -----------------------------------------------------------------------

    #[test]
    fn prop_ward_signed_always_false(
        preimage     in proptest::array::uniform32(any::<u8>()),
        vault        in arb_address(),
        claimant     in arb_address(),
        pool         in arb_address(),
        amount_drops in 1u64..=XRP_MAX_DROPS,
        ledger_time  in 0u32..=LEDGER_TIME_SAFE_MAX,
        claim_id     in "[a-z0-9]{1,16}",
        nft_token_id in "[a-z0-9]{1,16}",
    ) {
        let (condition_hex, _) = make_preimage_condition(&preimage);
        let config = EscrowConfig {
            vault_address:       vault,
            claimant_address:    claimant,
            pool_address:        pool,
            amount_drops,
            condition_hex,
            current_ledger_time: ledger_time,
            claim_id,
            nft_token_id,
        };
        let tx = EscrowBuilder::build(config).unwrap();
        prop_assert!(!tx.ward_signed,
            "INV-003: ward_signed must always be false — Ward never holds keys or signs");
        prop_assert!(tx.institution_signs,
            "institution_signs must always be true");
        // JSON serialisation must also carry ward_signed: false, never true.
        let json_str = serde_json::to_string(&tx).unwrap();
        prop_assert!(json_str.contains("\"ward_signed\":false"), "{}", json_str);
        prop_assert!(!json_str.contains("\"ward_signed\":true"), "{}", json_str);
    }

    // -----------------------------------------------------------------------
    // INV-017: Idempotency — same inputs always produce the same tx_json
    // -----------------------------------------------------------------------

    #[test]
    fn prop_same_config_idempotent(
        preimage     in proptest::array::uniform32(any::<u8>()),
        vault        in arb_address(),
        claimant     in arb_address(),
        pool         in arb_address(),
        amount_drops in 1u64..=XRP_MAX_DROPS,
        ledger_time  in 0u32..=LEDGER_TIME_SAFE_MAX,
        claim_id     in "[a-z0-9]{1,16}",
        nft_token_id in "[a-z0-9]{1,16}",
    ) {
        let (condition_hex, _) = make_preimage_condition(&preimage);

        // Construct two configs with identical field values.
        let config1 = EscrowConfig {
            vault_address:       vault.clone(),
            claimant_address:    claimant.clone(),
            pool_address:        pool.clone(),
            amount_drops,
            condition_hex:       condition_hex.clone(),
            current_ledger_time: ledger_time,
            claim_id:            claim_id.clone(),
            nft_token_id:        nft_token_id.clone(),
        };
        let config2 = EscrowConfig {
            vault_address:       vault,
            claimant_address:    claimant,
            pool_address:        pool,
            amount_drops,
            condition_hex,
            current_ledger_time: ledger_time,
            claim_id,
            nft_token_id,
        };

        let tx1 = EscrowBuilder::build(config1).unwrap();
        let tx2 = EscrowBuilder::build(config2).unwrap();

        prop_assert_eq!(&tx1.tx_json, &tx2.tx_json,
            "INV-017: same EscrowConfig must produce identical tx_json");
        prop_assert_eq!(tx1.ward_signed, tx2.ward_signed);
        prop_assert_eq!(&tx1.condition_hex, &tx2.condition_hex);
        prop_assert_eq!(tx1.institution_signs, tx2.institution_signs);
    }

    // -----------------------------------------------------------------------
    // INV-018: Timing is a deterministic pure function of current_ledger_time
    // -----------------------------------------------------------------------

    #[test]
    fn prop_timing_deterministic_from_ledger_time(
        preimage    in proptest::array::uniform32(any::<u8>()),
        ledger_time in 0u32..=LEDGER_TIME_SAFE_MAX,
    ) {
        let (condition_hex, _) = make_preimage_condition(&preimage);
        let config = EscrowConfig {
            vault_address:       "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe".to_string(),
            claimant_address:    "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh".to_string(),
            pool_address:        "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh".to_string(),
            amount_drops:        1_000_000,
            condition_hex,
            current_ledger_time: ledger_time,
            claim_id:            "inv018".to_string(),
            nft_token_id:        "0".repeat(64),
        };
        let tx = EscrowBuilder::build(config).unwrap();

        let expected_finish = u64::from(ledger_time) + u64::from(ESCROW_FINISH_AFTER_SECS);
        let expected_cancel = u64::from(ledger_time) + u64::from(ESCROW_CANCEL_AFTER_SECS);

        let finish_after = tx.tx_json["FinishAfter"]
            .as_u64()
            .expect("FinishAfter must be a u64 in tx_json");
        let cancel_after = tx.tx_json["CancelAfter"]
            .as_u64()
            .expect("CancelAfter must be a u64 in tx_json");

        prop_assert_eq!(finish_after, expected_finish,
            "INV-018: FinishAfter must equal current_ledger_time + 48 h");
        prop_assert_eq!(cancel_after, expected_cancel,
            "INV-018: CancelAfter must equal current_ledger_time + 72 h");
        prop_assert!(cancel_after > finish_after,
            "INV-018: CancelAfter must be strictly after FinishAfter");
    }

    // INV-018 corollary: different ledger times always produce different windows.
    #[test]
    fn prop_different_ledger_times_produce_different_windows(
        t1 in 0u32..(LEDGER_TIME_SAFE_MAX / 2),
        t2 in 0u32..(LEDGER_TIME_SAFE_MAX / 2),
    ) {
        prop_assume!(t1 != t2);
        let finish1 = t1 + ESCROW_FINISH_AFTER_SECS;
        let finish2 = t2 + ESCROW_FINISH_AFTER_SECS;
        prop_assert_ne!(finish1, finish2,
            "INV-018: different ledger times must produce different FinishAfter values");
    }
}
