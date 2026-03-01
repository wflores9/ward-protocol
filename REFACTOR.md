# Ward Protocol Refactor

This document describes the protocol architecture refactor and the new `ward` package layout.

## Overview

The refactor introduces a root-level `ward/` package that provides reusable, protocol-focused primitives for XRPL operations. This separates:

- **Transaction building** – construct XRPL transactions without submitting
- **Chain reading** – read-only ledger/account queries
- **Monitoring** – vault and loan default monitoring

from the FastAPI application, SDK, and database layers.

## New Package Structure

```
ward/
├── __init__.py      # Package exports: TxBuilder, ChainReader, WardMonitor
├── tx_builder.py    # Build Payment, EscrowCreate, EscrowFinish, EscrowCancel
├── chain_reader.py  # AccountInfo, AccountObjects, AccountTx, LedgerEntry
└── monitor.py       # Vault balance monitoring (polling)

demo/
└── ward_demo.py     # Demo script for ward package
```

## Module Responsibilities

### `ward/tx_builder.py`

- Builds XRPL transaction objects (Payment, Escrow*)
- Does **not** submit; returns unsigned transactions
- `TxBuilder.payment()` – generic payment with optional memos
- `TxBuilder.escrow_create()` – generic escrow
- `TxBuilder.claim_escrow()` – Ward claim escrow (48h dispute window)
- `TxBuilder.escrow_finish()` / `escrow_cancel()` – escrow lifecycle

Use with `xrpl.transaction.submit_and_wait(tx, client, wallet)` for execution.

### `ward/chain_reader.py`

- Read-only chain access via `AsyncWebsocketClient`
- `ChainReader.get_account_balance()` – balance and sequence
- `ChainReader.verify_account_exists()` – existence check
- `ChainReader.get_account_objects()` – account-owned objects
- `ChainReader.get_escrows()` – escrow objects
- `ChainReader.get_account_transactions()` – recent txs

### `ward/monitor.py`

- `WardMonitor` – poll-based vault balance monitoring
- Add/remove vaults, register balance-change callbacks
- For full XLS-66 default detection, use `sdk/python/ward/monitor.XLS66Monitor` which subscribes to the ledger stream

## Integration Points

| Consumer | Uses |
|----------|------|
| `main.py` / API | `core/xrpl_client.py` (existing) – can optionally use `ward.ChainReader` for reads |
| `sdk/python/ward/` | Can import `ward.TxBuilder`, `ward.ChainReader` for shared logic |
| Scripts / demos | `ward` package directly |

## Migration Notes

- **Database migrations** – `database/migrations/` and `database/schema.sql` were removed in `refactor/protocol-architecture`; restore or replace as needed for your deployment.
- **SDK `ward` vs root `ward`** – `sdk/python/ward/` remains the full SDK (policy, escrow, premium, etc.). Root `ward/` is a lighter protocol layer. Consider consolidating or renaming if overlap grows.
- **Demo** – Run with:
  ```bash
  export XRPL_WEBSOCKET_URL="wss://s.altnet.rippletest.net:51233"
  python demo/ward_demo.py
  ```

## Future Work

- Add `ward/signer.py` for optional offline signing
- Add `ward/submitter.py` to wrap `submit_and_wait` with retries and error handling
- Integrate `ward.ChainReader` into `core/xrpl_client.py` for API health/stats
- Consider merging `ward/monitor.py` with `sdk/python/ward/monitor.py` or documenting clear separation
