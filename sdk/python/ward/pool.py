"""
Insurance pool management using XLS-30 AMM.

Handles capital aggregation, LP operations, and claim payouts.
"""

import logging
from typing import Optional, Dict, Any, List
from decimal import Decimal
from dataclasses import dataclass

from xrpl.models import (
    AMMCreate, AMMDeposit, AMMWithdraw, AMMInfo,
    Payment, AccountInfo
)
from xrpl.wallet import Wallet
from xrpl.asyncio.clients import AsyncWebsocketClient
from xrpl.asyncio.transaction import submit_and_wait
from xrpl.utils import drops_to_xrp, xrp_to_drops

from .database import WardDatabase


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PoolMetrics:
    """Insurance pool health metrics."""
    pool_id: str
    amm_account: str
    asset_type: str
    total_capital: int  # drops
    available_capital: int  # drops
    total_exposure: int  # drops (sum of active policy coverage)
    coverage_ratio: float  # available / exposure (target: ≥200%)
    active_policies_count: int
    total_claims_paid: int  # drops
    lp_token_balance: int
    
    @property
    def coverage_ratio_percent(self) -> float:
        """Coverage ratio as percentage."""
        return self.coverage_ratio * 100
    
    @property
    def is_healthy(self) -> bool:
        """Pool is healthy if coverage ratio ≥ 200%."""
        return self.coverage_ratio >= 2.0
    
    @property
    def can_issue_policies(self) -> bool:
        """Can issue new policies if ratio ≥ 200%."""
        return self.is_healthy


class InsurancePool:
    """
    XLS-30 AMM-based insurance pool.
    
    Manages institutional capital for insurance coverage using
    Automated Market Maker pools.
    """
    
    MINIMUM_COVERAGE_RATIO = 2.0  # 200%
    WARNING_THRESHOLD = 2.5  # 250%
    OPTIMAL_TARGET = 3.0  # 300%
    
    def __init__(
        self,
        client: AsyncWebsocketClient,
        wallet: Wallet,
        database: WardDatabase,
        pool_id: Optional[str] = None
    ):
        """
        Initialize insurance pool.
        
        Args:
            client: XRPL client
            wallet: Pool management wallet
            database: Database connection
            pool_id: Existing pool ID (if connecting to existing pool)
        """
        self.client = client
        self.wallet = wallet
        self.db = database
        self.pool_id = pool_id
        self.amm_account: Optional[str] = None
    
    async def create_pool(
        self,
        initial_capital_xrp: float,
        asset_type: str = "XRP"
    ) -> str:
        """
        Create new insurance pool using XLS-30 AMM.
        
        Args:
            initial_capital_xrp: Initial capital in XRP
            asset_type: Asset type (XRP, RLUSD, etc.)
        
        Returns:
            Pool ID
        """
        logger.info(f"Creating insurance pool with {initial_capital_xrp:,.2f} XRP")
        
        initial_drops = xrp_to_drops(str(initial_capital_xrp))
        
        # Create AMM
        # Note: XLS-30 requires 2 assets for AMM
        # For single-asset pool, we use XRP + a stablecoin pair
        # TODO: Implement proper dual-asset AMM creation
        
        logger.info("AMM pool creation - placeholder implementation")
        logger.info("TODO: Implement AMMCreate transaction")
        
        # Store pool in database
        pool_id = await self._store_pool(
            amm_account="rAMMAccountPlaceholder",
            asset_type=asset_type,
            total_capital=initial_drops,
            available_capital=initial_drops
        )
        
        self.pool_id = pool_id
        logger.info(f"Pool created: {pool_id}")
        
        return pool_id
    
    async def deposit_capital(
        self,
        lp_wallet: Wallet,
        amount_xrp: float
    ) -> Dict[str, Any]:
        """
        LP deposits capital into pool.
        
        Args:
            lp_wallet: Liquidity provider wallet
            amount_xrp: Amount to deposit
        
        Returns:
            Dictionary with LP tokens received
        """
        logger.info(f"LP deposit: {amount_xrp:,.2f} XRP from {lp_wallet.address}")
        
        amount_drops = xrp_to_drops(str(amount_xrp))
        
        # AMMDeposit transaction
        # TODO: Implement actual AMMDeposit
        logger.info("AMMDeposit - placeholder implementation")
        
        # Update pool state
        metrics = await self.get_metrics()
        new_capital = metrics.total_capital + amount_drops
        new_available = metrics.available_capital + amount_drops
        
        await self._update_pool_state(
            total_capital=new_capital,
            available_capital=new_available
        )
        
        logger.info(f"Capital deposited. New total: {drops_to_xrp(str(new_capital))} XRP")
        
        return {
            "deposited": amount_drops,
            "lp_tokens": amount_drops,  # Simplified 1:1
            "new_total_capital": new_capital
        }
    
    async def withdraw_capital(
        self,
        lp_wallet: Wallet,
        lp_tokens: int
    ) -> Dict[str, Any]:
        """
        LP withdraws capital from pool.
        
        Args:
            lp_wallet: Liquidity provider wallet
            lp_tokens: LP token amount to redeem
        
        Returns:
            Dictionary with capital returned
        """
        logger.info(f"LP withdrawal: {lp_tokens} tokens from {lp_wallet.address}")
        
        # Verify withdrawal doesn't breach coverage ratio
        metrics = await self.get_metrics()
        new_available = metrics.available_capital - lp_tokens
        
        if metrics.total_exposure > 0:
            new_ratio = new_available / metrics.total_exposure
            if new_ratio < self.MINIMUM_COVERAGE_RATIO:
                raise ValueError(
                    f"Withdrawal would breach coverage ratio: "
                    f"{new_ratio:.2%} < {self.MINIMUM_COVERAGE_RATIO:.0%}"
                )
        
        # AMMWithdraw transaction
        # TODO: Implement actual AMMWithdraw
        logger.info("AMMWithdraw - placeholder implementation")
        
        # Update pool state
        new_capital = metrics.total_capital - lp_tokens
        
        await self._update_pool_state(
            total_capital=new_capital,
            available_capital=new_available
        )
        
        logger.info(f"Capital withdrawn. New total: {drops_to_xrp(str(new_capital))} XRP")
        
        return {
            "withdrawn": lp_tokens,
            "new_total_capital": new_capital,
            "coverage_ratio": new_ratio if metrics.total_exposure > 0 else float('inf')
        }
    
    async def add_policy_exposure(
        self,
        policy_id: str,
        coverage_amount: int
    ):
        """
        Add policy to pool's exposure tracking.
        
        Args:
            policy_id: Policy UUID
            coverage_amount: Coverage in drops
        """
        metrics = await self.get_metrics()
        new_exposure = metrics.total_exposure + coverage_amount
        
        # Verify coverage ratio
        new_ratio = metrics.available_capital / new_exposure
        
        if new_ratio < self.MINIMUM_COVERAGE_RATIO:
            raise ValueError(
                f"Cannot issue policy: would breach coverage ratio "
                f"({new_ratio:.2%} < {self.MINIMUM_COVERAGE_RATIO:.0%})"
            )
        
        # Update pool
        await self._update_pool_exposure(
            total_exposure=new_exposure,
            active_policies_count=metrics.active_policies_count + 1
        )
        
        logger.info(
            f"Policy added: {coverage_amount / 1_000_000:.2f} XRP exposure. "
            f"Coverage ratio: {new_ratio:.2%}"
        )
    
    async def remove_policy_exposure(
        self,
        policy_id: str,
        coverage_amount: int
    ):
        """
        Remove policy from pool's exposure (expired/cancelled).
        
        Args:
            policy_id: Policy UUID
            coverage_amount: Coverage in drops
        """
        metrics = await self.get_metrics()
        new_exposure = max(0, metrics.total_exposure - coverage_amount)
        
        await self._update_pool_exposure(
            total_exposure=new_exposure,
            active_policies_count=max(0, metrics.active_policies_count - 1)
        )
        
        logger.info(f"Policy removed: {coverage_amount / 1_000_000:.2f} XRP exposure freed")
    
    async def process_claim_payout(
        self,
        claim_id: str,
        payout_amount: int,
        destination: str
    ) -> str:
        """
        Process insurance claim payout.
        
        Args:
            claim_id: Claim UUID
            payout_amount: Payout in drops
            destination: Recipient address
        
        Returns:
            Transaction hash
        """
        logger.info(f"Processing claim payout: {payout_amount / 1_000_000:.2f} XRP to {destination}")
        
        metrics = await self.get_metrics()
        
        # Verify sufficient capital
        if payout_amount > metrics.available_capital:
            raise ValueError(
                f"Insufficient pool capital: need {payout_amount / 1_000_000:.2f} XRP, "
                f"have {metrics.available_capital / 1_000_000:.2f} XRP"
            )
        
        # Create Payment transaction
        payment = Payment(
            account=self.wallet.address,
            destination=destination,
            amount=str(payout_amount)
        )
        
        response = await submit_and_wait(payment, self.client, self.wallet)
        
        if not response.is_successful():
            raise Exception(f"Payment failed: {response.result}")
        
        tx_hash = response.result['hash']
        
        # Update pool state
        new_available = metrics.available_capital - payout_amount
        new_claims_paid = metrics.total_claims_paid + payout_amount
        
        await self._update_pool_state(
            available_capital=new_available
        )
        
        await self._update_pool_claims(
            total_claims_paid=new_claims_paid
        )
        
        logger.info(f"Claim paid: {tx_hash}")
        
        return tx_hash
    
    async def get_metrics(self) -> PoolMetrics:
        """
        Get current pool metrics.
        
        Returns:
            PoolMetrics with current state
        """
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM insurance_pools WHERE pool_id = $1",
                self.pool_id
            )
        
        if not row:
            raise ValueError(f"Pool not found: {self.pool_id}")
        
        total_exposure = row['total_exposure']
        available_capital = row['available_capital']
        
        # Calculate coverage ratio
        if total_exposure > 0:
            coverage_ratio = available_capital / total_exposure
        else:
            coverage_ratio = float('inf')
        
        return PoolMetrics(
            pool_id=str(row['pool_id']),
            amm_account=row['amm_account'],
            asset_type=row['asset_type'],
            total_capital=row['total_capital'],
            available_capital=available_capital,
            total_exposure=total_exposure,
            coverage_ratio=coverage_ratio,
            active_policies_count=row['active_policies_count'],
            total_claims_paid=row['total_claims_paid'],
            lp_token_balance=row['total_capital']  # Simplified
        )
    
    async def _store_pool(
        self,
        amm_account: str,
        asset_type: str,
        total_capital: int,
        available_capital: int
    ) -> str:
        """Store new pool in database."""
        async with self.db.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO insurance_pools (
                    amm_account, asset_type, total_capital,
                    available_capital, total_exposure, coverage_ratio,
                    active_policies_count, total_claims_paid
                ) VALUES ($1, $2, $3, $4, 0, 0, 0, 0)
                RETURNING pool_id
                """,
                amm_account, asset_type, total_capital, available_capital
            )
            return str(row['pool_id'])
    
    async def _update_pool_state(
        self,
        total_capital: Optional[int] = None,
        available_capital: Optional[int] = None
    ):
        """Update pool capital state."""
        async with self.db.pool.acquire() as conn:
            if total_capital is not None and available_capital is not None:
                await conn.execute(
                    """
                    UPDATE insurance_pools
                    SET total_capital = $1, available_capital = $2, last_updated = NOW()
                    WHERE pool_id = $3
                    """,
                    total_capital, available_capital, self.pool_id
                )
            elif available_capital is not None:
                await conn.execute(
                    """
                    UPDATE insurance_pools
                    SET available_capital = $1, last_updated = NOW()
                    WHERE pool_id = $2
                    """,
                    available_capital, self.pool_id
                )
    
    async def _update_pool_exposure(
        self,
        total_exposure: int,
        active_policies_count: int
    ):
        """Update pool exposure tracking."""
        async with self.db.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE insurance_pools
                SET total_exposure = $1, 
                    active_policies_count = $2,
                    coverage_ratio = CASE 
                        WHEN $1 > 0 THEN available_capital::decimal / $1
                        ELSE 0
                    END,
                    last_updated = NOW()
                WHERE pool_id = $3
                """,
                total_exposure, active_policies_count, self.pool_id
            )
    
    async def _update_pool_claims(self, total_claims_paid: int):
        """Update total claims paid."""
        async with self.db.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE insurance_pools
                SET total_claims_paid = $1, last_updated = NOW()
                WHERE pool_id = $2
                """,
                total_claims_paid, self.pool_id
            )
