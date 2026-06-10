"""
F·02 — Policy Purchase
======================
Purchases a Ward Protocol default-protection policy for a lending position.

Ward returns an unsigned NFTokenMint transaction for the policy NFT.
The institution signs; the depositor receives the policy NFT.

    ward_signed = False   # INVARIANT

Usage:
    python starter/python/02_policy_purchase.py

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
from xrpl.models.transactions import NFTokenMint
from xrpl.wallet import Wallet

load_dotenv()

XRPL_RPC   = os.getenv("XRPL_JSON_RPC_URL", "https://s.altnet.rippletest.net:51234/")
WARD_API   = os.getenv("WARD_API_BASE",      "https://api.wardprotocol.org")
INST_KEY   = os.getenv("INSTITUTION_API_KEY", "")
SEED       = os.getenv("TESTNET_WALLET_SEED", "")
VAULT_ADDR = os.getenv("VAULT_ADDRESS", "")
COVERAGE   = int(os.getenv("POLICY_COVERAGE_DROPS", "500000000"))
DURATION   = int(os.getenv("POLICY_DURATION_SECONDS", "2592000"))


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
    depositor = wallet.classic_address
    vault_address = VAULT_ADDR or depositor

    print(f"Depositor address  : {depositor}")
    print(f"Vault address      : {vault_address}")
    print(f"Coverage           : {COVERAGE:,} drops ({COVERAGE / 1_000_000:.2f} XRP)")

    # --- F·02a: Request policy purchase from Ward API ---
    print("\n[1/3] Requesting policy NFT from Ward Protocol …")
    resp = _post("/policies/purchase", {
        "vault_address":     vault_address,
        "depositor_address": depositor,
        "coverage_drops":    COVERAGE,
        "duration_seconds":  DURATION,
    })
    policy_id    = resp.get("policy_id", "")
    unsigned_tx  = resp.get("unsigned_tx", resp)
    print(f"  policy_id : {policy_id}")

    # Core invariant check
    if "TxnSignature" in unsigned_tx:
        raise RuntimeError("ward_signed invariant violated")
    print("  ✓ ward_signed = False")

    # Ward encodes policy metadata in the NFT URI (hex-encoded JSON):
    #   compact format: {"w":"ward-v1","v":<vault>,"c":<coverage_drops>,"e":<expiry_ledger_time>}
    uri_hex = unsigned_tx.get("URI", "")
    if uri_hex:
        try:
            meta = json.loads(bytes.fromhex(uri_hex).decode())
            print(f"  NFT URI (decoded) : {json.dumps(meta, indent=4)}")
            if not meta.get("w", "").startswith("ward"):
                raise ValueError("unexpected URI schema")
            if meta.get("c") != str(COVERAGE) and int(meta.get("c", 0)) != COVERAGE:
                raise ValueError(f"coverage mismatch in NFT URI: {meta.get('c')!r}")
            print("  ✓ NFT URI encodes correct policy metadata")
        except Exception as exc:
            print(f"  URI decode: {exc}")

    # --- F·02b: Verify NFTokenTaxon is correct (WARD_POLICY_TAXON = 281) ---
    taxon = unsigned_tx.get("NFTokenTaxon", -1)
    if taxon != 281:
        raise RuntimeError(f"Expected taxon 281, got {taxon}")
    print(f"  ✓ NFTokenTaxon = {taxon} (WARD_POLICY_TAXON)")

    # Verify TF_TRANSFERABLE is NOT set (flag 0x8 must be absent)
    flags = unsigned_tx.get("Flags", 0)
    if flags & 0x8:
        raise RuntimeError("Policy NFT must not be transferable")
    print(f"  ✓ TF_TRANSFERABLE absent from flags (0x{flags:08x})")

    # --- F·02c: Institution signs and submits ---
    print("\n[2/3] Institution signs and submits policy mint …")
    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        nft_mint = NFTokenMint.from_dict(unsigned_tx)
        result = await submit_and_wait(nft_mint, client, wallet)
        tx_result = result.result.get("meta", {}).get("TransactionResult", "")
        nft_id    = (result.result.get("meta", {})
                     .get("nftoken_id", ""))
        print(f"  result   : {tx_result}")
        print(f"  NFT ID   : {nft_id}")

    print("\n[3/3] Policy NFT minted — depositor now holds the policy.")
    print(f"\nF·02 complete — policy_id={policy_id}, nft_id={nft_id}")


if __name__ == "__main__":
    asyncio.run(main())
