# Ward Protocol Starter

This folder is a minimal starter kit that exercises the hosted Ward API and the dashboard health endpoint on XRPL Altnet.

## Prereqs

- Python 3.12+

## Setup

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

## Run the examples

In a second terminal from the repo root:

```bash
python starter\python\flows.py
```

## What this demonstrates

- `register_vault()` (API stub response, unsigned-tx shape)
- `mint_policy_nft()` (API stub response, unsigned-tx shape)
- `file_claim()` (API stub response, 9-check claim flow shape)
- Dashboard health polling endpoint: `GET /dashboard/vault/{vault_id}/health`

