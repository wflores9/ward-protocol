"""
Policy management for Ward Protocol.

Handles insurance policy creation, NFT minting, and premium collection.
"""

import json
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from decimal import Decimal

from xrpl.models import NFTokenMint, Payment, Memo
from xrpl.utils import str_to_hex
from xrpl.wallet import Wallet
from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.asyncio.transaction import submit_and_wait

from .database import WardDatabase
from .models import Vault


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PolicyRequest:
    """Request to create an insurance policy."""
    vault_id: str
    insured_address: str
    coverage_amount: int  # drops
    term_days: int
    pool_id: str


@dataclass
class Policy:
    """Insurance policy with NFT representation."""
    policy_id: str
    nft_token_id: str
    vault_id: str
    insured_address: str
    coverage_amount: int
    premium_paid: int
    coverage_start: datetime
    coverage_end: datetime
    pool_id: str
    status: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'policy_id': self.policy_id,
            'nft_token_id': self.nft_token_id,
            'vault_id': self.vault_id,
            'insured_address': self.insured_address,
            'coverage_amount': self.coverage_amount,
            'premium_paid': self.premium_paid,
            'coverage_start': self.coverage_start.isoformat(),
            'coverage_end': self.coverage_end.isoformat(),
            'pool_id': self.pool_id,
            'status': self.status
        }


class PolicyManager:
    """
    Manages insurance policies for Ward Protocol.
    
    Handles policy creation, NFT minting, premium collection,
    and policy lifecycle management.
    """
    
    def __init__(
        self,
        client: AsyncWebsocketClient,
        wallet: Wallet,
        database: WardDatabase,
        pool_premium_account: str
    ):
        """
        Initialize policy manager.
        
        Args:
            client: XRPL async client
            wallet: Ward Protocol wallet (for minting NFTs)
            database: Database connection
            pool_premium_account: Address to receive premiums
        """
        self.client = client
        self.wallet = wallet
        self.db = database
        self.pool_premium_account = pool_premium_account
    
    async def create_policy(
        self,
        request: PolicyRequest,
        premium_amount: int,
        vault: Optional[Vault] = None
    ) -> Policy:
        """
        Create insurance policy with NFT certificate.
        
        Process:
        1. Validate vault state (if provided)
        2. Calculate coverage dates
        3. Mint policy NFT with metadata
        4. Store policy in database
        5. Return Policy object
        
        Args:
            request: PolicyRequest with coverage details
            premium_amount: Premium in drops (pre-calculated)
            vault: Optional vault state for validation
        
        Returns:
            Policy object with NFT token ID
        """
        logger.info(f"Creating policy for vault {request.vault_id[:8]}...")
        
        # Calculate coverage dates
        coverage_start = datetime.utcnow() + timedelta(hours=24)  # 24hr delay
        coverage_end = coverage_start + timedelta(days=request.term_days)
        
        # Create NFT metadata
        metadata = {
            "protocol": "ward-v1",
            "policy_version": "1.0",
            "vault_id": request.vault_id,
            "insured_address": request.insured_address,
            "coverage_amount": str(request.coverage_amount),
            "premium_paid": str(premium_amount),
            "coverage_start": coverage_start.isoformat() + "Z",
            "coverage_end": coverage_end.isoformat() + "Z",
            "pool_id": request.pool_id,
            "policy_type": "vault_depositor_protection",
            "status": "active"
        }
        
        # Mint NFT
        logger.info("Minting policy NFT...")
        nft_token_id = await self._mint_policy_nft(
            metadata=metadata,
            destination=request.insured_address
        )
        
        logger.info(f"NFT minted: {nft_token_id}")
        
        # Store policy in database
        policy_id = await self._store_policy(
            nft_token_id=nft_token_id,
            vault_id=request.vault_id,
            insured_address=request.insured_address,
            coverage_amount=request.coverage_amount,
            premium_paid=premium_amount,
            coverage_start=coverage_start,
            coverage_end=coverage_end,
            pool_id=request.pool_id
        )
        
        logger.info(f"Policy created: {policy_id}")
        
        return Policy(
            policy_id=policy_id,
            nft_token_id=nft_token_id,
            vault_id=request.vault_id,
            insured_address=request.insured_address,
            coverage_amount=request.coverage_amount,
            premium_paid=premium_amount,
            coverage_start=coverage_start,
            coverage_end=coverage_end,
            pool_id=request.pool_id,
            status="active"
        )
    
    async def _mint_policy_nft(
        self,
        metadata: Dict[str, Any],
        destination: str
    ) -> str:
        """
        Mint NFT policy certificate.
        
        Args:
            metadata: Policy metadata dictionary
            destination: Address to receive NFT
        
        Returns:
            NFT token ID
        """
        # Convert metadata to URI (JSON in hex)
        metadata_json = json.dumps(metadata, separators=(',', ':'))
        uri_hex = str_to_hex(metadata_json)
        
        # Create NFTokenMint transaction
        mint_tx = NFTokenMint(
            account=self.wallet.address,
            uri=uri_hex,
            flags=8,  # tfTransferable
            transfer_fee=0,
            nft_taxon=0,
            memos=[
                Memo(
                    memo_type=str_to_hex("ward_policy"),
                    memo_data=str_to_hex(f"Policy for vault {metadata['vault_id'][:8]}...")
                )
            ]
        )
        
        # Submit and wait for validation
        response = await submit_and_wait(mint_tx, self.client, self.wallet)
        
        if not response.is_successful():
            raise Exception(f"NFT mint failed: {response.result}")
        
        # Extract NFT token ID from metadata
        meta = response.result.get('meta', {})
        nft_token_id = None
        
        for node in meta.get('AffectedNodes', []):
            if 'CreatedNode' in node:
                created = node['CreatedNode']
                if created.get('LedgerEntryType') == 'NFToken':
                    nft_token_id = created['NewFields'].get('NFTokenID')
                    break
        
        if not nft_token_id:
            raise Exception("Failed to extract NFT token ID from transaction")
        
        # Transfer NFT to insured address if different
        if destination != self.wallet.address:
            await self._transfer_nft(nft_token_id, destination)
        
        return nft_token_id
    
    async def _transfer_nft(self, nft_token_id: str, destination: str):
        """Transfer NFT to destination address."""
        # TODO: Implement NFTokenCreateOffer + NFTokenAcceptOffer flow
        logger.info(f"NFT transfer to {destination} - not implemented yet")
        pass
    
    async def _store_policy(
        self,
        nft_token_id: str,
        vault_id: str,
        insured_address: str,
        coverage_amount: int,
        premium_paid: int,
        coverage_start: datetime,
        coverage_end: datetime,
        pool_id: str
    ) -> str:
        """Store policy in database."""
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO policies (
                    nft_token_id, vault_id, insured_address,
                    coverage_amount, premium_paid,
                    coverage_start, coverage_end,
                    pool_id, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
                RETURNING policy_id
                """,
                nft_token_id, vault_id, insured_address,
                coverage_amount, premium_paid,
                coverage_start, coverage_end,
                pool_id
            )
            return str(row['policy_id'])
    
    async def collect_premium(
        self,
        from_address: str,
        premium_amount: int,
        policy_request_id: str
    ) -> str:
        """
        Verify premium payment.
        
        In production, this would:
        1. Listen for Payment transaction
        2. Verify amount and destination
        3. Extract policy request ID from memo
        
        Args:
            from_address: Payer address
            premium_amount: Expected premium in drops
            policy_request_id: Request ID for matching
        
        Returns:
            Transaction hash of payment
        """
        # TODO: Implement payment monitoring
        logger.info(f"Premium collection for request {policy_request_id} - placeholder")
        return "placeholder_tx_hash"
    
    async def get_active_policies(
        self,
        vault_id: Optional[str] = None,
        insured_address: Optional[str] = None
    ) -> List[Policy]:
        """
        Get active policies with optional filters.
        
        Args:
            vault_id: Filter by vault ID
            insured_address: Filter by insured address
        
        Returns:
            List of active Policy objects
        """
        query = "SELECT * FROM policies WHERE status = 'active'"
        params = []
        param_num = 1
        
        if vault_id:
            query += f" AND vault_id = ${param_num}"
            params.append(vault_id)
            param_num += 1
        
        if insured_address:
            query += f" AND insured_address = ${param_num}"
            params.append(insured_address)
            param_num += 1
        
        query += " ORDER BY created_at DESC"
        
        async with self.db.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
        
        policies = []
        for row in rows:
            policies.append(Policy(
                policy_id=str(row['policy_id']),
                nft_token_id=row['nft_token_id'],
                vault_id=row['vault_id'],
                insured_address=row['insured_address'],
                coverage_amount=row['coverage_amount'],
                premium_paid=row['premium_paid'],
                coverage_start=row['coverage_start'],
                coverage_end=row['coverage_end'],
                pool_id=row['pool_id'],
                status=row['status']
            ))
        
        return policies
    
    async def expire_policy(self, policy_id: str):
        """Mark policy as expired."""
        async with self.db.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE policies
                SET status = 'expired', updated_at = NOW()
                WHERE policy_id = $1
                """,
                policy_id
            )
        logger.info(f"Policy expired: {policy_id}")
    
    async def cancel_policy(self, policy_id: str, reason: str):
        """Cancel policy (e.g., for fraud)."""
        async with self.db.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE policies
                SET status = 'cancelled', updated_at = NOW()
                WHERE policy_id = $1
                """,
                policy_id
            )
        logger.info(f"Policy cancelled: {policy_id} - {reason}")
