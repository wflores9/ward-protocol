// Ward Protocol — Rust SDK
//
// ward_signed = false — this crate constructs unsigned XRPL transactions.
// The institution signs. XRPL settles. Ward never holds keys.
//
// Modules:
//   monitor  — VaultMonitor: WebSocket default detection with 3-ledger confirmation
//   escrow   — EscrowSettlement: PREIMAGE-SHA-256 unsigned transaction builder
//   error    — WardError hierarchy

pub mod error;
pub mod monitor;
pub mod escrow;

pub use error::WardError;
pub use monitor::{VaultMonitor, VerifiedDefault, MonitorConfig};
pub use escrow::{EscrowTx, EscrowBuilder, EscrowConfig, validate_condition_hex};
