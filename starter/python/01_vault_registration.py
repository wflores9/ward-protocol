"""
F·01 — Vault Registration
=========================
Registers an XLS-66 lending vault with Ward Protocol.

Ward returns an unsigned NFTokenMint transaction (the vault policy NFT).
The institution signs and submits it; Ward never touches the signing key.

    ward_signed = False   # INVARIANT — never changes

Usage:
    python starter/python/01_vault_registration.py

Prerequisites:
    pip install xrpl-py python-dotenv
    cp .env.example .env  # fill in INSTITUTION_ADDRESS, TESTNET_WALLET_SEED
"""

from __future__ import annotations

import asyncio
import json
import os
import urllib.request
from typing import Any

from dotenv import load_dotenv
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.models.transactions import NFTokenMint
from xrpl.wallet import Wallet

load_dotenv()

XRPL_RPC   = os.getenv("XRPL_JSON_RPC_URL", "https://s.altnet.rippletest.net:51234/")
WARD_API   = os.getenv("WARD_API_BASE",      "https://api.wardprotocol.org")
INST_ADDR  = os.getenv("INSTITUTION_ADDRESS", "")
INST_KEY   = os.getenv("INSTITUTION_API_KEY", "")
SEED       = os.getenv("TESTNET_WALLET_SEED", "")


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
    if not INST_ADDR:
        print("Set INSTITUTION_ADDRESS in .env")
        return

    wallet = Wallet.from_seed(SEED) if SEED else Wallet.create()
    print(f"Institution address : {wallet.classic_address}")

    # --- F·01a: Register the vault with Ward Protocol ---
    print("\n[1/3] Registering vault with Ward Protocol …")
    reg = _post("/vaults", {
        "institution_address":  wallet.classic_address,
        "collateral_currency":  "XRP",
        "min_collateral_ratio": 1.5,
    })
    vault_id = reg.get("vault_id", reg.get("id", ""))
    print(f"  vault_id : {vault_id}")
    print(f"  response : {json.dumps(reg, indent=2)}")

    # --- F·01b: Retrieve unsigned NFTokenMint for the vault-policy NFT ---
    print("\n[2/3] Fetching unsigned vault registration transaction …")
    tx_resp = _post("/vaults/transaction", {"vault_id": vault_id,
                                             "account": wallet.classic_address})
    unsigned_tx: dict[str, Any] = tx_resp.get("unsigned_tx", tx_resp)

    # Core invariant: Ward must NOT set the signing fields
    assert "TxnSignature" not in unsigned_tx, "ward_signed invariant violated"
    assert "SigningPubKey" not in unsigned_tx or unsigned_tx.get("SigningPubKey") == "", \
        "ward_signed invariant violated"
    print("  ✓ ward_signed = False — unsigned transaction received")
    print(f"  TransactionType : {unsigned_tx.get('TransactionType')}")

    # --- F·01c: Institution signs and submits ---
    print("\n[3/3] Institution signs and submits to XRPL …")
    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        nft_mint = NFTokenMint.from_dict(unsigned_tx)
        result = await submit_and_wait(nft_mint, client, wallet)
        print(f"  result : {result.result.get('meta', {}).get('TransactionResult', 'unknown')}")
        print(f"  hash   : {result.result.get('hash', '')}")

    print("\nF·01 complete — vault registered, policy NFT minted on XRPL.")


if __name__ == "__main__":
    asyncio.run(main())
