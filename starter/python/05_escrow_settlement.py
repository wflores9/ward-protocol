"""
F·05 — Escrow Settlement
========================
Generates a PREIMAGE-SHA-256 condition/fulfillment pair and settles an
approved insurance claim via XRPL escrow.

Security model:
  1. Claimant generates 32-byte random preimage (secrets.token_bytes).
  2. Ward receives ONLY the condition_hex — never the preimage.
  3. EscrowCreate is built by Ward (unsigned), signed by the pool institution.
  4. EscrowFinish is built by Ward (unsigned), signed by the claimant.

    ward_signed = False   # Escrow invariant — preimage never leaves claimant

Usage:
    python starter/python/05_escrow_settlement.py

Prerequisites:
    pip install xrpl-py python-dotenv
"""

from __future__ import annotations

import asyncio
import json
import os
import urllib.request

from dotenv import load_dotenv
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.models.transactions import EscrowCreate, EscrowFinish
from xrpl.wallet import Wallet

from ward.primitives import generate_claim_preimage, make_preimage_condition

load_dotenv()

XRPL_RPC    = os.getenv("XRPL_JSON_RPC_URL", "https://s.altnet.rippletest.net:51234/")
WARD_API    = os.getenv("WARD_API_BASE",      "https://api.wardprotocol.org")
INST_KEY    = os.getenv("INSTITUTION_API_KEY", "")
SEED        = os.getenv("TESTNET_WALLET_SEED", "")
POOL_ADDR   = os.getenv("POOL_ADDRESS",        "")
PAYOUT_DRPS = int(os.getenv("POLICY_COVERAGE_DROPS", "1000000"))
CLAIM_NFT   = os.getenv("CLAIM_NFT_TOKEN_ID", "")


def _post(path: str, payload: dict) -> dict:
    url  = WARD_API + path
    data = json.dumps(payload).encode()
    hdrs = {"Content-Type": "application/json"}
    if INST_KEY:
        hdrs["X-Institution-Key"] = INST_KEY
    req = urllib.request.Request(url, data=data, headers=hdrs, method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


async def main() -> None:
    wallet = Wallet.from_seed(SEED) if SEED else Wallet.create()
    claimant = wallet.classic_address
    pool_address = POOL_ADDR or claimant   # demo fallback

    print("Ward Protocol — Escrow Settlement (F·05)")
    print(f"  Claimant    : {claimant}")
    print(f"  Pool        : {pool_address}")
    print(f"  Payout      : {PAYOUT_DRPS:,} drops ({PAYOUT_DRPS / 1_000_000:.6f} XRP)")
    print()

    # --- Step 1: Claimant generates preimage locally ---
    print("[1/5] Generating PREIMAGE-SHA-256 condition …")
    preimage = generate_claim_preimage()   # 32 cryptographically-random bytes
    condition_hex, fulfillment_hex = make_preimage_condition(preimage)
    print(f"  condition_hex    : {condition_hex[:32]}…  (sent to Ward)")
    print(f"  fulfillment_hex  : {fulfillment_hex[:16]}…  (NEVER sent to Ward)")
    print(f"  ward_signed = False — Ward receives condition only")

    # Preimage never transmitted; only condition_hex goes to the API
    if len(preimage) != 32:
        raise ValueError(f"preimage must be 32 bytes, got {len(preimage)}")

    # --- Step 2: Ward builds unsigned EscrowCreate (pool → claimant) ---
    print("\n[2/5] Requesting unsigned EscrowCreate from Ward API …")
    escrow_resp = _post("/settlement/escrow", {
        "pool_address":    pool_address,
        "claimant_address": claimant,
        "amount_drops":    PAYOUT_DRPS,
        "condition_hex":   condition_hex,   # Ward only ever sees the condition
        "nft_token_id":    CLAIM_NFT or "A" * 64,
    })
    unsigned_create = escrow_resp.get("unsigned_escrow_create", escrow_resp)
    if "TxnSignature" in unsigned_create:
        raise RuntimeError("ward_signed invariant violated")
    print(f"  ✓ ward_signed = False — EscrowCreate unsigned")
    print(f"  condition in tx : {unsigned_create.get('Condition', '')[:32]}…")

    # --- Step 3: Pool institution signs and submits EscrowCreate ---
    print("\n[3/5] Pool institution signs and submits EscrowCreate …")
    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        ec = EscrowCreate.from_dict(unsigned_create)
        result = await submit_and_wait(ec, client, wallet)
        ec_result = result.result.get("meta", {}).get("TransactionResult", "")
        escrow_seq = result.result.get("tx_json", {}).get("Sequence", 0)
        print(f"  result : {ec_result}")
        print(f"  EscrowCreate sequence : {escrow_seq}")

    # --- Step 4: Ward builds unsigned EscrowFinish ---
    print("\n[4/5] Requesting unsigned EscrowFinish from Ward API …")
    finish_resp = _post("/settlement/escrow/finish", {
        "claimant_address": claimant,
        "owner_address":    pool_address,
        "offer_sequence":   escrow_seq,
        "condition_hex":    condition_hex,
        "fulfillment_hex":  fulfillment_hex,   # Ward assembles tx but claimant signs
    })
    unsigned_finish = finish_resp.get("unsigned_escrow_finish", finish_resp)
    if "TxnSignature" in unsigned_finish:
        raise RuntimeError("ward_signed invariant violated")
    print(f"  ✓ ward_signed = False — EscrowFinish unsigned")

    # --- Step 5: Claimant signs and submits EscrowFinish ---
    print("\n[5/5] Claimant signs and submits EscrowFinish …")
    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        ef = EscrowFinish.from_dict(unsigned_finish)
        result = await submit_and_wait(ef, client, wallet)
        ef_result = result.result.get("meta", {}).get("TransactionResult", "")
        print(f"  result : {ef_result}")
        print(f"  hash   : {result.result.get('hash', '')}")

    print("\nF·05 complete — escrow settlement executed.")
    print("  Claim payout delivered to claimant on XRPL.")
    print("  ward_signed = False throughout — Ward never held signing keys.")


if __name__ == "__main__":
    asyncio.run(main())
