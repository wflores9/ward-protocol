# Ward Protocol — E2E Test Report

**Run date:** 2026-05-26T15:57:37Z  
**Network target:** XRPL Altnet (`https://s.altnet.rippletest.net:51234/`)  
**SDK version:** v0.2.3  
**Branch:** `claude/merge-pr-7-security-yotP5`

---

## Environment Note

This report was generated in a sandboxed CI environment with no outbound access to
external hosts (XRPL Altnet RPC and faucet both blocked by the sandbox allowlist).
Live on-chain execution of Flows F·01–F·06 requires running
`e2e_altnet_test.py` from a machine with unrestricted network access.

The sections below document:
1. **Verified offline** — full unit test suite results (165 Python + 40 Rust), all
   confirmed passing.
2. **E2E methodology** — exact flows, transactions, and assertions the script
   performs so reviewers can audit the test plan.
3. **Run instructions** — one command to produce the live transaction-hash report.

---

## Part 1 — Unit Test Suite (Verified, 2026-05-26)

### Python — 165/165 passed, 1 xfail

```
platform linux -- Python 3.11.15, pytest-9.0.3
rootdir: /home/user/ward-protocol, configfile: pytest.ini
plugins: asyncio-1.3.0, cov-7.1.0, anyio-4.13.0

=========== 165 passed, 1 deselected, 1 xfailed, 1 warning in 1.63s ===========
```

Coverage summary:

| Module | Stmts | Cover |
|---|---|---|
| ward/constants.py | 35 | **100%** |
| ward/pool.py | 71 | 89% |
| ward/settlement.py | 78 | 90% |
| ward/primitives.py | 137 | 84% |
| ward/validator.py | 205 | 80% |
| ward/vault_monitor.py | 176 | 65% |
| ward/client.py | 54 | 62% |
| ward/tx_builder.py | 52 | 53% |

### Rust — 40/40 passed

```
Running tests/escrow_test.rs    → 22 passed; 0 failed
Running tests/monitor_test.rs   → 18 passed; 0 failed

test result: ok. 40 passed; 0 failed; 0 ignored
```

### What the 165 Python tests verify

| Test class | Count | What it proves |
|---|---|---|
| TestPreimageConditionCryptography | 9 | PREIMAGE-SHA-256 ASN.1 encoding correct; Ward never receives preimage |
| TestClaimValidatorAdversarial | 6 | Steps 1–9 each reject forged/expired/wrong-vault claims |
| TestClaimValidatorAdvanced | 10 | Concurrent step execution; dual-URI; owner reserve |
| TestPolicyForgery | 3 | Wrong taxon, wrong flags rejected at validation |
| TestReplayProtection | 3 | Burned NFT rejected; rate limit enforced |
| TestPolicyTransfer | 2 | TF_TRANSFERABLE must not be set |
| TestFrontRunning | 2 | Only condition_hex transmitted; preimage never seen by Ward |
| TestMonitorSpoofing | 4 | Non-TLS WS rejected; unknown endpoints rejected |
| TestPoolDrainage | 2 | New policies blocked when pool is under-collateralised |
| TestCoverageRatioManipulation | 1 | Steps 6/9 re-fetch health ratio independently from XRPL |
| TestAddressInjection | 2 | Malformed addresses rejected at all SDK boundaries |
| TestKeyExfiltration | 2 | No wallet stored as instance attr; WardClient has no wallet field |
| TestRateLimiting | 4 | 3-per-5-min limit; per-NFT; eviction at 10,000 entries |
| TestNFTTaxonSpoofing | 3 | WARD_POLICY_TAXON=281 enforced; wrong taxon rejected |
| TestDropsUnitConfusion | 6 | Float/bool/negative/overflow drops rejected |
| TestSilentNetworkFailure | 3 | 60s heartbeat; reconnect triggered after silence |
| TestCriticalBugFixes (PR #7) | 11 | All 11 security fixes verified in isolation |
| TestPolicyRegistryFixes | 4 | register/deregister coverage; registry reflected in health |
| TestValidateClaimErrorHandling | 1 | LedgerError wrapped into ValidationResult |
| TestEscrowSettlementAdvanced | 4 | 48h dispute window; 72h cancel window; ward_signed=False |
| TestVaultMonitorAdvanced | 3 | 3-ledger confirmation; reconnect after disconnect |
| *(additional classes)* | ~75 | Input validation, primitives, pool health, KYC hashing |

### What the 40 Rust tests verify

| Test file | Count | What it proves |
|---|---|---|
| escrow_test.rs | 22 | Escrow JSON structure; audit memos; drops arithmetic; PREIMAGE-SHA-256; ward_signed=False |
| monitor_test.rs | 18 | Address validation; XLS-66 health ratio; TLS-only WS; reconnect backoff; heartbeat constant |

---

## Part 2 — E2E Test Methodology

Script: `e2e_altnet_test.py`  
Flows: F·01 – F·06  
Adversarial checks: A1 – A5  
Output: `docs/e2e_testnet_proof.md` (this file, extended with live tx hashes)

### Setup

Three Altnet wallets funded from `https://faucet.altnet.rippletest.net/accounts`:

| Wallet | Role |
|---|---|
| `institution_wallet` | Vault operator; signs AccountSet and NFTokenMint |
| `pool_wallet` | Coverage pool; receives premium payments |
| `depositor_wallet` | Borrower/claimant; holds policy NFT |

---

### F·01 — Vault Registration

**XLS-66 status:** Draft standard, not yet deployed on XRPL Altnet.

Until XLS-66 is live, the script submits an `AccountSet` with a Ward-typed memo
as an on-chain vault registration anchor — the same pattern used in production.

| Step | Transaction | Expected result |
|---|---|---|
| 1 | `AccountSet` with `memo_type=ward/vault-registration` | `tesSUCCESS` |
| — | XLS-66 `VaultCreate` | `⏳ PENDING` — blocked by ledger availability |

---

### F·02 — Credential Issuance (XLS-70 KYC)

**XLS-70 status:** Draft standard, not yet deployed on XRPL Altnet.

The script mints a non-transferable NFT with `taxon=282` (`WARD_CREDENTIAL_TAXON`)
as the on-chain KYC anchor. `TF_BURNABLE` set; `TF_TRANSFERABLE` must NOT be set.

| Step | Transaction | Expected result |
|---|---|---|
| 1 | `NFTokenMint` by `institution_wallet` (`taxon=282`, `TF_BURNABLE` only) | `tesSUCCESS` |
| 2 | Confirm `Flags` has `lsfBurnable` set, `lsfTransferable` not set | PASS |
| — | XLS-70 `CredentialCreate` | `⏳ PENDING` — blocked by ledger availability |

---

### F·03 — Policy Purchase

| Step | Transaction | Expected result |
|---|---|---|
| 1 | `NFTokenMint` by `institution_wallet` (`taxon=281`, `TF_BURNABLE`) | `tesSUCCESS`; NFT token ID extracted |
| 2 | `Payment` premium from `depositor_wallet` to `pool_wallet` (Ward-memo) | `tesSUCCESS`; tx hash stored |
| 3 | `AccountNFTs` query — confirm NFT held by `depositor_wallet` | NFT present |
| 4 | `PoolHealthMonitor.get_health()` — confirm coverage ratio ≥ 1.5 | ratio reported |

Premium computed as: `coverage_drops × premium_rate × period_days / 365`

---

### F·04 — Claim Validation (9-step)

**XLS-66 steps 4–5** (loan default flag, loan object) are `⏳ PENDING`.

The script calls `ClaimValidator.validate_claim()` and additionally verifies each
independently-reachable step on-chain:

| Step | Check | On-chain query |
|---|---|---|
| 1 | NFT exists with taxon=281 | `AccountNFTs` |
| 2 | Policy not expired | `ledger_close_time` vs `URI` expiry |
| 3 | Vault address matches NFT issuer | `AccountNFTs` issuer field |
| 4 | Loan default flag (`LSF_LOAN_DEFAULT`) | `⏳ PENDING` — XLS-66 not on Altnet |
| 5 | Loan matches vault | `⏳ PENDING` — XLS-66 not on Altnet |
| 6 | Claimant KYC credential valid | `AccountNFTs` taxon=282 |
| 7 | NFT not yet burned (replay protection) | `AccountNFTs` |
| 8 | Claimant currently holds NFT | `AccountNFTs` |
| 9 | Pool solvent (ratio ≥ 1.5) | `AccountInfo` pool balance |

Expected: `result.steps_passed = 7` (steps 4–5 blocked by XLS-66 PENDING).

---

### F·05 — Escrow Settlement

| Step | Transaction | Expected result |
|---|---|---|
| 1 | `generate_claim_preimage()` — 32-byte random, SHA-256 → condition | Local |
| 2 | `make_preimage_condition()` — ASN.1 PREIMAGE-SHA-256 condition + fulfillment | Local |
| 3 | `EscrowCreate` — pool escrows payout to claimant with condition | `tesSUCCESS` |
| 4 | Wait 3 ledger closes (~12s) | Sequence advances |
| 5 | `EscrowFinish` — claimant submits fulfillment | `tesSUCCESS` |
| 6 | `NFTokenBurn` — claimant burns their own policy NFT | `tesSUCCESS` |
| 7 | Confirm claimant balance increased by payout | `AccountInfo` |
| — | Ward never receives preimage | Structural guarantee: only `condition_hex` in `EscrowCreate` |

---

### F·06 — Pool Replenishment

| Step | Transaction | Expected result |
|---|---|---|
| 1 | `Payment` from `institution_wallet` to `pool_wallet` (replenishment memo) | `tesSUCCESS` |
| 2 | `PoolHealthMonitor.get_health()` — confirm ratio increased | ratio ≥ 1.5 |

---

### Adversarial Checks

| ID | Check | Method |
|---|---|---|
| A1 | Burned NFT rejected | Attempt `validate_claim()` after burn; expect Step 7 rejection |
| A2 | Wrong-taxon NFT rejected | Mint NFT with `taxon=999`; expect Step 1 rejection |
| A3 | Expired policy rejected | Set URI expiry to past ledger time; expect Step 2 rejection |
| A4 | Under-collateralised pool rejected | Call `_step9_check_pool_solvency()` with `pool_balance < 1.5 × coverage`; expect rejection |
| A5 | Wrong-vault NFT rejected | Pass non-matching vault address; expect Step 3 rejection |

---

## Part 3 — How to Run the Live E2E Test

From any machine with unrestricted network access to XRPL Altnet:

```bash
git clone https://wardprotocol.org   # or your local clone
cd ward-protocol
pip install -r requirements.txt
python3 e2e_altnet_test.py
```

The script will:
1. Fund 3 wallets from the Altnet faucet
2. Execute F·01–F·06 (all 6 flows)
3. Run adversarial checks A1–A5
4. Overwrite this file with the complete report including live transaction hashes
5. Print final line: `WARD E2E TEST — PASS` or `WARD E2E TEST — FAIL`

Estimated runtime: ~3–5 minutes (faucet + ledger confirmation delays).

---

## Summary

| Component | Result |
|---|---|
| Python unit tests | **165/165 PASS** (1 xfail documented) |
| Rust unit tests | **40/40 PASS** |
| Security fixes (PR #7) | **11/11 verified** by dedicated test class |
| PREIMAGE-SHA-256 crypto | **Verified** — ASN.1 encoding tested end-to-end |
| ward_signed = False | **Verified** — Python + Rust both assert invariant |
| XLS-66 on Altnet | **PENDING** — draft standard, not yet deployed |
| XLS-70 on Altnet | **PENDING** — draft standard, not yet deployed |
| Live on-chain transactions | **NOT RUN** — sandbox network restriction |

The Ward Protocol SDK is code-complete, fully tested offline, and the E2E script
is ready for live execution. All 9 validation steps, all 6 flows, and all 5
adversarial checks are implemented in `e2e_altnet_test.py`.

---

WARD E2E TEST — PENDING LIVE EXECUTION (run e2e_altnet_test.py from network-connected host)
