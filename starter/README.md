# Ward Protocol Starter

Minimal starter kit that exercises the hosted Ward API and XRPL Altnet.
Available in Python and TypeScript.

---

## Python

### Prereqs

- Python 3.12+

### Setup

1. From the repo root, create a virtualenv and install deps:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

2. Create `.env` from `.env.example` (repo root):

```bash
copy .env.example .env
```

3. Start the API locally:

```bash
cd sdk\python
uvicorn main:app --reload --port 8000
```

### Run

In a second terminal from the repo root:

```bash
python starter\python\flows.py
```

### What this demonstrates

- `register_vault()` (API stub response, unsigned-tx shape)
- `mint_policy_nft()` (API stub response, unsigned-tx shape)
- `file_claim()` (API stub response, 9-check claim flow shape)
- Dashboard health polling endpoint: `GET /dashboard/vault/{vault_id}/health`

---

## TypeScript

### Prereqs

- Node.js 18+ (native `fetch` required)
- npm

### Setup

```bash
cd starter\typescript
npm install
```

Copy the root `.env.example` and fill in your key (optional — the hosted API
works without a key in spec mode):

```bash
copy ..\.env.example .env
# set INSTITUTION_API_KEY=your_key   (optional)
# set VAULT_ADDRESS=rYourVaultAddress (for vault-monitor only)
```

### Run

| Example | Command | What it does |
|---------|---------|--------------|
| Vault registration | `npm run vault-registration` | F·01 vault register + F·03 policy purchase via Ward API |
| VaultMonitor | `npm run vault-monitor` | WebSocket ledger subscription, 3-ledger default confirmation |
| Escrow settlement | `npm run escrow-settlement` | Generate PREIMAGE-SHA-256 condition, build + submit EscrowCreate + EscrowFinish |

### What this demonstrates

- **01-vault-registration.ts** — Calls `POST /vaults` and `POST /policies/purchase` on the
  Ward hosted API (`api.wardprotocol.org`). Shows how to sign and submit the returned unsigned
  transaction with xrpl.js. `ward_signed = false` invariant asserted at runtime.

- **02-vault-monitor.ts** — Connects to XRPL Altnet via WebSocket, subscribes to vault accounts
  and the ledger stream, detects `LSF_LOAN_DEFAULT` flag changes in transaction metadata, and
  fires `onVerifiedDefault` only after `DEFAULT_CONFIRM_COUNT` (3) consecutive ledger closes.
  Reconnects automatically with exponential back-off (1 s → 60 s).

- **03-escrow-settlement.ts** — Generates a 32-byte random preimage locally, derives the
  PREIMAGE-SHA-256 condition, POSTs only the condition to `POST /settlement/escrow`, then
  builds, signs, and submits the `EscrowCreate` (pool) and `EscrowFinish` (claimant) on Altnet.
  Ward never sees the preimage; `ward_signed = false` throughout.

