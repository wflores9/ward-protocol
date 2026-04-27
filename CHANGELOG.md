# Changelog

All notable changes to the Ward Protocol SDK are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Ward Protocol SDK uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.2] — 2026-04-27

### Added
- `ripple_time_now()` and `get_ledger_close_time()` added to public `ward` namespace
- Full `__all__` in `ward/__init__.py` — all constants, errors, utilities explicit
- `conftest.py` — pytest-asyncio config + common XRPL address fixtures

### Changed
- `pyproject.toml` version bumped to `0.2.2`
- `pyproject.toml` now includes `[tool.setuptools.packages.find]` to correctly install the `ward/` package (was missing — `pip install ward-protocol` previously omitted the package)
- `pyproject.toml` coverage config moved to `[tool.coverage.*]` sections
- `pytest.ini` updated: `--cov=ward` only (was `--cov=ward_client --cov=ward`); `[run]` block removed (now in pyproject.toml)
- `REFACTOR.md` fully rewritten to document the v0.2.x hardening pass
- `README.md` rewritten to reflect v0.2.2 architecture, all 7 fixes, 3-tier licensing, updated code examples

---

## [0.2.1] — 2026-04-27

### Added
- `ward/validator.py` — `ClaimValidator`, `ValidationResult`  (Module 3)
- `ward/settlement.py` — `EscrowSettlement`, `EscrowRecord`  (Module 4)
- Both classes exported from `ward/__init__.py`

### Changed
- `ward/__init__.py` bumped to v0.2.1
- `ClaimValidator._parse_nft_metadata` supports both compact (`"w"/"v"/"c"/"e"`) and legacy (`"protocol"/"vault_address"`) URI key formats for backward compatibility

---

## [0.2.0] — 2026-04-27

### Added — Modular Refactor (fixes #1–#7)
- `ward/constants.py` — single source of truth for all constants, `LicenseTier`, `TIER_MINT_GATES`
- `ward/primitives.py` — `WardError`, `ValidationError`, `SecurityError`, `LedgerError`, `validate_wallet()`, `submit_with_retry()`, crypto helpers
- `ward/client.py` — `WardClient`  (Module 1, fixes #1 #2 #3 #6 #7)
- `ward/vault_monitor.py` — `VaultMonitor`, `VerifiedDefault`  (Module 2, fixes #1 #3 #5)
- `ward/pool.py` — `PoolHealthMonitor`, `PoolHealth`  (Module 5, fixes #1 #3 #7)

### Changed
- `ward/__init__.py` v0.2.0: exports all new classes and primitives
- `ward_client.py` converted to backward-compat deprecation shim (re-exports from `ward.*`)

### Fixed
- **#1** Extracted monolith into modules — independent auditability
- **#2** `wallet` parameter typed as `xrpl.wallet.Wallet`, validated at boundary
- **#3** `AsyncJsonRpcClient` used as async context manager — no leaked connections
- **#4** No long-lived `AsyncJsonRpcClient` stored as instance attribute
- **#5** `VaultMonitor` WebSocket reconnect loop with exponential backoff
- **#6** All submissions via `submit_with_retry` (handles `telINSUF_FEE_P`, `terRETRY`, `terQUEUED`, `terPRE_SEQ`)
- **#7** `active_coverage_drops` derived on-chain from `AccountNFTs` — not a caller parameter; owner reserve = `base_reserve + (OwnerCount × 2 XRP)`

### Security
- URI hex asserted ≤ 512 bytes before any network call
- License tier encoded in NFT URI metadata — policy is self-describing on-chain
- `TIER_MINT_GATES` enforced in `PoolHealthMonitor.is_minting_allowed()`

---

## [0.1.1] — 2026-03-15

### Added
- 95 unit tests passing
- 5 on-chain transactions confirmed on XRPL Altnet
- XRPLF Discussion #474 — open community engagement

### Changed
- `ward/` package restructured: `tx_builder.py`, `chain_reader.py`, `monitor.py`
- pyproject.toml keywords, classifiers, URLs updated

---

## [0.1.0] — 2026-02-01

### Added
- Initial Ward Protocol SDK — monolithic `ward_client.py`
- `WardClient` — purchase coverage, burn policy
- `VaultMonitor` — WebSocket default detection (3-ledger confirmation)
- `ClaimValidator` — 9-step adversarial-hardened claim validation
- `EscrowSettlement` — PREIMAGE-SHA-256 conditioned claim settlement
- `PoolHealthMonitor` — on-chain solvency and dynamic premium pricing
- XRPL Altnet testnet integration demo
- Ward Protocol specification (whitepaper, security notes)
