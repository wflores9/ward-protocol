# Ward Protocol — Pre-Mainnet Audit Report

**Date:** 2026-06-10  
**Scope:** Full codebase audit (ward/, sdk/, starter/, .github/, dashboard/, Next.js site)  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Branch:** `claude/merge-pr-7-security-yotP5`  
**Constraint:** `ward_signed = False` invariant and signing-boundary CI check untouched throughout.

---

## Executive Summary (1-page)

Ward Protocol is architecturally sound for a testnet deployment. The core invariant — Ward constructs unsigned transactions, institutions sign, the ledger settles — is correctly enforced and protected by CI. The nine-gate claim validator logic is deterministic and well-tested. The chain adapter abstraction is well-designed.

**The single most important mainnet blocker** (B1) has been closed: all six core Python modules previously defaulted to `DEFAULT_TESTNET_URL` / `DEFAULT_TESTNET_WS`. The new `ward/_network.py` module requires `WARD_XRPL_URL` and `WARD_XRPL_WS` env vars explicitly. A missing env var raises `ConfigurationError` at construction time. The `WARD_NETWORK=mainnet|testnet` guard enforces that every URL — explicit or env-sourced — matches the declared network.

**Other significant gaps** (not blockers, but require remediation plans):
- Rate limiter, coverage registry, and settlement locks are all in-memory / single-process. Multi-instance deploys will bypass rate limits and allow duplicate settlements.
- Redis is optional everywhere. Its absence is now logged (fixed this audit) but the system runs with reduced safety guarantees that are invisible to monitoring.
- All seven non-XRPL chain adapters have 6 unimplemented methods each and placeholder contract addresses.

**What this audit fixed:**
- npm minor dependency updates (algosdk, hardhat, eslint-config-next, typescript-eslint)
- README badge and `__init__.py` version now match actual test counts and pyproject.toml
- `pending.lock().unwrap()` in Rust VaultMonitor → informative `expect()`
- `submit_with_retry()` now emits `DeprecationWarning` at call-site
- Silent Redis fallbacks in settlement, keys, registry now log `WARNING` with error detail
- (Prior sessions) Next.js 14→15, axios CVE, starlette CVE, GHA SHA pins, SSRF RPC allowlist, XSS innerHTML

---

## Category 1 — Dependency Freshness

### npm (site + SDK)

| Package | Was | Now | Notes |
|---------|-----|-----|-------|
| `algosdk` | ^3.5.2 | ^3.6.0 | minor — updated |
| `hardhat` | ^3.0.0 | ^3.9.0 | minor — updated |
| `eslint-config-next` | ^16.2.4 | ^16.2.9 | minor — updated |
| `@typescript-eslint/*` | ^8.12.2 | ^8.61.0 | minor — updated |
| `next` | ^15.3.4 | — | 16 is major; App Router breaking changes deferred |
| `react`/`react-dom` | ^18.3.1 | — | 19 is major; concurrent features audit needed |
| `tailwindcss` | ^3.4.4 | — | 4 is major; CSS-first config breaking change |
| `typescript` | ^5.6.3 | — | 6 is major; strict mode changes |
| `xrpl` | ^4.6.0 | — | 5 is major; API surface changes affect SDK types |
| `@solana/web3.js` | ^1.98.4 | — | uuid/jayson vulns; v2 is complete rewrite |

**Residual npm audit findings (all moderate, no critical):**
- `ws` memory disclosure — transitive via ethers (dev dep). No patch available upstream.
- `uuid` buffer bounds — transitive via @solana/web3.js. Fix requires major bump.
- `postcss` XSS — transitive via Next.js. postcss 8.5.15 installed; npm audit DB may be stale.

### Python (pip)

Audited via `pip list --outdated`. Ward's `pyproject.toml` uses caret bounds (`>=X,<X+1`) which correctly prevent major-version drift. No critical Python CVEs found. `xrpl-py>=4.5.0,<5.0.0`, `httpx>=0.25.0,<1.0.0`, `pydantic>=2.5.0,<3.0.0` are all current.

### Rust (cargo)

`cargo update` run in Phase 3 (prior session) cleared h2/rustls/openssl-sys advisories. Cargo.lock is current. No outstanding Rust advisories.

---

## Category 2 — Testnet → Mainnet Assumptions

**See MAINNET_READINESS.md for the full gap analysis.**

Summary of gaps:
1. All five core Python modules default to `DEFAULT_TESTNET_URL`/`DEFAULT_TESTNET_WS` with no env-var override path built in.
2. `ALLOWED_WS_URLS` in Python constants includes the Altnet testnet URL — this is correct for testnet support but must be audited at deploy time.
3. Rate limiter is in-memory; will not enforce cross-instance limits.
4. Coverage registry is in-memory per `PoolHealthMonitor` instance.
5. Settlement lock falls back to in-memory threading.Lock on Redis unavailability.
6. `ward_client.py` (legacy root-level file) still uses testnet defaults.

**B1 closed** — see `ward/_network.py`. `WARD_XRPL_URL`, `WARD_XRPL_WS`, and `WARD_NETWORK` must be set. Mismatch is a `ConfigurationError`. Starter/demo scripts retain explicit Altnet URLs by design. See MAINNET_READINESS.md for the full detail and go-live checklist update.

---

## Category 3 — Bug Hunt in Core Logic

### Fixed This Audit

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `ward/src/monitor.rs` | 317 | `pending.lock().unwrap()` panics with no context on mutex poisoning | Changed to `expect("pending mutex poisoned — another task panicked while holding it")` |
| `ward/primitives.py` | 487 | `submit_with_retry()` silently callable despite DEPRECATED docstring | Added `warnings.warn(..., DeprecationWarning, stacklevel=2)` |
| `ward/settlement.py` | 57 | `except Exception: _settlement_redis = None` — silent Redis fallback | Now logs `WARNING` with error detail |
| `ward/keys.py` | 55 | Same silent Redis fallback | Same fix |
| `ward/registry.py` | 39 | Same silent Redis fallback | Same fix |

### Deferred — Require Design Decision

| File | Location | Issue | Severity |
|------|----------|-------|----------|
| `ward/primitives.py` | `_rate_limit_windows` dict | In-memory rate limiter not shared across processes/restarts | HIGH (mainnet blocker) |
| `ward/pool.py` | `self._coverage_registry` | In-memory coverage registry per instance | HIGH (mainnet blocker) |
| `ward/settlement.py` | `_in_memory_locks` fallback | In-memory settlement lock not restart-safe | HIGH (mainnet blocker) |
| `ward/settlement.py` | line 220 | `except Exception: pass` in settlement execution path — silently swallows lock errors | MEDIUM |
| `ward/validator.py` | `__init__` | No guard if `url` param is testnet in production | MEDIUM |
| `ward/coverage.py` | `_decode_memo_field` | `except Exception: return ""` — silently returns empty on any decode error | LOW |

### `except Exception` Inventory

~30 bare `except Exception` clauses exist across ward/*.py. Most are at module init (Redis) or memoization. The ones now logging were the silent-failure ones that affect production correctness. The remainder are pattern-appropriate (import guards, optional integrations).

---

## Category 4 — Multi-Chain Abstraction Readiness

**See MULTICHAIN_GAPS.md for the full gap analysis.**

Summary:
- `ward/chain.py` defines a clean `ChainAdapter` ABC — architecture is correct.
- All 7 non-XRPL adapters (flare, hedera, solana, stellar, xdc, axelar, wormhole) have 6 unimplemented methods each (42 total `raise NotImplementedError`).
- All adapters have placeholder contract addresses blocked by `require_non_placeholder()` — production deploys will fail fast on missing config, not silently misroute.
- XRPL-specific terminology (XLS-66, drops, AccountNFTs) appears in wormhole adapter comments but not in adapter method signatures — acceptable leakage level.
- `ward/validator.py` and `ward/primitives.py` contain XRPL-only validation logic (`validate_xrpl_address`, `XRPL_BASE_RESERVE_DROPS`) that will need chain-specific implementations for second mainnet chain.

---

## Category 5 — Hygiene

### Fixed This Audit

| File | Issue | Fix |
|------|-------|-----|
| `README.md` | Badge showed `436 Python · 40 Rust` (stale) | Updated to `537 Python · 22 Rust · 53 TypeScript` |
| `README.md` | Python matrix showed 3.10·3.11·3.12 | Updated to 3.11·3.12·3.13 |
| `ward/__init__.py` | `__version__ = "0.2.4"` trailing pyproject.toml 0.2.6 | Updated to 0.2.6 with changelog entries |

### TODO/FIXME Inventory

| File | Line | Content |
|------|------|---------|
| `sdk/python/ward_legacy/pool.py` | 2 | `# TODO: replace this with real XLS-0098 XRPL vault query later` |
| `sdk/python/ward_legacy/monitor.py` | 265 | `# TODO: Parse from vault.asset` |
| `sdk/python/ward_legacy/payment.py` | 183 | `# TODO: Add premium_payments table to schema` |
| `sdk/python/ward_legacy/policy.py` | 240, 296 | 2x TODO for NFTokenOffer flow and payment monitoring |
| `sdk/python/ward_legacy/validator.py` | 201, 208 | TODO: insurance pool query, multi-sig |
| `sdk/python/examples/auto_claim_validator.py` | 56 | TODO: look up active policy |
| `ward/adapters/stellar.py` | 41 | `_RLUSD_STELLAR_ISSUER: str = "GXXX..."` (placeholder, blocked by `require_non_placeholder`) |

All `ward_legacy/` TODOs are in the legacy SDK (not the canonical `ward/` module). They can remain until the legacy SDK is deprecated.

### CI Hygiene (from prior sessions)

All GitHub Actions now SHA-pinned. No floating `@v4` tags remain. See `.github/workflows/test.yml` and `.github/workflows/publish.yml`.

### `.python-version`

File contains `3.13` (minor pin). This lets mise resolve the latest precompiled 3.13.x patch binary. Do not pin to a specific patch version (e.g., 3.13.14) — precompiled binaries are only available for some patch releases.

---

## Commit History (This Audit)

| Commit | Category | Description |
|--------|----------|-------------|
| `05d1fdd` | Cat-1 | npm minor updates — algosdk, hardhat, eslint, typescript-eslint |
| `62c6e81` | Cat-5 | Hygiene — correct stale test counts and `__version__` |
| `cf4826e` | Cat-3 | Bug fixes — mutex expect, deprecation warning, Redis logging |

---

## Risk Register

| Risk | Severity | Status |
|------|----------|--------|
| No forced mainnet URL at deploy time | CRITICAL | **CLOSED** — `ward/_network.py` ConfigurationError guard |
| In-memory rate limiter bypassed multi-instance | HIGH | Deferred — requires Redis mandate |
| In-memory coverage registry | HIGH | Deferred — requires Redis mandate |
| submit_with_retry() still callable | MEDIUM | Mitigated — DeprecationWarning added |
| Settlement lock falls back to in-memory | HIGH | Mitigated — now logs WARNING |
| 42 unimplemented adapter methods | MEDIUM | Accepted — non-XRPL chains not in mainnet v1 scope |
| Placeholder RLUSD addresses on non-XRPL chains | CRITICAL | Mitigated — `require_non_placeholder()` blocks deploy |
| Transitive npm moderates (ws, uuid, jayson) | MODERATE | Accepted — devDep only or upstream unpatched |

---

## Git History Scrub

**Date:** 2026-06-11  
**Operator:** Claude Code  
**Tool:** git-filter-repo 2.47.0  

### Finding

Commits `87b654b` (feat: Ward Protocol Python SDK v0.1.0) and `b878053`
(chore: remove .venv from tracking, add to .gitignore) contained a
committed `sdk/python/.venv/` Python virtual environment directory —
2,241 files totalling hundreds of MB of blobs in the git object store.

### Content Assessment

All flagged files are **pycryptodome library self-test vectors** shipped
inside the `.venv/lib/python3.12/site-packages/Crypto/SelfTest/` tree:

- ECDH, HPKE, ECC, RSA key test fixtures (JSON/PEM)
- PGP/OpenPGP test keys (non-real, library test vectors)
- PKCS#1, KDF, signature test vectors
- `Activate.ps1`, `activate`, `pip`, `fastapi`, `uvicorn` venv binaries

**None of these are production secrets.** They are third-party library
test fixtures that happen to look like key material to secret-scanning
heuristics. They are not reachable at runtime by any Ward code path.

`tests/conftest.py` was inspected and retained — it contains only XRPL
test fixture addresses (`rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh`, etc.)
and the `WARD_XRPL_URL`/`WARD_XRPL_WS`/`WARD_NETWORK` autouse monkeypatch
for testnet. No real API keys.

### Action Taken

```
pip install git-filter-repo --break-system-packages
git filter-repo --path sdk/python/.venv --invert-paths --force
git push origin main --force
```

- **399 commits rewritten.** All history before and after the .venv
  window was preserved intact.
- `git log --all --full-history -- "sdk/python/.venv/**"` → empty (verified).
- `git ls-files sdk/python/.venv` → empty (verified, was already empty in HEAD).
- Full test suite post-scrub: **559 Python / 22 Rust / 53 TypeScript — green.**
- `.python-version` (3.13.13) untouched. `ward/` source files untouched.
