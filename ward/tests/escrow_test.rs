// Ward Protocol — EscrowSettlement unit tests
//
// Tests cover:
//   - ward_signed structurally always false
//   - FinishAfter = +48 hours from ledger time
//   - CancelAfter = +72 hours from ledger time
//   - Ward never receives or stores the preimage
//   - Drops arithmetic is integer only (u64)
//   - Address validation at build boundary
//   - Condition hex validation (PREIMAGE-SHA-256 ASN.1 DER)

use ward::escrow::{
    make_preimage_condition, validate_condition_hex, validate_drops, EscrowBuilder,
    EscrowConfig, ESCROW_CANCEL_AFTER_SECS, ESCROW_FINISH_AFTER_SECS, XRP_MAX_DROPS,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn valid_config() -> EscrowConfig {
    let preimage: [u8; 32] = [0u8; 32];
    let (condition_hex, _) = make_preimage_condition(&preimage);
    EscrowConfig {
        vault_address:       "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe".to_string(),
        claimant_address:    "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh".to_string(),
        pool_address:        "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh".to_string(),
        amount_drops:        5_000_000, // 5 XRP
        condition_hex,
        current_ledger_time: 800_000_000u32,
    }
}

// ---------------------------------------------------------------------------
// 2.6 — ward_signed invariant enforced structurally
// ---------------------------------------------------------------------------

#[test]
fn test_escrow_ward_signed_always_false() {
    let tx = EscrowBuilder::build(valid_config()).unwrap();
    assert!(!tx.ward_signed, "ward_signed must always be false — enforced by type");
    assert!(tx.institution_signs, "institution_signs must always be true");
}

#[test]
fn test_escrow_ward_signed_false_in_json_output() {
    // The JSON representation must NOT contain ward_signed: true anywhere
    let tx = EscrowBuilder::build(valid_config()).unwrap();
    let json = serde_json::to_string(&tx).unwrap();
    // ward_signed must be false in the serialized output
    assert!(json.contains("\"ward_signed\":false"), "JSON: {}", json);
    assert!(!json.contains("\"ward_signed\":true"), "JSON: {}", json);
}

// ---------------------------------------------------------------------------
// 2.6 — Ward never receives or stores the preimage
// ---------------------------------------------------------------------------

#[test]
fn test_escrow_ward_never_receives_preimage() {
    let tx = EscrowBuilder::build(valid_config()).unwrap();

    // EscrowTx has no preimage field
    let json_str = serde_json::to_string(&tx).unwrap();
    assert!(
        !json_str.contains("preimage"),
        "EscrowTx must not contain a preimage field: {}",
        json_str
    );

    // Condition hex is echoed back but is just the SHA-256 hash (safe to share)
    assert!(!tx.condition_hex.is_empty());
}

// ---------------------------------------------------------------------------
// Timing — FinishAfter +48h, CancelAfter +72h
// ---------------------------------------------------------------------------

#[test]
fn test_escrow_finish_after_48h() {
    let config = valid_config();
    let current_time = config.current_ledger_time;
    let tx = EscrowBuilder::build(config).unwrap();

    let finish_after = tx.tx_json["FinishAfter"].as_u64().unwrap() as u32;
    assert_eq!(
        finish_after,
        current_time + ESCROW_FINISH_AFTER_SECS,
        "FinishAfter must be current_ledger_time + 172800 (48h)"
    );
    assert_eq!(ESCROW_FINISH_AFTER_SECS, 172_800, "48 hours = 172800 seconds");
}

#[test]
fn test_escrow_cancel_after_72h() {
    let config = valid_config();
    let current_time = config.current_ledger_time;
    let tx = EscrowBuilder::build(config).unwrap();

    let cancel_after = tx.tx_json["CancelAfter"].as_u64().unwrap() as u32;
    assert_eq!(
        cancel_after,
        current_time + ESCROW_CANCEL_AFTER_SECS,
        "CancelAfter must be current_ledger_time + 259200 (72h)"
    );
    assert_eq!(ESCROW_CANCEL_AFTER_SECS, 259_200, "72 hours = 259200 seconds");
    assert!(ESCROW_CANCEL_AFTER_SECS > ESCROW_FINISH_AFTER_SECS, "cancel must be after finish");
}

// ---------------------------------------------------------------------------
// 2.14 — Drops arithmetic: integer only, no floating point
// ---------------------------------------------------------------------------

#[test]
fn test_escrow_drops_arithmetic_integer_only() {
    // Amount is stored as u64 and serialized as a string (XRPL convention)
    let tx = EscrowBuilder::build(valid_config()).unwrap();
    let amount_str = tx.tx_json["Amount"].as_str().unwrap();
    // Must be parseable as u64 — no decimal point
    let amount: u64 = amount_str.parse().expect("Amount must be integer drops");
    assert_eq!(amount, 5_000_000, "5 XRP = 5_000_000 drops");
    assert!(!amount_str.contains('.'), "Amount must not contain decimal point");
}

#[test]
fn test_drops_zero_rejected() {
    let err = validate_drops(0).unwrap_err();
    assert!(err.to_string().contains("> 0"), "{}", err);
}

#[test]
fn test_drops_overflow_rejected() {
    let err = validate_drops(XRP_MAX_DROPS + 1).unwrap_err();
    assert!(err.to_string().contains("max XRP supply"), "{}", err);
}

#[test]
fn test_drops_max_valid() {
    validate_drops(XRP_MAX_DROPS).unwrap();
}

#[test]
fn test_drops_one_valid() {
    validate_drops(1).unwrap();
}

// ---------------------------------------------------------------------------
// Address validation at EscrowBuilder boundary
// ---------------------------------------------------------------------------

#[test]
fn test_escrow_rejects_invalid_vault_address() {
    let mut config = valid_config();
    config.vault_address = "not-an-address".to_string();
    let err = EscrowBuilder::build(config).unwrap_err();
    assert!(err.to_string().contains("start with 'r'"), "{}", err);
}

#[test]
fn test_escrow_rejects_invalid_claimant_address() {
    let mut config = valid_config();
    config.claimant_address = "".to_string();
    let err = EscrowBuilder::build(config).unwrap_err();
    assert!(err.to_string().contains("empty"), "{}", err);
}

#[test]
fn test_escrow_rejects_invalid_pool_address() {
    let mut config = valid_config();
    config.pool_address = "INVALID".to_string();
    let err = EscrowBuilder::build(config).unwrap_err();
    assert!(err.to_string().contains("start with 'r'"), "{}", err);
}

// ---------------------------------------------------------------------------
// PREIMAGE-SHA-256 condition validation
// ---------------------------------------------------------------------------

#[test]
fn test_condition_hex_wrong_length_rejected() {
    let err = validate_condition_hex("A025802000").unwrap_err();
    assert!(err.to_string().contains("39 bytes"), "{}", err);
}

#[test]
fn test_condition_hex_wrong_header_rejected() {
    // Valid length but wrong header
    let bad_hex = "FF".repeat(39);
    let err = validate_condition_hex(&bad_hex).unwrap_err();
    assert!(err.to_string().contains("wrong ASN.1 header"), "{}", err);
}

#[test]
fn test_condition_hex_not_hex_rejected() {
    let err = validate_condition_hex("not-hex-at-all").unwrap_err();
    assert!(err.to_string().contains("not valid hex"), "{}", err);
}

#[test]
fn test_condition_hex_valid_roundtrip() {
    // Generate a valid condition from a known preimage and validate it
    let preimage = [0x42u8; 32];
    let (condition_hex, fulfillment_hex) = make_preimage_condition(&preimage);
    validate_condition_hex(&condition_hex).unwrap();

    // Verify structure
    assert_eq!(condition_hex.len(), 78, "condition_hex must be 78 hex chars (39 bytes)");
    assert_eq!(fulfillment_hex.len(), 72, "fulfillment_hex must be 72 hex chars (36 bytes)");
    assert!(condition_hex.starts_with("A025802"), "must have PREIMAGE-SHA-256 header");
    assert!(fulfillment_hex.starts_with("A022802"), "must have fulfillment header");
}

#[test]
fn test_make_preimage_condition_different_preimages_differ() {
    let (cond1, _) = make_preimage_condition(&[0u8; 32]);
    let (cond2, _) = make_preimage_condition(&[1u8; 32]);
    assert_ne!(cond1, cond2, "different preimages must produce different conditions");
}

// ---------------------------------------------------------------------------
// EscrowTx JSON structure
// ---------------------------------------------------------------------------

#[test]
fn test_escrow_tx_json_has_required_fields() {
    let tx = EscrowBuilder::build(valid_config()).unwrap();
    let json = &tx.tx_json;

    assert_eq!(json["TransactionType"].as_str().unwrap(), "EscrowCreate");
    assert!(json["Account"].as_str().is_some());
    assert!(json["Destination"].as_str().is_some());
    assert!(json["Amount"].as_str().is_some());
    assert!(json["Condition"].as_str().is_some());
    assert!(json["FinishAfter"].as_u64().is_some());
    assert!(json["CancelAfter"].as_u64().is_some());

    // Signing fields must NOT be present — Ward never populates these
    assert!(json.get("TxnSignature").is_none(), "unsigned tx must not have TxnSignature");
    assert!(json.get("SigningPubKey").is_none(), "unsigned tx must not have SigningPubKey");
}

#[test]
fn test_escrow_pool_address_is_account() {
    let config = valid_config();
    let pool = config.pool_address.clone();
    let tx = EscrowBuilder::build(config).unwrap();
    assert_eq!(tx.tx_json["Account"].as_str().unwrap(), pool);
}

#[test]
fn test_escrow_claimant_is_destination() {
    let config = valid_config();
    let claimant = config.claimant_address.clone();
    let tx = EscrowBuilder::build(config).unwrap();
    assert_eq!(tx.tx_json["Destination"].as_str().unwrap(), claimant);
}
