/**
 * Ward Protocol — Example 1: Vault Registration
 *
 * F·01  Register an XLS-66 lending vault.
 * F·03  Purchase an XLS-20 NFT policy certificate.
 *
 * Ward returns unsigned XRPL transactions.
 * The institution signs them. XRPL settles.
 * ward_signed = false — always.
 *
 * API: https://api.wardprotocol.org
 * SDK: xrpl@4.6.0
 *
 * Usage:
 *   INSTITUTION_API_KEY=<key> npm run vault-registration
 */

import { Client, Wallet, dropsToXrp } from "xrpl";
import type { SubmittableTransaction } from "xrpl";

const WARD_API = "https://api.wardprotocol.org";
const XRPL_WS  = "wss://s.altnet.rippletest.net:51233/";

// ── Ward API response shapes ──────────────────────────────────────────────────

interface WardBase {
  ward_signed: false;
  flow:        string;
  status?:     string;
  note?:       string;
}

interface VaultRegisterResponse extends WardBase {
  unsigned_tx_type?: string;
  unsigned_tx?:      SubmittableTransaction;
  vault_id?:         string;
  params?:           object;
}

interface PolicyPurchaseResponse extends WardBase {
  unsigned_tx_type?: string;
  unsigned_tx?:      SubmittableTransaction;
  nft_token_id?:     string;
  premium_tx?:       string;
  coverage_drops?:   number;
  expiry_ledger?:    number;
  params?:           object;
}

interface HealthResponse {
  status:               string;
  version:              string;
  ward_signed:          false;
  ward_client_available: boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function wardGet<T>(path: string): Promise<T> {
  const res  = await fetch(`${WARD_API}${path}`);
  const data = (await res.json()) as T;
  if (!res.ok) throw new Error(`Ward API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function wardPost<T>(path: string, body: object, apiKey?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-Institution-Key"] = apiKey;
  const res  = await fetch(`${WARD_API}${path}`, {
    method:  "POST",
    headers,
    body:    JSON.stringify(body),
  });
  const data = (await res.json()) as T;
  if (!res.ok) throw new Error(`Ward API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.INSTITUTION_API_KEY;

  // 1. Connect to XRPL Altnet and fund a demo wallet from the faucet.
  //    In production, load wallet from your own key management system.
  const client = new Client(XRPL_WS);
  await client.connect();
  console.log("Connected to XRPL Altnet\n");

  console.log("Requesting faucet wallet (may take ~10 s)...");
  const { wallet, balance } = await client.fundWallet();
  console.log(`Institution address : ${wallet.classicAddress}`);
  console.log(`Balance             : ${dropsToXrp(String(balance))} XRP\n`);

  // 2. Confirm the Ward hosted API is reachable.
  const health = await wardGet<HealthResponse>("/health");
  console.log(`Ward API : ${health.status} (v${health.version})`);
  console.log(`Live mode: ${health.ward_client_available}\n`);

  // 3. F·01 — register vault
  //    Ward constructs an unsigned VaultCreate (XLS-66).
  //    Pool signs and submits it; XRPL settles. Ward never touches the key.
  console.log("F·01 register_vault...");
  const vaultResp = await wardPost<VaultRegisterResponse>(
    "/vaults",
    {
      institution_address:  wallet.classicAddress,
      collateral_currency:  "XRP",
      min_collateral_ratio: 1.5,
    },
    apiKey,
  );

  // Invariant enforced by the protocol: ward_signed is ALWAYS false.
  if (vaultResp.ward_signed !== false) throw new Error("Protocol invariant violated");

  console.log(`  flow             : ${vaultResp.flow}`);
  console.log(`  unsigned_tx_type : ${vaultResp.unsigned_tx_type ?? "(live tx)"}`);
  console.log(`  ward_signed      : ${vaultResp.ward_signed}`);
  if (vaultResp.note) console.log(`  note             : ${vaultResp.note}`);

  if (vaultResp.unsigned_tx) {
    // Ward returned a ready-to-sign tx (live-mode path).
    // Autofill fills in fee, sequence, and last_ledger_sequence.
    const prepared           = await client.autofill(vaultResp.unsigned_tx);
    const { tx_blob }        = wallet.sign(prepared);
    const result             = await client.submitAndWait(tx_blob);
    const txResult           = (result.result.meta as { TransactionResult?: string })
                                 ?.TransactionResult ?? "unknown";
    console.log(`  submitted hash   : ${result.result.hash}`);
    console.log(`  result           : ${txResult}`);
  }

  // 4. F·03 — purchase a policy NFT
  //    Ward returns an unsigned NFTokenMint (XLS-20, TF_BURNABLE only —
  //    non-transferable by design). Depositor signs and submits.
  console.log("\nF·03 purchase_policy...");
  const policyResp = await wardPost<PolicyPurchaseResponse>(
    "/policies/purchase",
    {
      vault_id:          wallet.classicAddress,
      depositor_address: wallet.classicAddress,
      coverage_drops:    10_000_000,   // 10 XRP coverage
      duration_days:     90,
      premium_bps:       50,
    },
    apiKey,
  );

  if (policyResp.ward_signed !== false) throw new Error("Protocol invariant violated");

  console.log(`  flow             : ${policyResp.flow}`);
  console.log(`  unsigned_tx_type : ${policyResp.unsigned_tx_type ?? "(live tx)"}`);
  console.log(`  ward_signed      : ${policyResp.ward_signed}`);
  if (policyResp.note) console.log(`  note             : ${policyResp.note}`);

  if (policyResp.unsigned_tx) {
    const prepared    = await client.autofill(policyResp.unsigned_tx);
    const { tx_blob } = wallet.sign(prepared);
    const result      = await client.submitAndWait(tx_blob);
    const meta        = result.result.meta as { TransactionResult?: string; nftoken_id?: string };
    console.log(`  submitted hash   : ${result.result.hash}`);
    console.log(`  result           : ${meta?.TransactionResult ?? "unknown"}`);
    if (meta?.nftoken_id) console.log(`  nft_token_id     : ${meta.nftoken_id}`);
  }

  await client.disconnect();
  console.log("\nWard never signed anything. ward_signed = false — always.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
