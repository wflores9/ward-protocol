/**
 * Ward Protocol — Example 3: Escrow Settlement
 *
 * F·06  PREIMAGE-SHA-256 conditioned claim settlement.
 *
 * Complete flow:
 *   1. Claimant generates a 32-byte random preimage. Ward never sees it.
 *   2. Claimant derives the SHA-256 condition from the preimage.
 *   3. POST condition_hex (not the preimage) to /settlement/escrow.
 *   4. Ward returns an unsigned EscrowCreate. Pool operator signs. XRPL settles.
 *   5. Claimant submits EscrowFinish with fulfillment_hex to release payment.
 *
 * Core invariant: Ward never holds or sees the preimage.
 * ward_signed = false — always.
 *
 * Timing in production:
 *   FinishAfter  = ledger_time + ESCROW_DISPUTE_HOURS * 3600  (48 h)
 *   CancelAfter  = ledger_time + ESCROW_CANCEL_HOURS  * 3600  (72 h)
 *
 * This demo omits FinishAfter so the EscrowFinish can execute immediately
 * on Altnet without waiting 48 hours.
 *
 * API: https://api.wardprotocol.org
 * SDK: xrpl@4.6.0
 *
 * Usage:
 *   INSTITUTION_API_KEY=<key> npm run escrow-settlement
 */

import { createHash, randomBytes } from "crypto";
import { Client, xrpToDrops } from "xrpl";
import type { EscrowCreate, EscrowFinish } from "xrpl";

const WARD_API = "https://api.wardprotocol.org";
const XRPL_WS  = "wss://s.altnet.rippletest.net:51233/";

// Ripple epoch: seconds between Unix epoch (1970-01-01) and Ripple epoch (2000-01-01)
const RIPPLE_EPOCH = 946_684_800;

function rippleTimeNow(): number {
  return Math.floor(Date.now() / 1000) - RIPPLE_EPOCH;
}

// ── PREIMAGE-SHA-256 crypto ───────────────────────────────────────────────────
// Mirrors ward/primitives.py::make_preimage_condition.
// The ASN.1 DER encoding is defined in draft-thomas-crypto-conditions-04.

interface ConditionPair {
  conditionHex:   string;  // SHA-256 condition   — share with Ward + include in EscrowCreate
  fulfillmentHex: string;  // preimage fulfillment — NEVER share with Ward; submit only to EscrowFinish
}

function generatePreimage(): Buffer {
  return randomBytes(32);
}

function makeCondition(preimage: Buffer): ConditionPair {
  if (preimage.length !== 32) {
    throw new Error(`Preimage must be exactly 32 bytes; got ${preimage.length}`);
  }
  const digest = createHash("sha256").update(preimage).digest();

  // condition   : A0 25 | 80 20 <32-byte-digest> | 81 01 20
  const conditionBytes = Buffer.concat([
    Buffer.from([0xa0, 0x25, 0x80, 0x20]),
    digest,
    Buffer.from([0x81, 0x01, 0x20]),
  ]);

  // fulfillment : A0 22 | 80 20 <32-byte-preimage>
  const fulfillmentBytes = Buffer.concat([
    Buffer.from([0xa0, 0x22, 0x80, 0x20]),
    preimage,
  ]);

  return {
    conditionHex:   conditionBytes.toString("hex").toUpperCase(),
    fulfillmentHex: fulfillmentBytes.toString("hex").toUpperCase(),
  };
}

// ── Ward API types ────────────────────────────────────────────────────────────

interface EscrowApiResponse {
  ward_signed:       false;
  flow:              string;
  status?:           string;
  unsigned_tx_type?: string;
  finish_after?:     string;
  cancel_after?:     string;
  unsigned_tx?:      Partial<EscrowCreate>;
  note?:             string;
  params?:           object;
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

  // 1. Connect and fund two testnet wallets: pool operator and claimant.
  const client = new Client(XRPL_WS);
  await client.connect();
  console.log("Connected to XRPL Altnet\n");

  console.log("Funding pool wallet (faucet)...");
  const { wallet: poolWallet }     = await client.fundWallet();
  console.log("Funding claimant wallet (faucet)...");
  const { wallet: claimantWallet } = await client.fundWallet();
  console.log(`Pool      : ${poolWallet.classicAddress}`);
  console.log(`Claimant  : ${claimantWallet.classicAddress}\n`);

  // 2. Claimant generates a preimage and derives the SHA-256 condition.
  //    The raw preimage bytes are NEVER sent to Ward or included on-chain.
  const preimage = generatePreimage();
  const { conditionHex, fulfillmentHex } = makeCondition(preimage);

  console.log(`Condition  (safe to share) : ${conditionHex.slice(0, 20)}...`);
  console.log(`Fulfillment (keep secret)  : ${fulfillmentHex.slice(0, 20)}...\n`);

  // 3. POST condition_hex to Ward.  Ward builds the unsigned EscrowCreate.
  //    Ward receives only the condition — it cannot reconstruct the preimage.
  const claimId     = `claim-${Date.now()}`;
  const payoutDrops = Number(xrpToDrops("5")); // 5 XRP payout for this demo
  // In production, use the real policy NFT ID from the purchase step.
  const policyNftId = "A".repeat(64);

  console.log("Calling Ward F·06 /settlement/escrow...");
  const escrowResp = await wardPost<EscrowApiResponse>(
    "/settlement/escrow",
    {
      claim_id:         claimId,
      claimant_address: claimantWallet.classicAddress,
      coverage_drops:   payoutDrops,
      condition_hex:    conditionHex,
      policy_nft_id:    policyNftId,
    },
    apiKey,
  );

  if (escrowResp.ward_signed !== false) throw new Error("Protocol invariant violated");

  console.log(`\nF·06 settlement/escrow → flow=${escrowResp.flow}`);
  console.log(`  unsigned_tx_type : ${escrowResp.unsigned_tx_type ?? "(live mode)"}`);
  console.log(`  finish_after     : ${escrowResp.finish_after ?? "not set (immediate)"}`);
  console.log(`  cancel_after     : ${escrowResp.cancel_after ?? "not set"}`);
  console.log(`  ward_signed      : ${escrowResp.ward_signed}`);
  if (escrowResp.note) console.log(`  note             : ${escrowResp.note}`);

  // 4. Pool operator builds, signs, and submits the EscrowCreate.
  //    If Ward is in live mode, escrowResp.unsigned_tx is ready to sign.
  //    If Ward is in spec mode, we build the tx locally using the API params.
  const escrowCreateTx: EscrowCreate = escrowResp.unsigned_tx
    ? (escrowResp.unsigned_tx as EscrowCreate)
    : {
        TransactionType: "EscrowCreate",
        Account:         poolWallet.classicAddress,
        Destination:     claimantWallet.classicAddress,
        Amount:          String(payoutDrops),
        // Production: FinishAfter = rippleTimeNow() + 48 * 3600 (opens dispute window)
        // Demo:        omitted — escrow is immediately finishable on Altnet
        CancelAfter:     rippleTimeNow() + 72 * 3600,
        Condition:       conditionHex,
      };

  const preparedCreate           = await client.autofill(escrowCreateTx);
  const escrowSequence           = preparedCreate.Sequence!;
  const { tx_blob: createBlob }  = poolWallet.sign(preparedCreate);
  const createResult             = await client.submitAndWait(createBlob);
  const createMeta               = createResult.result.meta as { TransactionResult?: string };

  console.log(`\nEscrowCreate submitted:`);
  console.log(`  Hash     : ${createResult.result.hash}`);
  console.log(`  Result   : ${createMeta?.TransactionResult ?? "unknown"}`);
  console.log(`  Sequence : ${escrowSequence}  ← used in EscrowFinish.OfferSequence`);

  // 5. Claimant finishes the escrow by revealing the fulfillment (preimage).
  //    Ward's server is completely irrelevant from this point — XRPL enforces it.
  //    The claimant submits fulfillment_hex directly to the XRPL network.
  const escrowFinishTx: EscrowFinish = {
    TransactionType: "EscrowFinish",
    Account:         claimantWallet.classicAddress,
    Owner:           poolWallet.classicAddress,
    OfferSequence:   escrowSequence,
    Condition:       conditionHex,
    Fulfillment:     fulfillmentHex,
  };

  const preparedFinish           = await client.autofill(escrowFinishTx);
  const { tx_blob: finishBlob }  = claimantWallet.sign(preparedFinish);
  const finishResult             = await client.submitAndWait(finishBlob);
  const finishMeta               = finishResult.result.meta as { TransactionResult?: string };

  console.log(`\nEscrowFinish submitted (claimant reveals preimage):`);
  console.log(`  Hash   : ${finishResult.result.hash}`);
  console.log(`  Result : ${finishMeta?.TransactionResult ?? "unknown"}`);

  await client.disconnect();
  console.log("\nWard never saw the preimage. ward_signed = false — always.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
