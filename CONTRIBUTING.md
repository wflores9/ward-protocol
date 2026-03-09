# Contributing to Ward Protocol

Ward is a **software specification** for default protection on XLS-66 XRPL lending vaults.

Core rule: Ward **never** signs or submits transactions. Every mutation returns an unsigned transaction prepared for institutional signing.

## Architectural Layers

- **`ward/`** directory — Protocol primitives (Discussion #474 specification layer)
  - `TxBuilder`: Constructs precise, compliant unsigned transactions
  - `ChainReader`: Typed wrappers for ledger state queries
  - `WardMonitor`: Structured logging + WebSocket event handling
  - **Invariant**: No signing, no submission, no wallet keys in this layer

- **`ward_client.py`** — Reference integration SDK (full end-to-end convenience)
  - Async client implementing complete flows with `submit_and_wait`
  - 75/75 tests passing, proven via real testnet transactions (see `testnet_proof.md`)
  - Intended for: demos, rapid prototyping, reference implementation
  - Production usage: institutions should replace signing/submission with their own secure key management

## Contribution Guidelines

- Protocol / spec changes → modify `ward/` and sync to XRPLF Discussion #474
- SDK, demo, test, or documentation improvements → target `ward_client.py`, `demo/`, `tests/`, etc.
- `ward/` must remain signing-free at all times
- Always run `pytest` before pushing (keep 75/75 green)
- Use conventional commits (fix:, feat:, docs:, refactor:, etc.)

## Related

- XRPLF Discussion #474: github.com/XRPLF/XRPL-Standards/discussions/474
- On-chain proof: `testnet_proof.md`

Questions? Open an issue or reach out at wflores@wardprotocol.org
