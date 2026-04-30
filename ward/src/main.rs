// Ward Protocol — VaultMonitor binary entry point
// Usage: ward-monitor --vault rVaultAddress [--ws wss://...]
//
// ward_signed = false — this binary never constructs or signs transactions.

use tracing_subscriber::EnvFilter;
use ward::{MonitorConfig, VaultMonitor};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let args: Vec<String> = std::env::args().collect();
    let vault = args
        .iter()
        .skip_while(|a| *a != "--vault")
        .nth(1)
        .cloned()
        .unwrap_or_else(|| {
            eprintln!("Usage: ward-monitor --vault <rVaultAddress>");
            std::process::exit(1);
        });

    let config = MonitorConfig {
        vault_address: vault.clone(),
        ..Default::default()
    };

    let monitor = match VaultMonitor::new(config) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("Configuration error: {}", e);
            std::process::exit(1);
        }
    };

    println!("Ward VaultMonitor — watching {}", vault);
    println!("Connecting to XRPL Altnet...");

    let mut rx = monitor.run().await;

    while let Ok(event) = rx.recv().await {
        println!(
            "VERIFIED DEFAULT: vault={} ratio={:.4} ledger={} (confirmed over {} closes)",
            event.vault_address,
            event.health_ratio,
            event.confirmed_ledger,
            event.confirm_count,
        );
        println!("  ward_signed = {}", event.ward_signed); // always false
    }
}
