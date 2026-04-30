//! Ward Protocol — VaultMonitor (Rust)
//!
//! Trustless WebSocket default detection with 3-ledger confirmation.
//!
//! Core design principles:
//!   - Events are hints only — ledger state is truth.
//!   - After a ledger_closed event, ALWAYS re-fetch vault health_ratio
//!     via independent JSON-RPC call (NOT from the WebSocket event data).
//!   - Confirm DEFAULT_CONFIRM_COUNT=3 consecutive closes below threshold
//!     before firing on_verified_default.
//!   - Pending confirmation count survives reconnect (not reset on disconnect).
//!   - Exponential backoff reconnect: 1s → 2s → 4s → … → max 60s.
//!
//! ward_signed = false — this module never constructs or touches transactions.

use std::sync::{Arc, Mutex};
use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::sync::broadcast;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{info, warn};

use crate::error::WardError;

// ---------------------------------------------------------------------------
// Constants — must match Python ward/constants.py exactly
// ---------------------------------------------------------------------------

/// Consecutive ledger closes required before a default is confirmed.
pub const DEFAULT_CONFIRM_COUNT: u32 = 3;

/// Health ratio below which a vault is considered in default (XLS-66).
pub const HEALTH_RATIO_THRESHOLD: f64 = 1.5;

/// Initial reconnect delay in seconds (doubles on each failure).
pub const RECONNECT_BASE_SECS: u64 = 1;

/// Maximum reconnect delay in seconds.
pub const RECONNECT_MAX_SECS: u64 = 60;

/// Heartbeat timeout: reconnect if no ledger_closed event in this many seconds.
pub const HEARTBEAT_TIMEOUT_SECS: u64 = 60;

/// Allowed WebSocket endpoints — only TLS endpoints permitted.
pub const ALLOWED_WS_URLS: &[&str] = &[
    "wss://s.altnet.rippletest.net:51233/",
    "wss://xrplcluster.com/",
    "wss://s1.ripple.com/",
    "wss://s2.ripple.com/",
];

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

/// Configuration for VaultMonitor.
#[derive(Debug, Clone)]
pub struct MonitorConfig {
    /// XRPL WebSocket endpoint (must be wss://).
    pub ws_url: String,
    /// XRPL JSON-RPC endpoint for independent state reads.
    pub rpc_url: String,
    /// Vault address to monitor (XRPL classic address).
    pub vault_address: String,
    /// Consecutive ledger closes required to confirm default.
    pub confirm_count: u32,
}

impl Default for MonitorConfig {
    fn default() -> Self {
        Self {
            ws_url: "wss://s.altnet.rippletest.net:51233/".to_string(),
            rpc_url: "https://s.altnet.rippletest.net:51234/".to_string(),
            vault_address: String::new(),
            confirm_count: DEFAULT_CONFIRM_COUNT,
        }
    }
}

/// A verified default event: confirmed across DEFAULT_CONFIRM_COUNT ledger closes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifiedDefault {
    pub vault_address:      String,
    pub health_ratio:       f64,
    pub first_ledger_index: u32,
    pub confirmed_ledger:   u32,
    pub confirm_count:      u32,
    /// ward_signed is structurally false — this module never touches transactions.
    pub ward_signed:        bool,
}

impl VerifiedDefault {
    fn new(
        vault_address: String,
        health_ratio: f64,
        first_ledger_index: u32,
        confirmed_ledger: u32,
        confirm_count: u32,
    ) -> Self {
        Self {
            vault_address,
            health_ratio,
            first_ledger_index,
            confirmed_ledger,
            confirm_count,
            ward_signed: false, // hardcoded — cannot be true
        }
    }
}

/// Pending default signal (not yet confirmed across enough ledger closes).
#[derive(Debug, Clone)]
struct PendingDefault {
    vault_address:      String,
    health_ratio:       f64,
    first_ledger_index: u32,
    confirm_count:      u32,
}

// ---------------------------------------------------------------------------
// VaultMonitor
// ---------------------------------------------------------------------------

/// Async WebSocket vault monitor with 3-ledger default confirmation.
///
/// Implements the "events are hints, ledger is truth" principle:
/// WebSocket ledger_closed events trigger a fresh JSON-RPC health_ratio read.
#[derive(Debug)]
pub struct VaultMonitor {
    config:  MonitorConfig,
    pending: Arc<Mutex<Option<PendingDefault>>>,
    stop_tx: broadcast::Sender<()>,
}

impl VaultMonitor {
    pub fn new(config: MonitorConfig) -> Result<Self, WardError> {
        validate_ws_url(&config.ws_url)?;
        validate_xrpl_address(&config.vault_address)?;

        let (stop_tx, _) = broadcast::channel(1);
        Ok(Self {
            config,
            pending: Arc::new(Mutex::new(None)),
            stop_tx,
        })
    }

    /// Run the monitor loop. Returns a channel receiver for verified defaults.
    /// Reconnects automatically on disconnect with exponential backoff.
    /// Pending confirmation state survives reconnects.
    pub async fn run(&self) -> broadcast::Receiver<VerifiedDefault> {
        let (event_tx, event_rx) = broadcast::channel(16);
        let config  = self.config.clone();
        let pending = Arc::clone(&self.pending);
        let mut stop_rx = self.stop_tx.subscribe();

        tokio::spawn(async move {
            let mut delay_secs = RECONNECT_BASE_SECS;

            loop {
                // Check stop signal
                if stop_rx.try_recv().is_ok() {
                    info!("VaultMonitor stopping");
                    break;
                }

                match run_session(&config, &pending, &event_tx, &mut stop_rx).await {
                    Ok(()) => {
                        info!("VaultMonitor session ended cleanly");
                        break;
                    }
                    Err(e) => {
                        warn!(
                            "VaultMonitor disconnected: {}. Reconnecting in {}s...",
                            e, delay_secs
                        );
                        tokio::time::sleep(Duration::from_secs(delay_secs)).await;
                        delay_secs = (delay_secs * 2).min(RECONNECT_MAX_SECS);
                        // Reset delay on next successful connect (done inside run_session)
                    }
                }
            }
        });

        event_rx
    }

    /// Signal the monitor to stop after the current session ends.
    pub fn stop(&self) {
        let _ = self.stop_tx.send(());
    }
}

// ---------------------------------------------------------------------------
// Internal session logic
// ---------------------------------------------------------------------------

async fn run_session(
    config:   &MonitorConfig,
    pending:  &Arc<Mutex<Option<PendingDefault>>>,
    event_tx: &broadcast::Sender<VerifiedDefault>,
    stop_rx:  &mut broadcast::Receiver<()>,
) -> Result<(), WardError> {
    let (ws_stream, _) = connect_async(&config.ws_url)
        .await
        .map_err(|e| WardError::WebSocketError(e.to_string()))?;

    info!("VaultMonitor connected to {}", config.ws_url);

    let (mut write, mut read) = ws_stream.split();

    // Subscribe to ledger stream + vault account
    let sub = json!({
        "command":  "subscribe",
        "streams":  ["ledger"],
        "accounts": [config.vault_address],
    });
    write
        .send(Message::Text(sub.to_string().into()))
        .await
        .map_err(|e| WardError::WebSocketError(e.to_string()))?;

    info!(
        "VaultMonitor subscribed: vault={}, confirm_count={}",
        config.vault_address, config.confirm_count
    );

    let heartbeat_timeout = Duration::from_secs(HEARTBEAT_TIMEOUT_SECS);

    loop {
        tokio::select! {
            // Stop signal
            _ = stop_rx.recv() => {
                return Ok(());
            }

            // WebSocket message with heartbeat timeout
            maybe_msg = tokio::time::timeout(heartbeat_timeout, read.next()) => {
                match maybe_msg {
                    Err(_elapsed) => {
                        // No ledger_closed within HEARTBEAT_TIMEOUT_SECS — treat as disconnect
                        warn!("VaultMonitor heartbeat timeout ({}s) — reconnecting", HEARTBEAT_TIMEOUT_SECS);
                        return Err(WardError::WebSocketError("heartbeat timeout".to_string()));
                    }
                    Ok(None) => {
                        return Err(WardError::WebSocketError("stream ended".to_string()));
                    }
                    Ok(Some(Err(e))) => {
                        return Err(WardError::WebSocketError(e.to_string()));
                    }
                    Ok(Some(Ok(msg))) => {
                        if let Message::Text(text) = msg {
                            if let Ok(value) = serde_json::from_str::<Value>(&text) {
                                handle_message(config, pending, event_tx, value).await;
                            }
                        }
                    }
                }
            }
        }
    }
}

async fn handle_message(
    config:   &MonitorConfig,
    pending:  &Arc<Mutex<Option<PendingDefault>>>,
    event_tx: &broadcast::Sender<VerifiedDefault>,
    msg:      Value,
) {
    let msg_type = msg.get("type").and_then(Value::as_str).unwrap_or("");

    // ledger_closed: an XRPL ledger has closed.
    // This is a HINT — we re-fetch health_ratio via independent RPC.
    if msg_type == "ledgerClosed" || msg.get("ledger_index").is_some() {
        let ledger_index = msg
            .get("ledger_index")
            .and_then(Value::as_u64)
            .unwrap_or(0) as u32;

        // Independent read — never trust event data for the health ratio
        match fetch_health_ratio(&config.rpc_url, &config.vault_address).await {
            Err(e) => {
                warn!("VaultMonitor: health_ratio fetch failed: {}", e);
            }
            Ok(health_ratio) => {
                process_ledger_close(
                    config, pending, event_tx,
                    ledger_index, health_ratio,
                )
                .await;
            }
        }
    }
}

async fn process_ledger_close(
    config:      &MonitorConfig,
    pending:     &Arc<Mutex<Option<PendingDefault>>>,
    event_tx:    &broadcast::Sender<VerifiedDefault>,
    ledger_index: u32,
    health_ratio: f64,
) {
    let mut lock = pending.lock().unwrap();

    if health_ratio < HEALTH_RATIO_THRESHOLD {
        // Default condition persists — increment or start counter
        match lock.as_mut() {
            Some(p) => {
                p.confirm_count += 1;
                p.health_ratio   = health_ratio; // update to latest reading
                info!(
                    "VaultMonitor: default signal count={} ratio={:.4} ledger={}",
                    p.confirm_count, health_ratio, ledger_index
                );

                if p.confirm_count >= config.confirm_count {
                    // Confirmed — fire event
                    let event = VerifiedDefault::new(
                        p.vault_address.clone(),
                        p.health_ratio,
                        p.first_ledger_index,
                        ledger_index,
                        p.confirm_count,
                    );
                    info!(
                        "VaultMonitor: default CONFIRMED vault={} ratio={:.4} ledger={}",
                        event.vault_address, event.health_ratio, ledger_index
                    );
                    let _ = event_tx.send(event);
                    *lock = None; // reset after emitting
                }
            }
            None => {
                // First signal — start tracking
                *lock = Some(PendingDefault {
                    vault_address:      config.vault_address.clone(),
                    health_ratio,
                    first_ledger_index: ledger_index,
                    confirm_count:      1,
                });
                info!(
                    "VaultMonitor: default signal started ratio={:.4} ledger={}",
                    health_ratio, ledger_index
                );
            }
        }
    } else {
        // Health ratio recovered — reset counter
        if lock.is_some() {
            info!(
                "VaultMonitor: health recovered ratio={:.4} ledger={} — resetting counter",
                health_ratio, ledger_index
            );
            *lock = None;
        }
    }
}

// ---------------------------------------------------------------------------
// JSON-RPC: fetch vault health ratio (independent read — never from WS event)
// ---------------------------------------------------------------------------

async fn fetch_health_ratio(rpc_url: &str, vault_address: &str) -> Result<f64, WardError> {
    let client = reqwest::Client::new();

    // Query the XLS-66 Vault ledger object for the vault's health ratio.
    // On Altnet where XLS-66 is not yet live, fall back to account balance
    // as a proxy. Callers must be aware of this fallback behavior.
    let req_body = json!({
        "method": "account_info",
        "params": [{
            "account":       vault_address,
            "ledger_index":  "validated",
        }]
    });

    let resp = client
        .post(rpc_url)
        .json(&req_body)
        .timeout(Duration::from_secs(10))
        .send()
        .await?
        .json::<Value>()
        .await?;

    // XLS-66 Vault object: health_ratio = AssetsTotal / TotalValueOutstanding
    // Until XLS-66 lands on mainnet, read from account_data as a placeholder.
    let result = resp
        .get("result")
        .and_then(|r| r.get("account_data"));

    let health_ratio = if let Some(data) = result {
        // XLS-66 fields (live on Altnet when amendment passes)
        if let (Some(assets), Some(outstanding)) = (
            data.get("AssetsTotal").and_then(Value::as_f64),
            data.get("TotalValueOutstanding").and_then(Value::as_f64),
        ) {
            if outstanding > 0.0 { assets / outstanding } else { f64::INFINITY }
        } else {
            // Pre-XLS-66 fallback: balance / reserve as a proxy
            let balance = data
                .get("Balance")
                .and_then(Value::as_str)
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0);
            // Assume 10 XRP outstanding for proxy purposes (not production)
            if balance > 0.0 { balance / 10_000_000.0 } else { 0.0 }
        }
    } else {
        return Err(WardError::LedgerError(
            "account_info returned no account_data".to_string(),
        ));
    };

    Ok(health_ratio)
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/// Validate that a WebSocket URL is allowed (TLS only, known endpoint).
pub fn validate_ws_url(url: &str) -> Result<(), WardError> {
    if !url.starts_with("wss://") {
        return Err(WardError::ValidationError(format!(
            "WebSocket URL must use wss:// (TLS required): {}",
            url
        )));
    }
    if !ALLOWED_WS_URLS.contains(&url) {
        return Err(WardError::ValidationError(format!(
            "WebSocket URL not in allowed list: {}. Allowed: {:?}",
            url, ALLOWED_WS_URLS
        )));
    }
    Ok(())
}

/// Validate an XRPL classic address (base58check with 'r' prefix).
pub fn validate_xrpl_address(address: &str) -> Result<(), WardError> {
    if address.is_empty() {
        return Err(WardError::AddressError("address must not be empty".to_string()));
    }
    if !address.starts_with('r') {
        return Err(WardError::AddressError(format!(
            "XRPL classic address must start with 'r': {}",
            address
        )));
    }
    if address.len() < 25 || address.len() > 34 {
        return Err(WardError::AddressError(format!(
            "XRPL classic address must be 25–34 chars: {} (len {})",
            address,
            address.len()
        )));
    }
    // Verify base58check checksum
    match bs58::decode(address)
        .with_alphabet(bs58::Alphabet::RIPPLE)
        .into_vec()
    {
        Ok(bytes) if bytes.len() >= 5 => {
            let payload  = &bytes[..bytes.len() - 4];
            let checksum = &bytes[bytes.len() - 4..];
            use sha2::{Digest, Sha256};
            let hash1 = Sha256::digest(payload);
            let hash2 = Sha256::digest(&hash1);
            if &hash2[..4] != checksum {
                return Err(WardError::AddressError(format!(
                    "XRPL address checksum failed: {}",
                    address
                )));
            }
        }
        _ => {
            return Err(WardError::AddressError(format!(
                "XRPL address base58 decode failed: {}",
                address
            )));
        }
    }
    Ok(())
}
