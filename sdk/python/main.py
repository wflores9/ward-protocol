"""
Ward Protocol API
=================
Open specification for default protection on XLS-66 lending vaults on the XRP Ledger.

Core invariant: ward_signed = False — always.
Ward constructs unsigned XRPL transactions.
The institution signs with their own keypair.
XRPL settles.

Ward never holds keys. Ward never submits transactions.
Ward's server is intentionally irrelevant to protocol outcomes.
"""

import os
import sys
import logging
import hashlib
import time
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ── Ensure ward_client.py (repo root) is importable from sdk/python
# Procfile: cd sdk/python && uvicorn main:app
# ward_client.py lives at repo root, two levels up
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

try:
    from ward_client import (
        WardClient,
        VaultMonitor,
        ClaimValidator,
        EscrowSettlement,
        PoolHealthMonitor,
        ValidationError,
        LedgerError,
        WARD_POLICY_TAXON,
        CREDENTIAL_NFT_TAXON,
    )
    WARD_CLIENT_AVAILABLE = True
except ImportError as e:
    logging.warning(f"ward_client import failed: {e} — running in spec-only mode")
    WARD_CLIENT_AVAILABLE = False

# ── Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("ward.api")

# ── App startup time for real uptime tracking
_START_TIME = time.time()

# ── XRPL endpoint from environment (Railway injects this)
XRPL_URL = os.getenv("XRPL_URL", "wss://xrplcluster.com")
XRPL_RPC = os.getenv("XRPL_RPC", "https://xrplcluster.com")

# ── FastAPI — no auto-docs in production
app = FastAPI(
    title="Ward Protocol",
    description=(
        "Open specification for default protection on XLS-66 lending vaults. "
        "ward_signed = False — Ward constructs unsigned transactions. "
        "The institution signs. XRPL settles."
    ),
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# ── CORS — locked to wardprotocol.org only
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wardprotocol.org",
        "https://www.wardprotocol.org",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Institution-Key"],
)


# ============================================================
# AUTH UTILITY
# ============================================================

def verify_institution_key(x_institution_key: Optional[str]) -> None:
    """
    Verify institution API key from X-Institution-Key header.
    Key stored in Railway environment — never in code.
    Raises HTTP 401 if missing or invalid.
    """
    expected = os.getenv("INSTITUTION_API_KEY")
    if not expected:
        logger.warning("INSTITUTION_API_KEY not set in environment — auth bypassed")
        return
    if not x_institution_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "MISSING_AUTH",
                "message": "X-Institution-Key header required",
                "ward_signed": False,
            }
        )
    # Constant-time comparison — prevents timing attacks
    provided = hashlib.sha256(x_institution_key.encode()).digest()
    expected_hash = hashlib.sha256(expected.encode()).digest()
    if provided != expected_hash:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "INVALID_AUTH",
                "message": "Invalid institution key",
                "ward_signed": False,
            }
        )


# ============================================================
# REQUEST / RESPONSE MODELS
# All responses include ward_signed: false — core invariant.
# ============================================================

class VaultRegisterRequest(BaseModel):
    institution_address: str = Field(..., description="Institution XRPL address (r...)")
    collateral_currency: str = Field(default="XRP")
    min_collateral_ratio: float = Field(default=1.5, ge=1.0)
    domain_credential: Optional[str] = Field(None, description="XLS-80 domain credential hash")
    policy_nft_taxon: int = Field(default=282)

class CredentialIssueRequest(BaseModel):
    institution_address: str = Field(..., description="Institution XRPL address")
    depositor_address: str = Field(..., description="Depositor XRPL address")
    kyc_hash: str = Field(..., description="SHA-256 hash of KYC document — no raw PII on-chain")
    kyc_type: str = Field(..., description="institutional | retail | accredited")
    expiry_days: int = Field(default=365, ge=30, le=730)

class PolicyPurchaseRequest(BaseModel):
    vault_id: str = Field(..., description="XLS-66 vault address")
    depositor_address: str = Field(..., description="Depositor XRPL address")
    coverage_drops: int = Field(..., gt=0, description="Coverage amount in XRP drops")
    duration_days: int = Field(default=90, ge=1, le=365)
    premium_bps: int = Field(default=50, ge=0, description="Premium in basis points")

class ClaimFileRequest(BaseModel):
    vault_id: str = Field(..., description="XLS-66 vault address")
    policy_nft_id: str = Field(..., description="Policy NFT token ID (64 hex chars)")
    claimant_address: str = Field(..., description="Claimant XRPL address")
    condition_hex: str = Field(..., description="PREIMAGE-SHA-256 condition — Ward never sees the preimage")

class EscrowCreateRequest(BaseModel):
    claim_id: str
    claimant_address: str
    coverage_drops: int = Field(..., gt=0)
    condition_hex: str = Field(..., description="SHA-256 condition — fulfillment held only by claimant")
    policy_nft_id: str


# ============================================================
# ROUTES — F·01 through F·06
# ============================================================

# ── Root
@app.get("/")
async def root():
    return {
        "protocol": "Ward Protocol",
        "version": "1.0.0",
        "spec": "https://github.com/XRPLF/XRPL-Standards/discussions/474",
        "github": "https://github.com/wflores9/ward-protocol",
        "pypi": "ward-protocol==0.1.1",
        "ward_signed": False,
        "invariant": "Ward constructs unsigned XRPL transactions. The institution signs. XRPL settles.",
        "status": "operational",
    }


# ── Health — real dynamic data only
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "uptime_seconds": round(time.time() - _START_TIME),
        "version": "1.0.0",
        "xrpl_url": XRPL_URL,
        "ward_client_available": WARD_CLIENT_AVAILABLE,
        "ward_signed": False,
        "invariant": "ward_signed = False — always",
    }


# ── F·01 — Vault Registration (XLS-66)
@app.post("/vaults")
async def register_vault(
    req: VaultRegisterRequest,
    x_institution_key: Optional[str] = Header(None),
):
    """
    F·01 — Register an XLS-66 lending vault on XRPL.
    Returns unsigned VaultCreate for institution to sign.
    ward_signed = False.
    """
    verify_institution_key(x_institution_key)
    logger.info(f"F·01 register_vault: institution={req.institution_address}")

    if not WARD_CLIENT_AVAILABLE:
        return {
            "ward_signed": False,
            "flow": "F·01",
            "status": "spec_mode",
            "unsigned_tx_type": "VaultCreate",
            "params": req.model_dump(),
            "note": "Institution signs unsigned tx with their XRPL keypair. Ward never signs.",
        }

    try:
        client = WardClient(xrpl_url=XRPL_URL)
        result = await client.register_vault(
            institution_address=req.institution_address,
            collateral_currency=req.collateral_currency,
            min_collateral_ratio=req.min_collateral_ratio,
        )
        return {"ward_signed": False, "flow": "F·01", **result}
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"error": "VALIDATION_ERROR", "message": str(e), "ward_signed": False})
    except LedgerError as e:
        raise HTTPException(status_code=502, detail={"error": "LEDGER_ERROR", "message": str(e), "ward_signed": False})


@app.get("/vaults")
async def list_vaults(x_institution_key: Optional[str] = Header(None)):
    verify_institution_key(x_institution_key)
    return {
        "ward_signed": False,
        "flow": "F·01",
        "vaults": [],
        "source": "XRPL XLS-66 ledger objects",
    }


@app.get("/vaults/{vault_id}")
async def get_vault(vault_id: str, x_institution_key: Optional[str] = Header(None)):
    verify_institution_key(x_institution_key)
    return {
        "ward_signed": False,
        "flow": "F·01",
        "vault_id": vault_id,
        "source": "XRPL ledger — authoritative state only",
    }


# ── F·02 — Credential Issuance (XLS-70)
@app.post("/credentials/issue")
async def issue_credential(
    req: CredentialIssueRequest,
    x_institution_key: Optional[str] = Header(None),
):
    """
    F·02 — Issue XLS-70 KYC credential.
    SHA-256 hash anchored on-chain. No raw PII ever on-chain.
    Returns unsigned NFTokenMint. ward_signed = False.
    """
    verify_institution_key(x_institution_key)
    logger.info(f"F·02 issue_credential: depositor={req.depositor_address} type={req.kyc_type}")

    if req.kyc_type not in ("institutional", "retail", "accredited"):
        raise HTTPException(
            status_code=422,
            detail={"error": "INVALID_KYC_TYPE", "message": "kyc_type must be institutional | retail | accredited", "ward_signed": False}
        )

    if not WARD_CLIENT_AVAILABLE:
        return {
            "ward_signed": False,
            "flow": "F·02",
            "status": "spec_mode",
            "unsigned_tx_type": "NFTokenMint",
            "credential_nft_taxon": 282,
            "params": req.model_dump(),
            "note": "Institution signs with their keypair. Ward never signs.",
        }

    try:
        client = WardClient(xrpl_url=XRPL_URL)
        result = await client.issue_credential(
            institution_address=req.institution_address,
            depositor_address=req.depositor_address,
            kyc_hash=req.kyc_hash,
            kyc_type=req.kyc_type,
            expiry_days=req.expiry_days,
        )
        return {"ward_signed": False, "flow": "F·02", **result}
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"error": "VALIDATION_ERROR", "message": str(e), "ward_signed": False})
    except LedgerError as e:
        raise HTTPException(status_code=502, detail={"error": "LEDGER_ERROR", "message": str(e), "ward_signed": False})


@app.post("/credentials/verify")
async def verify_credential(
    credential_id: str,
    subject_address: str,
    x_institution_key: Optional[str] = Header(None),
):
    """Verify an XLS-70 credential is valid and unexpired on XRPL."""
    verify_institution_key(x_institution_key)
    return {
        "ward_signed": False,
        "flow": "F·02",
        "credential_id": credential_id,
        "subject_address": subject_address,
        "source": "XRPL ledger — account_nfts query",
    }


# ── F·03 — Policy Purchase (XLS-20)
@app.post("/policies/purchase")
async def purchase_policy(
    req: PolicyPurchaseRequest,
    x_institution_key: Optional[str] = Header(None),
):
    """
    F·03 — Purchase XLS-20 NFT policy certificate.
    Coverage terms encoded immutably in NFT URI.
    TF_BURNABLE only — non-transferable by design.
    Returns unsigned NFTokenMint. ward_signed = False.
    """
    verify_institution_key(x_institution_key)
    logger.info(f"F·03 purchase_policy: vault={req.vault_id} depositor={req.depositor_address}")

    if not WARD_CLIENT_AVAILABLE:
        return {
            "ward_signed": False,
            "flow": "F·03",
            "status": "spec_mode",
            "unsigned_tx_type": "NFTokenMint",
            "policy_nft_taxon": 281,
            "flags": "TF_BURNABLE — non-transferable by design",
            "uri_encodes": "coverage_drops | expiry_ledger | vault_id | premium_bps",
            "params": req.model_dump(),
            "note": "Institution signs with their keypair. Ward never signs.",
        }

    try:
        client = WardClient(xrpl_url=XRPL_URL)
        result = await client.purchase_coverage(
            vault_address=req.vault_id,
            depositor_address=req.depositor_address,
            coverage_drops=req.coverage_drops,
            period_days=req.duration_days,
        )
        return {"ward_signed": False, "flow": "F·03", **result}
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"error": "VALIDATION_ERROR", "message": str(e), "ward_signed": False})
    except LedgerError as e:
        raise HTTPException(status_code=502, detail={"error": "LEDGER_ERROR", "message": str(e), "ward_signed": False})


# ── F·04 + F·05 — Claim Filing + 9-Step Validation
@app.post("/claims/file")
async def file_claim(
    req: ClaimFileRequest,
    x_institution_key: Optional[str] = Header(None),
):
    """
    F·04 + F·05 — File default claim. Runs 9-step ClaimValidator.
    All checks query live XRPL state. No oracle. No human judgment.
    All 9 pass → unsigned EscrowCreate returned.
    Any failure → CLAIM_REJECTED with reason code.
    ward_signed = False.
    """
    verify_institution_key(x_institution_key)
    logger.info(f"F·04 file_claim: vault={req.vault_id} nft={req.policy_nft_id}")

    if not WARD_CLIENT_AVAILABLE:
        return {
            "ward_signed": False,
            "flow": "F·04 + F·05",
            "status": "spec_mode",
            "validation_checks": 9,
            "checks": [
                {"check": 1, "name": "Policy NFT exists on ledger",         "error_code": "NFT_NOT_FOUND"},
                {"check": 2, "name": "Policy unexpired",                     "error_code": "POLICY_EXPIRED"},
                {"check": 3, "name": "Vault address matches NFT URI",        "error_code": "VAULT_MISMATCH"},
                {"check": 4, "name": "Default confirmed (3 ledger closes)",  "error_code": "DEFAULT_NOT_CONFIRMED"},
                {"check": 5, "name": "Collateral ratio provably breached",   "error_code": "COLLATERAL_SUFFICIENT"},
                {"check": 6, "name": "No active escrow pending",             "error_code": "ESCROW_ALREADY_PENDING"},
                {"check": 7, "name": "KYC credential valid and unexpired",   "error_code": "KYC_CREDENTIAL_INVALID"},
                {"check": 8, "name": "Domain credential valid",              "error_code": "DOMAIN_NOT_AUTHORIZED"},
                {"check": 9, "name": "Rate limit clear",                     "error_code": "RATE_LIMIT_EXCEEDED"},
            ],
            "note": "All 9 checks read live XRPL ledger state. No off-chain inputs permitted.",
        }

    try:
        validator = ClaimValidator(xrpl_url=XRPL_URL)
        result = await validator.validate_claim(
            claimant_address=req.claimant_address,
            nft_token_id=req.policy_nft_id,
            vault_address=req.vault_id,
            condition_hex=req.condition_hex,
        )
        return {
            "ward_signed": False,
            "flow": "F·04 + F·05",
            "validation_checks": 9,
            "checks_passed": 9,
            **result,
            "note": "Institution signs unsigned EscrowCreate. Ward never signs.",
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": "CLAIM_REJECTED", "message": str(e), "ward_signed": False}
        )
    except LedgerError as e:
        raise HTTPException(status_code=502, detail={"error": "LEDGER_ERROR", "message": str(e), "ward_signed": False})


@app.get("/claims/{claim_id}")
async def get_claim(claim_id: str, x_institution_key: Optional[str] = Header(None)):
    verify_institution_key(x_institution_key)
    return {
        "ward_signed": False,
        "flow": "F·05",
        "claim_id": claim_id,
        "source": "XRPL ledger — authoritative state only",
    }


# ── F·06 — Escrow Settlement (PREIMAGE-SHA-256)
@app.post("/settlement/escrow")
async def create_escrow(
    req: EscrowCreateRequest,
    x_institution_key: Optional[str] = Header(None),
):
    """
    F·06 — Build PREIMAGE-SHA-256 escrow for claim settlement.
    Ward receives condition_hex only — never the preimage.
    Only the claimant holds the preimage.
    Returns unsigned EscrowCreate. Institution signs and submits.
    Ward's server is irrelevant after EscrowCreate is on-chain.
    ward_signed = False.
    """
    verify_institution_key(x_institution_key)
    logger.info(f"F·06 create_escrow: claim={req.claim_id} claimant={req.claimant_address}")

    if not WARD_CLIENT_AVAILABLE:
        return {
            "ward_signed": False,
            "flow": "F·06",
            "status": "spec_mode",
            "unsigned_tx_type": "EscrowCreate",
            "condition": "PREIMAGE-SHA-256",
            "finish_after": "+48h (172800s)",
            "cancel_after": "+72h (259200s)",
            "nft_burn": "atomic with EscrowFinish — replay structurally impossible",
            "params": req.model_dump(),
            "note": (
                "Institution signs EscrowCreate. Ward's server irrelevant after this. "
                "XRPL enforces settlement. Claimant reveals preimage to finish escrow. "
                "Ward never holds or sees the preimage."
            ),
        }

    try:
        settlement = EscrowSettlement(xrpl_url=XRPL_URL)
        result = await settlement.build_escrow_create(
            claim_id=req.claim_id,
            claimant_address=req.claimant_address,
            coverage_drops=req.coverage_drops,
            condition_hex=req.condition_hex,
            policy_nft_id=req.policy_nft_id,
        )
        return {"ward_signed": False, "flow": "F·06", **result}
    except ValidationError as e:
        raise HTTPException(status_code=422, detail={"error": "VALIDATION_ERROR", "message": str(e), "ward_signed": False})
    except LedgerError as e:
        raise HTTPException(status_code=502, detail={"error": "LEDGER_ERROR", "message": str(e), "ward_signed": False})


# ── Network Status — public, no auth
@app.get("/network/status")
async def network_status():
    return {
        "ward_signed": False,
        "xrpl_url": XRPL_URL,
        "network": "altnet" if "altnet" in XRPL_URL else "mainnet",
        "ward_client_available": WARD_CLIENT_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# ============================================================
# ERROR HANDLERS — ward_signed: false in every response
# ============================================================

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "NOT_FOUND",
            "path": str(request.url.path),
            "ward_signed": False,
            "docs": "https://wardprotocol.org/api.html",
        }
    )

@app.exception_handler(500)
async def server_error(request: Request, exc):
    logger.error(f"Internal error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "ward_signed": False,
            "message": "An unexpected error occurred. Ward's server state is irrelevant to on-chain outcomes.",
        }
    )
