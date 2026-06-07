"""Database connection and operations for Ward Protocol."""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncpg
from contextlib import asynccontextmanager


class WardDatabase:
    """PostgreSQL database connection for Ward Protocol."""
    
    def __init__(self, connection_string: Optional[str] = None):
        """
        Initialize database connection.
        
        Args:
            connection_string: PostgreSQL connection string
                              (defaults to DATABASE_URL env var)
        """
        self.connection_string = connection_string or os.getenv(
            'DATABASE_URL',
            'postgresql://ward:ward@localhost/ward_protocol'
        )
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create connection pool."""
        self.pool = await asyncpg.create_pool(
            self.connection_string,
            min_size=2,
            max_size=10
        )
    
    async def disconnect(self):
        """Close connection pool."""
        if self.pool:
            await self.pool.close()
    
    @asynccontextmanager
    async def transaction(self):
        """Context manager for database transactions."""
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                yield conn
    
    # ===== DEFAULT EVENTS =====
    
    async def log_default_event(
        self,
        loan_id: str,
        loan_broker_id: str,
        vault_id: str,
        borrower_address: str,
        default_amount: int,
        default_covered: int,
        vault_loss: int,
        tx_hash: str,
        ledger_index: int
    ) -> str:
        """
        Log a default event.
        
        Returns:
            event_id (UUID)
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO default_events (
                    loan_id, loan_broker_id, vault_id, borrower_address,
                    default_amount, default_covered, vault_loss,
                    tx_hash, ledger_index
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING event_id
                """,
                loan_id, loan_broker_id, vault_id, borrower_address,
                default_amount, default_covered, vault_loss,
                tx_hash, ledger_index
            )
            return str(row['event_id'])
    
    async def get_default_events(
        self,
        vault_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get default events, optionally filtered by vault."""
        async with self.pool.acquire() as conn:
            if vault_id:
                rows = await conn.fetch(
                    """
                    SELECT * FROM default_events
                    WHERE vault_id = $1
                    ORDER BY detected_at DESC
                    LIMIT $2
                    """,
                    vault_id, limit
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT * FROM default_events
                    ORDER BY detected_at DESC
                    LIMIT $1
                    """,
                    limit
                )
            return [dict(row) for row in rows]
    
    # ===== CLAIMS =====
    
    async def create_claim(
        self,
        policy_id: str,
        loan_id: str,
        loan_manage_tx_hash: str,
        loan_broker_id: str,
        vault_id: str,
        default_amount: int,
        default_covered: int,
        vault_loss: int,
        claim_payout: int
    ) -> str:
        """
        Create a new claim.
        
        Returns:
            claim_id (UUID)
        """
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO claims (
                    policy_id, loan_id, loan_manage_tx_hash,
                    loan_broker_id, vault_id,
                    default_amount, default_covered, vault_loss,
                    claim_payout, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
                RETURNING claim_id
                """,
                policy_id, loan_id, loan_manage_tx_hash,
                loan_broker_id, vault_id,
                default_amount, default_covered, vault_loss,
                claim_payout
            )
            return str(row['claim_id'])
    
    async def update_claim_status(
        self,
        claim_id: str,
        status: str,
        escrow_tx_hash: Optional[str] = None,
        settlement_tx_hash: Optional[str] = None,
        rejection_reason: Optional[str] = None
    ):
        """Update claim status."""
        async with self.pool.acquire() as conn:
            if status == 'validated':
                await conn.execute(
                    """
                    UPDATE claims
                    SET status = $1, validated_at = NOW()
                    WHERE claim_id = $2
                    """,
                    status, claim_id
                )
            elif status == 'escrowed' and escrow_tx_hash:
                await conn.execute(
                    """
                    UPDATE claims
                    SET status = $1, escrow_tx_hash = $2
                    WHERE claim_id = $3
                    """,
                    status, escrow_tx_hash, claim_id
                )
            elif status == 'settled' and settlement_tx_hash:
                await conn.execute(
                    """
                    UPDATE claims
                    SET status = $1, settlement_tx_hash = $2, settled_at = NOW()
                    WHERE claim_id = $3
                    """,
                    status, settlement_tx_hash, claim_id
                )
            elif status == 'rejected' and rejection_reason:
                await conn.execute(
                    """
                    UPDATE claims
                    SET status = $1, rejection_reason = $2
                    WHERE claim_id = $3
                    """,
                    status, rejection_reason, claim_id
                )
    
    async def get_claims(
        self,
        policy_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get claims with optional filters."""
        async with self.pool.acquire() as conn:
            query = "SELECT * FROM claims WHERE 1=1"
            params = []
            param_num = 1
            
            if policy_id:
                query += f" AND policy_id = ${param_num}"
                params.append(policy_id)
                param_num += 1
            
            if status:
                query += f" AND status = ${param_num}"
                params.append(status)
                param_num += 1
            
            query += f" ORDER BY created_at DESC LIMIT ${param_num}"
            params.append(limit)
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    # ===== MONITORED VAULTS =====
    
    async def upsert_vault_state(
        self,
        vault_id: str,
        loan_broker_id: str,
        asset_type: str,
        assets_total: int,
        assets_available: int,
        loss_unrealized: int,
        shares_total: int,
        share_value: float,
        ledger_index: int
    ):
        """Insert or update vault state."""
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO monitored_vaults (
                    vault_id, loan_broker_id, asset_type,
                    assets_total, assets_available, loss_unrealized,
                    shares_total, share_value, last_updated_ledger,
                    last_checked
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (vault_id) DO UPDATE SET
                    assets_total = EXCLUDED.assets_total,
                    assets_available = EXCLUDED.assets_available,
                    loss_unrealized = EXCLUDED.loss_unrealized,
                    shares_total = EXCLUDED.shares_total,
                    share_value = EXCLUDED.share_value,
                    last_updated_ledger = EXCLUDED.last_updated_ledger,
                    last_checked = NOW()
                """,
                vault_id, loan_broker_id, asset_type,
                assets_total, assets_available, loss_unrealized,
                shares_total, share_value, ledger_index
            )
    
    async def get_monitored_vaults(self) -> List[Dict[str, Any]]:
        """Get all monitored vaults."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM monitored_vaults")
            return [dict(row) for row in rows]
