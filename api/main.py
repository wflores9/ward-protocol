"""
Ward Protocol REST API.

Provides endpoints for:
- Pool metrics
- Policy management
- Claim tracking
- Default events
- Monitoring status
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import os
import sys

# Add SDK to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'sdk', 'python'))

from ward.database import WardDatabase
import asyncpg


# Initialize FastAPI
app = FastAPI(
    title="Ward Protocol API",
    description="Insurance protocol for XRPL DeFi lending",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
db = None


@app.on_event("startup")
async def startup():
    """Connect to database on startup."""
    global db
    database_url = os.getenv(
        'DATABASE_URL',
        'postgresql://ward:ward_secure_password_change_me@localhost/ward_protocol'
    )
    db = WardDatabase(database_url)
    await db.connect()
    print("✅ Connected to database")


@app.on_event("shutdown")
async def shutdown():
    """Disconnect from database on shutdown."""
    if db:
        await db.disconnect()
    print("✅ Disconnected from database")


# ===== HEALTH CHECK =====

@app.get("/")
async def root():
    """API health check."""
    return {
        "name": "Ward Protocol API",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    try:
        async with db.pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }


# ===== POOL ENDPOINTS =====

@app.get("/pools")
async def get_pools():
    """Get all insurance pools."""
    async with db.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT 
                pool_id,
                amm_account,
                asset_type,
                total_capital,
                available_capital,
                total_exposure,
                coverage_ratio,
                active_policies_count,
                total_claims_paid,
                last_updated
            FROM insurance_pools
            ORDER BY pool_id
        """)
    
    pools = []
    for row in rows:
        pools.append({
            "pool_id": str(row['pool_id']),
            "amm_account": row['amm_account'],
            "asset_type": row['asset_type'],
            "total_capital": row['total_capital'],
            "available_capital": row['available_capital'],
            "total_exposure": row['total_exposure'],
            "coverage_ratio": float(row['coverage_ratio']),
            "active_policies": row['active_policies_count'],
            "total_claims_paid": row['total_claims_paid'],
            "last_updated": row['last_updated'].isoformat()
        })
    
    return {"pools": pools}


@app.get("/pools/{pool_id}")
async def get_pool(pool_id: str):
    """Get specific pool details."""
    async with db.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM insurance_pools WHERE pool_id = $1",
            pool_id
        )
    
    if not row:
        raise HTTPException(status_code=404, detail="Pool not found")
    
    return {
        "pool_id": str(row['pool_id']),
        "amm_account": row['amm_account'],
        "asset_type": row['asset_type'],
        "total_capital": row['total_capital'],
        "available_capital": row['available_capital'],
        "total_exposure": row['total_exposure'],
        "coverage_ratio": float(row['coverage_ratio']),
        "active_policies": row['active_policies_count'],
        "total_claims_paid": row['total_claims_paid'],
        "last_updated": row['last_updated'].isoformat(),
        "metrics": {
            "total_capital_xrp": row['total_capital'] / 1_000_000,
            "available_capital_xrp": row['available_capital'] / 1_000_000,
            "locked_capital_xrp": (row['total_capital'] - row['available_capital']) / 1_000_000,
            "total_exposure_xrp": row['total_exposure'] / 1_000_000,
            "coverage_ratio_percent": float(row['coverage_ratio']) * 100,
            "is_healthy": float(row['coverage_ratio']) >= 2.0,
            "can_issue_policies": float(row['coverage_ratio']) >= 2.0
        }
    }


# ===== POLICY ENDPOINTS =====

@app.get("/policies")
async def get_policies(
    status: Optional[str] = None,
    vault_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get policies with optional filters."""
    query = "SELECT * FROM policies WHERE 1=1"
    params = []
    param_num = 1
    
    if status:
        query += f" AND status = ${param_num}"
        params.append(status)
        param_num += 1
    
    if vault_id:
        query += f" AND vault_id = ${param_num}"
        params.append(vault_id)
        param_num += 1
    
    query += f" ORDER BY created_at DESC LIMIT ${param_num}"
    params.append(limit)
    
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    
    policies = []
    for row in rows:
        policies.append({
            "policy_id": str(row['policy_id']),
            "nft_token_id": row['nft_token_id'],
            "vault_id": row['vault_id'],
            "insured_address": row['insured_address'],
            "coverage_amount": row['coverage_amount'],
            "premium_paid": row['premium_paid'],
            "coverage_start": row['coverage_start'].isoformat(),
            "coverage_end": row['coverage_end'].isoformat(),
            "pool_id": str(row['pool_id']),
            "status": row['status'],
            "created_at": row['created_at'].isoformat()
        })
    
    return {"policies": policies, "count": len(policies)}


# ===== CLAIM ENDPOINTS =====

@app.get("/claims")
async def get_claims(
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get claims with optional status filter."""
    query = "SELECT * FROM claims WHERE 1=1"
    params = []
    param_num = 1
    
    if status:
        query += f" AND status = ${param_num}"
        params.append(status)
        param_num += 1
    
    query += f" ORDER BY created_at DESC LIMIT ${param_num}"
    params.append(limit)
    
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    
    claims = []
    for row in rows:
        claims.append({
            "claim_id": str(row['claim_id']),
            "policy_id": str(row['policy_id']) if row['policy_id'] else None,
            "loan_id": row['loan_id'],
            "vault_id": row['vault_id'],
            "default_amount": row['default_amount'],
            "default_covered": row['default_covered'],
            "vault_loss": row['vault_loss'],
            "claim_payout": row['claim_payout'],
            "status": row['status'],
            "created_at": row['created_at'].isoformat(),
            "settled_at": row['settled_at'].isoformat() if row['settled_at'] else None
        })
    
    return {"claims": claims, "count": len(claims)}


# ===== DEFAULT EVENTS =====

@app.get("/defaults")
async def get_default_events(
    vault_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000)
):
    """Get default events."""
    if vault_id:
        query = """
            SELECT * FROM default_events 
            WHERE vault_id = $1
            ORDER BY detected_at DESC 
            LIMIT $2
        """
        params = [vault_id, limit]
    else:
        query = """
            SELECT * FROM default_events 
            ORDER BY detected_at DESC 
            LIMIT $1
        """
        params = [limit]
    
    async with db.pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    
    events = []
    for row in rows:
        events.append({
            "event_id": str(row['event_id']),
            "loan_id": row['loan_id'],
            "vault_id": row['vault_id'],
            "borrower": row['borrower_address'],
            "default_amount": row['default_amount'],
            "default_covered": row['default_covered'],
            "vault_loss": row['vault_loss'],
            "tx_hash": row['tx_hash'],
            "ledger_index": row['ledger_index'],
            "detected_at": row['detected_at'].isoformat()
        })
    
    return {"events": events, "count": len(events)}


# ===== STATS =====

@app.get("/stats")
async def get_stats():
    """Get protocol-wide statistics."""
    async with db.pool.acquire() as conn:
        # Pool stats
        pool_stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as pool_count,
                SUM(total_capital) as total_capital,
                SUM(available_capital) as available_capital,
                SUM(total_exposure) as total_exposure,
                SUM(active_policies_count) as active_policies,
                SUM(total_claims_paid) as total_claims_paid
            FROM insurance_pools
        """)
        
        # Policy stats
        policy_stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total_policies,
                COUNT(*) FILTER (WHERE status = 'active') as active_policies,
                COUNT(*) FILTER (WHERE status = 'expired') as expired_policies,
                SUM(coverage_amount) as total_coverage,
                SUM(premium_paid) as total_premiums
            FROM policies
        """)
        
        # Claim stats
        claim_stats = await conn.fetchrow("""
            SELECT 
                COUNT(*) as total_claims,
                COUNT(*) FILTER (WHERE status = 'settled') as settled_claims,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_claims,
                SUM(claim_payout) FILTER (WHERE status = 'settled') as total_payouts
            FROM claims
        """)
        
        # Default events
        default_count = await conn.fetchval("SELECT COUNT(*) FROM default_events")
    
    return {
        "pools": {
            "count": pool_stats['pool_count'],
            "total_capital": pool_stats['total_capital'] or 0,
            "available_capital": pool_stats['available_capital'] or 0,
            "total_exposure": pool_stats['total_exposure'] or 0,
            "active_policies": pool_stats['active_policies'] or 0,
            "total_claims_paid": pool_stats['total_claims_paid'] or 0
        },
        "policies": {
            "total": policy_stats['total_policies'],
            "active": policy_stats['active_policies'],
            "expired": policy_stats['expired_policies'],
            "total_coverage": policy_stats['total_coverage'] or 0,
            "total_premiums": policy_stats['total_premiums'] or 0
        },
        "claims": {
            "total": claim_stats['total_claims'],
            "settled": claim_stats['settled_claims'],
            "rejected": claim_stats['rejected_claims'],
            "total_payouts": claim_stats['total_payouts'] or 0
        },
        "defaults": {
            "total_events": default_count
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
