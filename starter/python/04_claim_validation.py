"""
F·04 — Claim Validation
=======================
Runs the 9-step Ward Protocol claim validation against live XRPL state.

All 9 steps read directly from the XRPL ledger — no off-chain data trusted.
Returns a ValidationResult indicating whether the claim is approved and the
calculated payout amount.

    ward_signed = False   # ClaimValidator never signs anything

Usage:
    python starter/python/04_claim_validation.py

Prerequisites:
    pip install xrpl-py python-dotenv
    Fill in CLAIM_NFT_TOKEN_ID, VAULT_ADDRESS, CLAIM_LOAN_ID, POOL_ADDRESS in .env
"""

from __future__ import annotations

import asyncio
import os

from dotenv import load_dotenv

from ward import ClaimValidator, ValidationResult
from ward.constants import DEFAULT_TESTNET_URL

load_dotenv()

XRPL_URL   = os.getenv("XRPL_JSON_RPC_URL", DEFAULT_TESTNET_URL)
INST_ADDR  = os.getenv("INSTITUTION_ADDRESS", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh")
NFT_ID     = os.getenv("CLAIM_NFT_TOKEN_ID", "A" * 64)
VAULT_ADDR = os.getenv("VAULT_ADDRESS",  "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh")
LOAN_ID    = os.getenv("CLAIM_LOAN_ID",  "B" * 64)
POOL_ADDR  = os.getenv("POOL_ADDRESS",   "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh")


async def main() -> None:
    print("Ward Protocol — Claim Validation (9 steps)")
    print(f"  XRPL endpoint : {XRPL_URL}")
    print(f"  Claimant      : {INST_ADDR}")
    print(f"  NFT token ID  : {NFT_ID[:16]}…")
    print(f"  Defaulted vault: {VAULT_ADDR}")
    print(f"  Loan ID       : {LOAN_ID[:16]}…")
    print(f"  Pool address  : {POOL_ADDR}")
    print()

    validator = ClaimValidator(url=XRPL_URL)

    result: ValidationResult = await validator.validate_claim(
        claimant_address=INST_ADDR,
        nft_token_id=NFT_ID,
        defaulted_vault=VAULT_ADDR,
        loan_id=LOAN_ID,
        pool_address=POOL_ADDR,
    )

    print(f"  approved           : {result.approved}")
    print(f"  steps_passed       : {result.steps_passed} / 9")

    if result.approved:
        print(f"  claim_payout_drops : {result.claim_payout_drops:,}")
        print(f"  vault_loss_drops   : {result.vault_loss_drops:,}")
        print(f"  policy_coverage    : {result.policy_coverage_drops:,}")
        payout_xrp = result.claim_payout_drops / 1_000_000
        print(f"  payout (XRP)       : {payout_xrp:.6f} XRP")
        print()
        print("✓ Claim APPROVED — proceed to escrow settlement (F·05)")
    else:
        print(f"  rejection_reason   : {result.rejection_reason}")
        print()
        print("✗ Claim REJECTED — see rejection_reason above")

    # Demonstrate validate_drops guard (AV 2.14 — drops unit confusion)
    from ward.primitives import validate_drops, ValidationError
    print("\n--- validate_drops guard demonstration ---")
    for val, label in [(1_000_000, "1 XRP in drops"), (-1, "negative"), (1.5, "float XRP")]:
        try:
            validate_drops(val)
            print(f"  PASS : {label} ({val})")
        except ValidationError as exc:
            print(f"  REJECT : {label} ({val!r}) → {exc}")


if __name__ == "__main__":
    asyncio.run(main())
