"""
F·06 — Full Lifecycle (End-to-End Demo)
========================================
Demonstrates the complete Ward Protocol lifecycle on XRPL Testnet:

  F·01  Vault registration  → unsigned NFTokenMint (vault policy)
  F·02  Policy purchase     → unsigned NFTokenMint (deposit policy NFT)
  F·03  Vault monitoring    → WebSocket subscription (short demo, then stop)
  F·04  Claim validation    → 9-step on-chain check
  F·05  Escrow settlement   → PREIMAGE-SHA-256 EscrowCreate + EscrowFinish

    ward_signed = False   # Invariant throughout entire lifecycle

This script runs steps F·01–F·02 and F·04–F·05 end-to-end and shows a brief
VaultMonitor connection for F·03. In production, F·03 runs as a long-lived
daemon that triggers F·04–F·05 automatically on default confirmation.

Usage:
    python starter/python/06_full_lifecycle.py

Prerequisites:
    pip install xrpl-py python-dotenv
    Set TESTNET_WALLET_SEED (or a fresh wallet is auto-generated).
"""

from __future__ import annotations

import asyncio
import json
import os
import urllib.request

from dotenv import load_dotenv
from xrpl.asyncio.clients import AsyncJsonRpcClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.models.transactions import EscrowCreate, EscrowFinish, NFTokenMint
from xrpl.wallet import Wallet

from ward import ClaimValidator, VaultMonitor, VerifiedDefault
from ward.constants import (
    DEFAULT_TESTNET_URL,
    DEFAULT_TESTNET_WS,
    WARD_POLICY_TAXON,
    TF_TRANSFERABLE,
)
from ward.primitives import generate_claim_preimage, make_preimage_condition, validate_drops

load_dotenv()

XRPL_RPC = os.getenv("XRPL_JSON_RPC_URL", DEFAULT_TESTNET_URL)
XRPL_WS  = os.getenv("XRPL_WS_URL",       DEFAULT_TESTNET_WS)
WARD_API = os.getenv("WARD_API_BASE",      "https://api.wardprotocol.org")
INST_KEY = os.getenv("INSTITUTION_API_KEY", "")
SEED     = os.getenv("TESTNET_WALLET_SEED", "")


def _post(path: str, payload: dict) -> dict:
    url  = WARD_API + path
    data = json.dumps(payload).encode()
    hdrs = {"Content-Type": "application/json"}
    if INST_KEY:
        hdrs["X-Institution-Key"] = INST_KEY
    req = urllib.request.Request(url, data=data, headers=hdrs, method="POST")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def banner(title: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


async def step_vault_registration(wallet: Wallet) -> str:
    banner("F·01 — Vault Registration")
    resp = _post("/vaults", {
        "institution_address":  wallet.classic_address,
        "collateral_currency":  "XRP",
        "min_collateral_ratio": 1.5,
    })
    vault_id = resp.get("vault_id", resp.get("id", "demo-vault"))
    print(f"  vault_id : {vault_id}")

    tx_resp = _post("/vaults/transaction", {"vault_id": vault_id,
                                             "account": wallet.classic_address})
    unsigned_tx = tx_resp.get("unsigned_tx", tx_resp)
    if "TxnSignature" in unsigned_tx:
        raise RuntimeError("ward_signed violated")
    print(f"  ✓ ward_signed = False")

    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        result = await submit_and_wait(NFTokenMint.from_dict(unsigned_tx), client, wallet)
        print(f"  result : {result.result.get('meta', {}).get('TransactionResult', 'ok')}")

    return vault_id


async def step_policy_purchase(wallet: Wallet, vault_address: str) -> str:
    banner("F·02 — Policy Purchase")
    resp = _post("/policies/purchase", {
        "vault_address":     vault_address,
        "depositor_address": wallet.classic_address,
        "coverage_drops":    500_000_000,
        "duration_seconds":  2_592_000,
    })
    policy_id   = resp.get("policy_id", "demo-policy")
    unsigned_tx = resp.get("unsigned_tx", resp)

    # Invariant checks
    if "TxnSignature" in unsigned_tx:
        raise RuntimeError("ward_signed violated")
    if unsigned_tx.get("NFTokenTaxon") != WARD_POLICY_TAXON:
        raise RuntimeError(f"wrong taxon: expected {WARD_POLICY_TAXON}, got {unsigned_tx.get('NFTokenTaxon')}")
    if unsigned_tx.get("Flags", 0) & TF_TRANSFERABLE:
        raise RuntimeError("TF_TRANSFERABLE must be absent")
    print(f"  policy_id : {policy_id}")
    print(f"  ✓ NFTokenTaxon = {WARD_POLICY_TAXON} (WARD_POLICY_TAXON)")
    print(f"  ✓ TF_TRANSFERABLE absent")
    print(f"  ✓ ward_signed = False")

    nft_id = ""
    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        result = await submit_and_wait(NFTokenMint.from_dict(unsigned_tx), client, wallet)
        nft_id = result.result.get("meta", {}).get("nftoken_id", "")
        print(f"  result : {result.result.get('meta', {}).get('TransactionResult', 'ok')}")
        print(f"  nft_id : {nft_id}")

    return nft_id


async def step_vault_monitor_demo(vault_address: str) -> None:
    banner("F·03 — VaultMonitor (brief demo)")
    print(f"  Connecting to {XRPL_WS} …")
    monitor = VaultMonitor(vault_addresses=[vault_address], websocket_url=XRPL_WS)

    @monitor.on_verified_default
    async def handle(event: VerifiedDefault) -> None:
        print(f"  DEFAULT CONFIRMED: {event.vault_address} / {event.loan_id}")

    # Run monitor for 5 seconds then stop (demo only; production runs indefinitely)
    async def _stop_after():
        await asyncio.sleep(5)
        await monitor.stop()

    await asyncio.gather(monitor.run(), _stop_after())
    print("  VaultMonitor demo complete (5 s). In production, runs indefinitely.")


async def step_claim_validation(
    wallet: Wallet, nft_id: str, vault_address: str, loan_id: str, pool_address: str
) -> bool:
    banner("F·04 — Claim Validation (9 steps)")
    validator = ClaimValidator(url=XRPL_RPC)
    result = await validator.validate_claim(
        claimant_address=wallet.classic_address,
        nft_token_id=nft_id or "A" * 64,
        defaulted_vault=vault_address,
        loan_id=loan_id or "B" * 64,
        pool_address=pool_address,
    )
    print(f"  approved      : {result.approved}")
    print(f"  steps_passed  : {result.steps_passed} / 9")
    if result.approved:
        print(f"  payout_drops  : {result.claim_payout_drops:,}")
        print(f"  ✓ Claim approved — proceeding to escrow")
    else:
        print(f"  reason        : {result.rejection_reason}")
    return result.approved


async def step_escrow_settlement(wallet: Wallet, pool_address: str, payout: int) -> None:
    banner("F·05 — Escrow Settlement")

    validate_drops(payout)   # AV 2.14 guard — ensure integer drops

    preimage = generate_claim_preimage()
    condition_hex, fulfillment_hex = make_preimage_condition(preimage)
    print(f"  condition_hex   : {condition_hex[:32]}…")
    print(f"  fulfillment_hex : (held locally — never sent to Ward)")
    print(f"  ✓ ward_signed = False — preimage stays with claimant")

    escrow_resp = _post("/settlement/escrow", {
        "pool_address":     pool_address,
        "claimant_address": wallet.classic_address,
        "amount_drops":     payout,
        "condition_hex":    condition_hex,
    })
    unsigned_create = escrow_resp.get("unsigned_escrow_create", escrow_resp)
    if "TxnSignature" in unsigned_create:
        raise RuntimeError("ward_signed violated")

    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        ec_result = await submit_and_wait(EscrowCreate.from_dict(unsigned_create), client, wallet)
        ec_seq    = ec_result.result.get("tx_json", {}).get("Sequence", 0)
        print(f"  EscrowCreate : {ec_result.result.get('meta', {}).get('TransactionResult', 'ok')}")

    finish_resp = _post("/settlement/escrow/finish", {
        "claimant_address": wallet.classic_address,
        "owner_address":    pool_address,
        "offer_sequence":   ec_seq,
        "condition_hex":    condition_hex,
        "fulfillment_hex":  fulfillment_hex,
    })
    unsigned_finish = finish_resp.get("unsigned_escrow_finish", finish_resp)
    if "TxnSignature" in unsigned_finish:
        raise RuntimeError("ward_signed violated")

    async with AsyncJsonRpcClient(XRPL_RPC) as client:
        ef_result = await submit_and_wait(EscrowFinish.from_dict(unsigned_finish), client, wallet)
        print(f"  EscrowFinish : {ef_result.result.get('meta', {}).get('TransactionResult', 'ok')}")

    print(f"\n  ✓ {payout:,} drops delivered to claimant on XRPL")
    print(f"  ward_signed = False throughout — Ward never held signing keys")


async def main() -> None:
    print("Ward Protocol — Full Lifecycle Demo (F·01 – F·05)")
    print("ward_signed = False  |  XRPL Testnet  |  XLS-66 + XLS-20")

    wallet = Wallet.from_seed(SEED) if SEED else Wallet.create()
    print(f"\n  Institution address : {wallet.classic_address}")

    vault_address = os.getenv("VAULT_ADDRESS", wallet.classic_address)
    pool_address  = os.getenv("POOL_ADDRESS",  wallet.classic_address)
    loan_id       = os.getenv("CLAIM_LOAN_ID", "B" * 64)

    # F·01
    vault_id = await step_vault_registration(wallet)

    # F·02
    nft_id = await step_policy_purchase(wallet, vault_address)

    # F·03 (brief demo)
    await step_vault_monitor_demo(vault_address)

    # F·04
    approved = await step_claim_validation(wallet, nft_id, vault_address, loan_id, pool_address)

    # F·05 (only if F·04 approved, or run unconditionally in demo mode)
    payout = int(os.getenv("POLICY_COVERAGE_DROPS", "1000000"))
    await step_escrow_settlement(wallet, pool_address, payout)

    banner("Lifecycle Complete")
    print("  F·01  Vault registered    ✓")
    print("  F·02  Policy minted       ✓")
    print("  F·03  Monitor connected   ✓")
    print(f"  F·04  Claim validated     {'✓' if approved else '✗ (expected on testnet)'}")
    print("  F·05  Escrow settled      ✓")
    print()
    print("  ward_signed = False — invariant held throughout.")


if __name__ == "__main__":
    asyncio.run(main())
