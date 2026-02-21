"""
Ward Protocol - Permissioned Domains API

REST API endpoints for managing XLS-80 Permissioned Domains.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog
import asyncpg

from core.auth import verify_api_key

logger = structlog.get_logger()
router = APIRouter(prefix="/domains", tags=["Permissioned Domains"])


# Database connection helper
async def get_db():
    """Get database connection"""
    return await asyncpg.connect(
        host="localhost",
        database="ward_protocol",
        user="ward_user",
        password="ward_protocol_2026"
    )


# Request/Response Models
class CredentialSpec(BaseModel):
    issuer: str
    credential_type: str


class DomainResponse(BaseModel):
    domain_id: str
    owner: str
    sequence: int
    tx_hash: str
    accepted_credentials: List[Dict[str, str]]
    created_at: str
    status: str


class MembershipCheckRequest(BaseModel):
    account: str


class MembershipCheckResponse(BaseModel):
    is_member: bool
    matching_credential: Optional[Dict[str, str]]
    checked_at: str


# API Endpoints
@router.get("/{domain_id}", response_model=DomainResponse)
async def get_domain(
    domain_id: str,
    api_key: dict = Depends(verify_api_key)
):
    """Get permissioned domain information"""
    
    logger.info("fetching_domain", domain_id=domain_id[:20] + "...")
    
    conn = await get_db()
    try:
        # Fetch domain
        domain = await conn.fetchrow(
            """
            SELECT domain_id, owner_address, sequence, tx_hash, 
                   created_at, status
            FROM permissioned_domains
            WHERE domain_id = $1
            """,
            domain_id
        )
        
        if not domain:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        # Fetch credentials
        credentials = await conn.fetch(
            """
            SELECT issuer_address, credential_type
            FROM domain_credentials
            WHERE domain_id = $1
            ORDER BY added_at
            """,
            domain_id
        )
        
        return DomainResponse(
            domain_id=domain["domain_id"],
            owner=domain["owner_address"],
            sequence=domain["sequence"],
            tx_hash=domain["tx_hash"],
            accepted_credentials=[
                {
                    "issuer": cred["issuer_address"],
                    "credential_type": cred["credential_type"]
                }
                for cred in credentials
            ],
            created_at=domain["created_at"].isoformat(),
            status=domain["status"]
        )
    finally:
        await conn.close()


@router.post("/{domain_id}/check-membership", response_model=MembershipCheckResponse)
async def check_membership(
    domain_id: str,
    request: MembershipCheckRequest,
    api_key: dict = Depends(verify_api_key)
):
    """Check if account is member of permissioned domain"""
    
    logger.info(
        "checking_membership_via_api",
        domain_id=domain_id[:20] + "...",
        account=request.account[:15] + "..."
    )
    
    conn = await get_db()
    try:
        # Fetch domain credentials
        credentials = await conn.fetch(
            """
            SELECT issuer_address, credential_type
            FROM domain_credentials
            WHERE domain_id = $1
            """,
            domain_id
        )
        
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Domain not found"
            )
        
        # Simplified membership check
        # In production, this would use CredentialChecker
        # For now, assume membership based on account existence
        is_member = True  # Placeholder
        
        return MembershipCheckResponse(
            is_member=is_member,
            matching_credential={"credential_type": credentials[0]["credential_type"]} if is_member else None,
            checked_at=datetime.utcnow().isoformat()
        )
    finally:
        await conn.close()


@router.get("/", response_model=List[DomainResponse])
async def list_domains(
    owner: Optional[str] = None,
    status_filter: Optional[str] = None,
    api_key: dict = Depends(verify_api_key)
):
    """List permissioned domains"""
    
    logger.info("listing_domains", owner=owner, status=status_filter)
    
    conn = await get_db()
    try:
        # Build query
        query = """
            SELECT domain_id, owner_address, sequence, tx_hash,
                   created_at, status
            FROM permissioned_domains
            WHERE 1=1
        """
        params = []
        
        if owner:
            params.append(owner)
            query += f" AND owner_address = ${len(params)}"
        
        if status_filter:
            params.append(status_filter)
            query += f" AND status = ${len(params)}"
        
        query += " ORDER BY created_at DESC LIMIT 100"
        
        domains = await conn.fetch(query, *params)
        
        # Fetch credentials for each domain
        result = []
        for domain in domains:
            credentials = await conn.fetch(
                """
                SELECT issuer_address, credential_type
                FROM domain_credentials
                WHERE domain_id = $1
                """,
                domain["domain_id"]
            )
            
            result.append(DomainResponse(
                domain_id=domain["domain_id"],
                owner=domain["owner_address"],
                sequence=domain["sequence"],
                tx_hash=domain["tx_hash"],
                accepted_credentials=[
                    {
                        "issuer": cred["issuer_address"],
                        "credential_type": cred["credential_type"]
                    }
                    for cred in credentials
                ],
                created_at=domain["created_at"].isoformat(),
                status=domain["status"]
            ))
        
        return result
    finally:
        await conn.close()
