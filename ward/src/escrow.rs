//! Ward Protocol — EscrowSettlement (Rust)
//!
//! PREIMAGE-SHA-256 conditioned unsigned transaction builder.
//!
//! Core security guarantees (enforced structurally, not by configuration):
//!   - ward_signed = false  — hardcoded in EscrowTx::new(), cannot be set to true.
//!   - No preimage field    — EscrowTx deliberately omits the preimage.
//!     Ward receives only condition_hex (SHA-256 hash).
//!     Only the claimant holds the preimage.
//!   - No wallet, no signing, no submission — construction only.
//!   - Integer drops only  — Amount field is u64. No floating point.
//!
//! Timing (matches Python ward/constants.py):
//!   FinishAfter = current_ledger_time + 172800  (48 hours)
//!   CancelAfter = current_ledger_time + 259200  (72 hours)

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::error::WardError;
use crate::monitor::validate_xrpl_address;

// ---------------------------------------------------------------------------
// Constants — must match Python ward/constants.py exactly
// ---------------------------------------------------------------------------

/// EscrowFinish window: pool must finish before this offset (seconds).
pub const ESCROW_FINISH_AFTER_SECS: u32 = 172_800; // 48 hours

/// EscrowCancel window: pool can cancel after this offset (seconds).
pub const ESCROW_CANCEL_AFTER_SECS: u32 = 259_200; // 72 hours

// ---------------------------------------------------------------------------
// EscrowTx — the ward_signed invariant enforced by type
// ---------------------------------------------------------------------------

/// An unsigned XRPL EscrowCreate transaction returned by Ward.
///
/// `ward_signed` is ALWAYS false — enforced in `EscrowTx::new()`.
/// `institution_signs` is ALWAYS true.
/// The `preimage` field is deliberately absent.
/// Ward never sees, stores, or logs the preimage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscrowTx {
    /// The unsigned EscrowCreate transaction JSON ready for institution signing.
    pub tx_json: Value,

    /// Always false. The institution signs. XRPL settles. Ward never signs.
    /// Hardcoded — cannot be set to true by any caller.
    pub ward_signed: bool,

    /// Always true. The institution must sign before submission.
    pub institution_signs: bool,

    /// The PREIMAGE-SHA-256 condition hex echoed back for verification.
    /// This is the SHA-256 hash of the preimage — NOT the preimage itself.
    pub condition_hex: String,

    // NOTE: `preimage` field is deliberately ABSENT.
    // Ward never receives, stores, or processes the preimage.
    // Only the claimant holds the preimage and submits it to EscrowFinish.
}

impl EscrowTx {
    /// Construct a new EscrowTx. `ward_signed` is hardcoded to `false`.
    fn new(tx_json: Value, condition_hex: String) -> Self {
        Self {
            tx_json,
            ward_signed:       false, // hardcoded — cannot be overridden
            institution_signs: true,  // hardcoded — institution always signs
            condition_hex,
        }
    }
}

// ---------------------------------------------------------------------------
// EscrowConfig
// ---------------------------------------------------------------------------

/// Parameters for building an EscrowCreate transaction.
#[derive(Debug, Clone)]
pub struct EscrowConfig {
    /// XLS-66 vault address being protected (informational — not in escrow tx).
    pub vault_address: String,

    /// Claimant XRPL address (Destination in EscrowCreate).
    pub claimant_address: String,

    /// Insurance pool XRPL address (Account in EscrowCreate — source of funds).
    pub pool_address: String,

    /// Payout amount in drops (integer only — no floating point).
    pub amount_drops: u64,

    /// PREIMAGE-SHA-256 condition hex (ASN.1 DER encoded).
    /// Ward receives ONLY this — never the preimage.
    pub condition_hex: String,

    /// Current XRPL ledger time (Ripple epoch seconds — seconds since 2000-01-01).
    pub current_ledger_time: u32,

    /// Claim ID for on-chain audit trail (included in Memo).
    pub claim_id: String,

    /// Policy NFT token ID for on-chain audit trail (included in Memo).
    pub nft_token_id: String,
}

// ---------------------------------------------------------------------------
// EscrowBuilder
// ---------------------------------------------------------------------------

/// Builds unsigned XRPL EscrowCreate transactions.
///
/// This builder constructs transactions only — it does not sign, submit,
/// or interact with the XRPL network. No wallet type exists in this module.
pub struct EscrowBuilder;

impl EscrowBuilder {
    /// Build an unsigned EscrowCreate transaction.
    ///
    /// Returns an `EscrowTx` with `ward_signed = false` enforced structurally.
    ///
    /// # Errors
    /// Returns `WardError` if any input is invalid.
    pub fn build(config: EscrowConfig) -> Result<EscrowTx, WardError> {
        // Validate all addresses at the boundary — no transaction construction
        // should proceed with an unvalidated address.
        validate_xrpl_address(&config.vault_address)?;
        validate_xrpl_address(&config.claimant_address)?;
        validate_xrpl_address(&config.pool_address)?;

        // Validate payout amount (integer drops only).
        validate_drops(config.amount_drops)?;

        // Validate PREIMAGE-SHA-256 condition hex.
        validate_condition_hex(&config.condition_hex)?;

        // Calculate timing from ledger time — never from local system clock.
        let finish_after = config.current_ledger_time + ESCROW_FINISH_AFTER_SECS;
        let cancel_after = config.current_ledger_time + ESCROW_CANCEL_AFTER_SECS;

        // Build audit memo: MemoType = hex("ward/claim-escrow"),
        // MemoData = hex("ward/claim-escrow:<claim_id>:<nft_token_id>")
        let memo_type_hex = hex::encode("ward/claim-escrow").to_uppercase();
        let memo_data_str = format!(
            "ward/claim-escrow:{}:{}",
            config.claim_id, config.nft_token_id
        );
        let memo_data_hex = hex::encode(memo_data_str.as_bytes()).to_uppercase();

        // Construct the unsigned EscrowCreate transaction JSON.
        // Amount is stored as a string (XRPL convention for drops).
        let tx_json = json!({
            "TransactionType": "EscrowCreate",
            "Account":         config.pool_address,
            "Destination":     config.claimant_address,
            "Amount":          config.amount_drops.to_string(),
            "Condition":       config.condition_hex,
            "FinishAfter":     finish_after,
            "CancelAfter":     cancel_after,
            "Memos": [{
                "Memo": {
                    "MemoType": memo_type_hex,
                    "MemoData": memo_data_hex,
                }
            }]
        });

        Ok(EscrowTx::new(tx_json, config.condition_hex))
    }
}

// ---------------------------------------------------------------------------
// PREIMAGE-SHA-256 condition validation
// ---------------------------------------------------------------------------

/// Validate that a condition hex string is a valid PREIMAGE-SHA-256 ASN.1 DER encoding.
///
/// Expected structure:
///   A0 25          — SEQUENCE tag, 37 bytes
///   80 20          — preimage-sha-256 tag, 32 bytes
///   <32 bytes>     — SHA-256 digest of the preimage
///   81 01 20       — cost tag, value 32
///
/// Total: 39 bytes → 78 hex characters.
pub fn validate_condition_hex(hex_str: &str) -> Result<(), WardError> {
    let bytes = hex::decode(hex_str).map_err(|e| {
        WardError::ConditionError(format!("condition_hex is not valid hex: {}", e))
    })?;

    if bytes.len() != 39 {
        return Err(WardError::ConditionError(format!(
            "condition_hex must be 39 bytes (78 hex chars); got {} bytes",
            bytes.len()
        )));
    }

    // Verify ASN.1 DER structure
    let expected_header = [0xA0u8, 0x25, 0x80, 0x20];
    if bytes[..4] != expected_header {
        return Err(WardError::ConditionError(format!(
            "condition_hex has wrong ASN.1 header: expected A0258020, got {:02X}{:02X}{:02X}{:02X}",
            bytes[0], bytes[1], bytes[2], bytes[3]
        )));
    }

    let expected_footer = [0x81u8, 0x01, 0x20];
    if bytes[36..] != expected_footer {
        return Err(WardError::ConditionError(
            "condition_hex has wrong cost footer: expected 810120".to_string(),
        ));
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// PREIMAGE-SHA-256 condition/fulfillment generation
// ---------------------------------------------------------------------------

/// Generate a PREIMAGE-SHA-256 condition/fulfillment pair from a 32-byte preimage.
///
/// The preimage is held exclusively by the claimant — Ward never sees it.
/// Only the condition_hex is passed to Ward and stored in EscrowCreate.
///
/// Returns `(condition_hex, fulfillment_hex)` both uppercase hex strings.
pub fn make_preimage_condition(preimage: &[u8; 32]) -> (String, String) {
    use sha2::{Digest, Sha256};

    let digest = Sha256::digest(preimage);

    // condition   : A0 25 | 80 20 | <32-byte-sha256-digest> | 81 01 20
    let mut condition = Vec::with_capacity(39);
    condition.extend_from_slice(&[0xA0, 0x25, 0x80, 0x20]);
    condition.extend_from_slice(&digest);
    condition.extend_from_slice(&[0x81, 0x01, 0x20]);

    // fulfillment : A0 22 | 80 20 | <32-byte-preimage>
    let mut fulfillment = Vec::with_capacity(36);
    fulfillment.extend_from_slice(&[0xA0, 0x22, 0x80, 0x20]);
    fulfillment.extend_from_slice(preimage);

    (
        hex::encode_upper(&condition),
        hex::encode_upper(&fulfillment),
    )
}

// ---------------------------------------------------------------------------
// Integer drops validation
// ---------------------------------------------------------------------------

/// Maximum XRP supply in drops (100 billion XRP × 1,000,000 drops/XRP).
pub const XRP_MAX_DROPS: u64 = 100_000_000_000_000_000;

/// Validate an amount in drops: must be > 0 and ≤ XRP_MAX_DROPS.
/// No floating point — u64 only.
pub fn validate_drops(drops: u64) -> Result<(), WardError> {
    if drops == 0 {
        return Err(WardError::ValidationError(
            "amount_drops must be > 0".to_string(),
        ));
    }
    if drops > XRP_MAX_DROPS {
        return Err(WardError::ValidationError(format!(
            "amount_drops {} exceeds max XRP supply ({} drops)",
            drops, XRP_MAX_DROPS
        )));
    }
    Ok(())
}
