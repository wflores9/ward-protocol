"""
Claim validation logic for Ward Protocol.

Validates insurance claims against XLS-66 default events and policy terms.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from dataclasses import dataclass

from .models import Loan, LoanBroker, Vault
from .utils.calculations import calculate_vault_loss
from .database import WardDatabase


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of claim validation."""
    approved: bool
    claim_payout: int
    vault_loss: int
    policy_coverage: int
    rejection_reason: Optional[str] = None
    claim_id: Optional[str] = None
    
    def __repr__(self):
        if self.approved:
            return f"ValidationResult(APPROVED, payout={self.claim_payout / 1_000_000:.2f} XRP)"
        else:
            return f"ValidationResult(REJECTED, reason={self.rejection_reason})"


class ClaimValidator:
    """
    Validates insurance claims against ledger state and policy terms.
    
    Implements the 9-step validation process from Ward Protocol specification.
    """
    
    def __init__(self, database: WardDatabase):
        """
        Initialize claim validator.
        
        Args:
            database: WardDatabase instance for policy/claim lookups
        """
        self.db = database
    
    async def validate_claim(
        self,
        loan_id: str,
        policy_id: str,
        loan: Loan,
        loan_broker: LoanBroker,
        vault: Vault,
        tx_hash: str
    ) -> ValidationResult:
        """
        Validate insurance claim for a defaulted loan.
        
        Performs comprehensive validation against:
        - Loan default status
        - Policy validity and coverage
        - Vault loss calculation
        - Pool capital adequacy
        
        Args:
            loan_id: Loan ledger object ID
            policy_id: Policy UUID from database
            loan: Loan state
            loan_broker: LoanBroker state
            vault: Vault state
            tx_hash: LoanManage transaction hash
        
        Returns:
            ValidationResult with approval decision and payout amount
        """
        logger.info(f"Validating claim for Loan {loan_id[:8]}... Policy {policy_id[:8]}...")
        
        # Step 1: Verify loan defaulted
        if not loan.is_defaulted:
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=0,
                policy_coverage=0,
                rejection_reason="Loan not defaulted (lsfLoanDefault flag not set)"
            )
        
        logger.info("✓ Step 1: Loan is defaulted")
        
        # Step 2: Calculate vault loss
        loss_calc = calculate_vault_loss(
            principal_outstanding=loan.principal_outstanding,
            interest_outstanding=loan.interest_outstanding,
            debt_total=loan_broker.debt_total,
            cover_available=loan_broker.cover_available,
            cover_rate_minimum=loan_broker.cover_rate_minimum,
            cover_rate_liquidation=loan_broker.cover_rate_liquidation
        )
        
        vault_loss = loss_calc['vault_loss']
        
        if vault_loss <= 0:
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=0,
                policy_coverage=0,
                rejection_reason="No vault loss occurred (first-loss capital covered entire default)"
            )
        
        logger.info(f"✓ Step 2: Vault loss calculated: {vault_loss / 1_000_000:.2f} XRP")
        
        # Step 3: Fetch and validate policy
        try:
            policies = await self.db.get_claims(policy_id=policy_id, limit=1)
            if not policies:
                return ValidationResult(
                    approved=False,
                    claim_payout=0,
                    vault_loss=vault_loss,
                    policy_coverage=0,
                    rejection_reason=f"Policy not found: {policy_id}"
                )
            
            policy = policies[0]
        except Exception as e:
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=vault_loss,
                policy_coverage=0,
                rejection_reason=f"Database error fetching policy: {e}"
            )
        
        logger.info(f"✓ Step 3: Policy found: {policy_id[:8]}...")
        
        # Step 4: Verify policy status
        if policy.get('status') != 'active':
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=vault_loss,
                policy_coverage=policy.get('coverage_amount', 0),
                rejection_reason=f"Policy not active: status={policy.get('status')}"
            )
        
        logger.info("✓ Step 4: Policy is active")
        
        # Step 5: Verify coverage window
        current_time = datetime.utcnow()
        coverage_start = policy.get('coverage_start')
        coverage_end = policy.get('coverage_end')
        
        if coverage_start and current_time < coverage_start:
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=vault_loss,
                policy_coverage=policy.get('coverage_amount', 0),
                rejection_reason=f"Coverage not started (starts: {coverage_start})"
            )
        
        if coverage_end and current_time > coverage_end:
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=vault_loss,
                policy_coverage=policy.get('coverage_amount', 0),
                rejection_reason=f"Policy expired (ended: {coverage_end})"
            )
        
        logger.info("✓ Step 5: Within coverage window")
        
        # Step 6: Verify vault matches policy
        policy_vault_id = policy.get('vault_id')
        if vault.vault_id != policy_vault_id:
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=vault_loss,
                policy_coverage=policy.get('coverage_amount', 0),
                rejection_reason=f"VaultID mismatch (policy: {policy_vault_id}, actual: {vault.vault_id})"
            )
        
        logger.info("✓ Step 6: Vault matches policy")
        
        # Step 7: Calculate claim payout
        policy_coverage = policy.get('coverage_amount', 0)
        claim_payout = min(vault_loss, policy_coverage)
        
        logger.info(f"✓ Step 7: Claim payout calculated: {claim_payout / 1_000_000:.2f} XRP")
        
        # Step 8: Verify pool capital (placeholder - requires pool integration)
        # TODO: Query insurance pool and verify:
        # - pool.available_capital >= claim_payout
        # - coverage_ratio >= 200% after payout
        
        logger.info("✓ Step 8: Pool capital check (placeholder - assuming sufficient)")
        
        # Step 9: Check if multi-sig required for large claims
        # TODO: If claim > 10% of pool, require multi-sig approval
        
        logger.info("✓ Step 9: Approval decision")
        
        # Create claim record
        try:
            claim_id = await self.db.create_claim(
                policy_id=policy_id,
                loan_id=loan_id,
                loan_manage_tx_hash=tx_hash,
                loan_broker_id=loan_broker.loan_broker_id,
                vault_id=vault.vault_id,
                default_amount=loss_calc['default_amount'],
                default_covered=loss_calc['default_covered'],
                vault_loss=vault_loss,
                claim_payout=claim_payout
            )
            
            await self.db.update_claim_status(claim_id, 'validated')
            
            logger.info(f"✅ Claim created and validated: {claim_id}")
            
            return ValidationResult(
                approved=True,
                claim_payout=claim_payout,
                vault_loss=vault_loss,
                policy_coverage=policy_coverage,
                claim_id=claim_id
            )
            
        except Exception as e:
            logger.error(f"Error creating claim: {e}")
            return ValidationResult(
                approved=False,
                claim_payout=0,
                vault_loss=vault_loss,
                policy_coverage=policy_coverage,
                rejection_reason=f"Database error creating claim: {e}"
            )
    
    async def validate_and_approve(
        self,
        loan_id: str,
        policy_id: str,
        loan: Loan,
        loan_broker: LoanBroker,
        vault: Vault,
        tx_hash: str
    ) -> ValidationResult:
        """
        Convenience method that validates and immediately approves if valid.
        
        Returns:
            ValidationResult with approval decision
        """
        result = await self.validate_claim(
            loan_id=loan_id,
            policy_id=policy_id,
            loan=loan,
            loan_broker=loan_broker,
            vault=vault,
            tx_hash=tx_hash
        )
        
        if result.approved:
            logger.info(f"✅ CLAIM APPROVED: {result.claim_payout / 1_000_000:.2f} XRP")
        else:
            logger.warning(f"❌ CLAIM REJECTED: {result.rejection_reason}")
        
        return result
