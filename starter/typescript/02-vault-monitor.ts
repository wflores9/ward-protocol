/**
 * Ward Protocol — Example 2: VaultMonitor WebSocket Subscription
 *
 * Subscribes to XLS-66 vault accounts via the XRPL WebSocket ledger stream.
 * Detects LSF_LOAN_DEFAULT flag changes in transaction metadata and requires
 * CONFIRM_COUNT consecutive ledger closes before firing onVerifiedDefault —
 * matching the Python VaultMonitor in ward/vault_monitor.py.
 *
 * Reconnects automatically on disconnect with exponential back-off (1 s → 60 s).
 *
 * Note: XLS-66 is not yet live on mainnet. This monitor will work immediately
 * once the amendment passes. On Altnet you can test the reconnect and ledger-
 * subscription plumbing without seeing real default events.
 *
 * API: https://api.wardprotocol.org  (status check on startup)
 * SDK: xrpl@4.6.0
 *
 * Usage:
 *   VAULT_ADDRESS=rYourVaultAddress npm run vault-monitor
 */

import { Client } from "xrpl";
import type { TransactionStream, LedgerStream } from "xrpl";

const XRPL_WS     = "wss://s.altnet.rippletest.net:51233/";
const WARD_API    = "https://api.wardprotocol.org";

// XLS-66 loan-state flag — mirrors ward/constants.py LSF_LOAN_DEFAULT
const LSF_LOAN_DEFAULT = 0x00000001;

// Number of consecutive ledger closes required to confirm a default.
// Matches DEFAULT_CONFIRM_COUNT in ward/constants.py.
const DEFAULT_CONFIRM_COUNT = 3;

// ── Types ─────────────────────────────────────────────────────────────────────

interface DefaultSignal {
  vaultAddress: string;
  loanId:       string;
  healthRatio:  number;
  ledgerIndex:  number;
  confirmCount: number;
}

interface VerifiedDefault {
  vaultAddress:     string;
  loanId:           string;
  healthRatio:      number;
  firstLedgerIndex: number;
  confirmedLedger:  number;
  outstandingDrops: number;
  collateralDrops:  number;
}

type DefaultCallback = (event: VerifiedDefault) => void | Promise<void>;

// ── VaultMonitor ──────────────────────────────────────────────────────────────

class VaultMonitor {
  private readonly _wsUrl:        string;
  private readonly _vaults:       Set<string>;
  private readonly _confirmCount: number;
  private _pending:   Map<string, DefaultSignal> = new Map();
  private _callbacks: DefaultCallback[]           = [];
  private _running   = false;

  constructor(opts: {
    vaultAddresses: string[];
    wsUrl?:         string;
    confirmCount?:  number;
  }) {
    this._wsUrl        = opts.wsUrl        ?? XRPL_WS;
    this._confirmCount = opts.confirmCount ?? DEFAULT_CONFIRM_COUNT;
    this._vaults       = new Set(opts.vaultAddresses);
  }

  onVerifiedDefault(cb: DefaultCallback): void {
    this._callbacks.push(cb);
  }

  /** Start monitoring. Reconnects automatically on WebSocket disconnect. */
  async run(): Promise<void> {
    this._running = true;
    let delay = 1_000; // ms

    while (this._running) {
      const client = new Client(this._wsUrl);
      try {
        await client.connect();
        delay = 1_000; // reset back-off on successful connect
        console.log(`[monitor] Connected to ${this._wsUrl}`);

        await client.request({
          command:  "subscribe",
          accounts: [...this._vaults],
          streams:  ["ledger"],
        });
        console.log(`[monitor] Subscribed to ${this._vaults.size} vault(s)`);

        client.on("transaction", (stream: TransactionStream) => {
          this._handleTransaction(stream).catch((err) =>
            console.error("[monitor] transaction handler error:", err),
          );
        });

        client.on("ledgerClosed", (stream: LedgerStream) => {
          this._processConfirmations(stream.ledger_index).catch((err) =>
            console.error("[monitor] confirmation handler error:", err),
          );
        });

        // Block until the WebSocket disconnects.
        await new Promise<void>((_, reject) => {
          client.on("disconnected", (code) => {
            reject(new Error(`WebSocket disconnected (code ${code})`));
          });
        });
      } catch (err) {
        if (!this._running) break;
        console.warn(`[monitor] ${err}. Reconnecting in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 60_000);
      } finally {
        await client.disconnect().catch(() => {});
      }
    }
  }

  stop(): void {
    this._running = false;
  }

  // ── internal ──────────────────────────────────────────────────────────────

  private async _handleTransaction(stream: TransactionStream): Promise<void> {
    const tx   = stream.transaction as unknown as Record<string, unknown>;
    const meta = stream.meta       as unknown as Record<string, unknown>;

    const account = tx["Account"] as string | undefined;
    if (!account || !this._vaults.has(account)) return;

    // XLS-66 transactions carry a LoanID field on loan-state changes.
    const loanId = (tx["LoanID"] ?? tx["Offer"] ?? "") as string;
    if (!loanId) return;

    // Inspect the first AffectedNode for the LSF_LOAN_DEFAULT flag.
    const affectedNodes = (meta["AffectedNodes"] as Record<string, unknown>[] | undefined) ?? [];
    const finalFields   = (
      (affectedNodes[0]?.["ModifiedNode"] ?? affectedNodes[0]?.["CreatedNode"]) as
        Record<string, unknown> | undefined
    )?.["FinalFields"] as Record<string, unknown> | undefined;

    const flags = Number(finalFields?.["Flags"] ?? 0);
    if (!(flags & LSF_LOAN_DEFAULT)) return;

    const outstanding = Number(finalFields?.["PrincipalOutstanding"] ?? 0);
    const collateral  = Number(finalFields?.["CollateralAmount"]     ?? 0);
    const ratio       = outstanding > 0 ? collateral / outstanding : Infinity;
    const ledger      = Number(stream.ledger_index ?? 0);

    const existing = this._pending.get(loanId);
    if (existing) {
      existing.confirmCount++;
    } else {
      this._pending.set(loanId, {
        vaultAddress: account,
        loanId,
        healthRatio:  ratio,
        ledgerIndex:  ledger,
        confirmCount: 0,
      });
    }

    console.log(
      `[monitor] Default signal: loan=${loanId.slice(0, 8)}... ` +
      `ratio=${ratio.toFixed(4)} confirmCount=${(existing?.confirmCount ?? 0) + 1}`,
    );
  }

  private async _processConfirmations(currentLedger: number): Promise<void> {
    for (const [loanId, signal] of [...this._pending.entries()]) {
      signal.confirmCount++;
      if (signal.confirmCount < this._confirmCount) continue;

      this._pending.delete(loanId);

      const event: VerifiedDefault = {
        vaultAddress:     signal.vaultAddress,
        loanId:           signal.loanId,
        healthRatio:      signal.healthRatio,
        firstLedgerIndex: signal.ledgerIndex,
        confirmedLedger:  currentLedger,
        // Outstanding and collateral amounts are re-read from chain here
        // in the Python implementation; omitted in this example for brevity.
        outstandingDrops: 0,
        collateralDrops:  0,
      };

      for (const cb of this._callbacks) {
        try {
          await cb(event);
        } catch (err) {
          console.error("[monitor] callback error:", err);
        }
      }
    }
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Use a known Altnet address or set VAULT_ADDRESS in your environment.
  const vaultAddress = process.env.VAULT_ADDRESS ?? "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";

  // Confirm Ward API is reachable before starting the long-running monitor.
  const healthRes = await fetch(`${WARD_API}/network/status`);
  const health    = (await healthRes.json()) as { network: string; ward_signed: false };
  console.log(`Ward API network : ${health.network}`);
  console.log(`ward_signed      : ${health.ward_signed}\n`);

  const monitor = new VaultMonitor({
    vaultAddresses: [vaultAddress],
    confirmCount:   DEFAULT_CONFIRM_COUNT,
  });

  monitor.onVerifiedDefault((event) => {
    console.log("\n=== VERIFIED DEFAULT (3 ledger closes) ===");
    console.log(`  Vault          : ${event.vaultAddress}`);
    console.log(`  Loan ID        : ${event.loanId}`);
    console.log(`  Health Ratio   : ${event.healthRatio.toFixed(4)}`);
    console.log(`  First Ledger   : ${event.firstLedgerIndex}`);
    console.log(`  Confirmed at   : ${event.confirmedLedger}`);
    console.log("==========================================\n");
  });

  console.log(`VaultMonitor watching: ${vaultAddress}`);
  console.log("Listening for XLS-66 default events. Ctrl+C to stop.\n");

  process.on("SIGINT", () => {
    console.log("\nStopping monitor...");
    monitor.stop();
    process.exit(0);
  });

  await monitor.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
