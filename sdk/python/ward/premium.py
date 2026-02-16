"""
Premium calculation engine for Ward Protocol.

Risk-based pricing for insurance policies using vault and loan metrics.
"""

import logging
from typing import Dict, Optional
from decimal import Decimal

from .models import Vault, LoanBroker


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PremiumCalculator:
    """
    Calculates insurance premiums based on risk factors.
    
    Implements the premium pricing formula from XLS-103d Appendix B.3:
    
    premium = coverage_amount * base_rate * term_factor * risk_multiplier
    
    Where:
    - base_rate: 1-5% annually based on risk tier
    - term_factor: term_days / 365
    - risk_multiplier: 0.5 - 2.0 based on vault/broker health
    """
    
    # Base annual rates by risk tier
    BASE_RATES = {
        'safest': 0.01,      # 1% - Best conditions
        'safe': 0.02,        # 2%
        'moderate': 0.03,    # 3%
        'elevated': 0.04,    # 4%
        'high': 0.05         # 5% - Highest risk
    }
    
    def __init__(
        self,
        min_multiplier: float = 0.5,
        max_multiplier: float = 2.0
    ):
        """
        Initialize premium calculator.
        
        Args:
            min_multiplier: Minimum risk multiplier (discount)
            max_multiplier: Maximum risk multiplier (penalty)
        """
        self.min_multiplier = min_multiplier
        self.max_multiplier = max_multiplier
    
    def calculate_premium(
        self,
        coverage_amount: int,
        term_days: int,
        vault: Vault,
        loan_broker: LoanBroker,
        historical_default_rate: Optional[float] = None
    ) -> Dict[str, any]:
        """
        Calculate insurance premium.
        
        Args:
            coverage_amount: Coverage in drops
            term_days: Policy term in days
            vault: Vault state for risk assessment
            loan_broker: LoanBroker state for risk assessment
            historical_default_rate: Optional historical default rate (0.0-1.0)
        
        Returns:
            Dictionary with:
                - premium: Total premium in drops
                - base_rate: Annual base rate used
                - risk_tier: Risk tier classification
                - risk_multiplier: Applied multiplier
                - term_factor: Term adjustment factor
                - risk_factors: Breakdown of risk assessment
        """
        logger.info(f"Calculating premium for {coverage_amount / 1_000_000:.0f} XRP coverage")
        
        # Determine base rate tier
        base_rate, risk_tier = self._calculate_base_rate(vault, loan_broker)
        
        # Calculate risk multiplier
        risk_multiplier, risk_factors = self._calculate_risk_multiplier(
            vault=vault,
            loan_broker=loan_broker,
            historical_default_rate=historical_default_rate
        )
        
        # Term adjustment
        term_factor = term_days / 365.0
        
        # Final premium calculation
        premium = int(
            coverage_amount * 
            base_rate * 
            term_factor * 
            risk_multiplier
        )
        
        logger.info(
            f"Premium calculated: {premium / 1_000_000:.2f} XRP "
            f"(tier={risk_tier}, multiplier={risk_multiplier:.2f}x)"
        )
        
        return {
            'premium': premium,
            'base_rate': base_rate,
            'risk_tier': risk_tier,
            'risk_multiplier': risk_multiplier,
            'term_factor': term_factor,
            'risk_factors': risk_factors,
            'annual_rate_effective': base_rate * risk_multiplier
        }
    
    def _calculate_base_rate(
        self,
        vault: Vault,
        loan_broker: LoanBroker
    ) -> tuple[float, str]:
        """
        Determine base rate tier from vault and broker health.
        
        Returns:
            (base_rate, risk_tier)
        """
        # Calculate key metrics
        utilization = self._get_utilization(vault, loan_broker)
        coverage_ratio = self._get_coverage_ratio(loan_broker)
        impairment_ratio = vault.impairment_ratio
        
        # Tier assignment logic
        if coverage_ratio >= 2.0 and impairment_ratio < 0.01 and utilization < 0.5:
            return self.BASE_RATES['safest'], 'safest'
        elif coverage_ratio >= 1.5 and impairment_ratio < 0.05 and utilization < 0.7:
            return self.BASE_RATES['safe'], 'safe'
        elif coverage_ratio >= 1.0 and impairment_ratio < 0.10 and utilization < 0.85:
            return self.BASE_RATES['moderate'], 'moderate'
        elif coverage_ratio >= 0.5 and impairment_ratio < 0.20 and utilization < 0.95:
            return self.BASE_RATES['elevated'], 'elevated'
        else:
            return self.BASE_RATES['high'], 'high'
    
    def _calculate_risk_multiplier(
        self,
        vault: Vault,
        loan_broker: LoanBroker,
        historical_default_rate: Optional[float]
    ) -> tuple[float, Dict[str, float]]:
        """
        Calculate risk multiplier based on multiple factors.
        
        Returns:
            (risk_multiplier, risk_factors_breakdown)
        """
        factors = {}
        total_adjustment = 1.0
        
        # Factor 1: Utilization rate
        utilization = self._get_utilization(vault, loan_broker)
        factors['utilization'] = utilization
        
        if utilization > 0.9:
            total_adjustment *= 1.5  # 50% penalty
        elif utilization > 0.8:
            total_adjustment *= 1.25
        elif utilization < 0.3:
            total_adjustment *= 0.75  # 25% discount
        
        # Factor 2: Coverage ratio
        coverage_ratio = self._get_coverage_ratio(loan_broker)
        factors['coverage_ratio'] = coverage_ratio
        
        if coverage_ratio < 1.0:
            total_adjustment *= 1.8  # 80% penalty (critical)
        elif coverage_ratio < 1.5:
            total_adjustment *= 1.3
        elif coverage_ratio > 3.0:
            total_adjustment *= 0.8  # 20% discount
        
        # Factor 3: Impairment ratio
        impairment = vault.impairment_ratio
        factors['impairment_ratio'] = impairment
        
        if impairment > 0.2:
            total_adjustment *= 1.6  # 60% penalty
        elif impairment > 0.1:
            total_adjustment *= 1.3
        elif impairment == 0:
            total_adjustment *= 0.9  # 10% discount
        
        # Factor 4: Historical default rate (if available)
        if historical_default_rate is not None:
            factors['historical_default_rate'] = historical_default_rate
            
            if historical_default_rate > 0.1:  # >10% default rate
                total_adjustment *= 1.5
            elif historical_default_rate > 0.05:
                total_adjustment *= 1.2
            elif historical_default_rate < 0.01:
                total_adjustment *= 0.85
        
        # Clamp to min/max bounds
        risk_multiplier = max(
            self.min_multiplier,
            min(self.max_multiplier, total_adjustment)
        )
        
        factors['final_multiplier'] = risk_multiplier
        
        return risk_multiplier, factors
    
    def _get_utilization(self, vault: Vault, loan_broker: LoanBroker) -> float:
        """
        Calculate vault utilization rate.
        
        Returns:
            Utilization ratio (0.0 - 1.0)
        """
        if vault.assets_total == 0:
            return 0.0
        
        deployed = vault.assets_total - vault.assets_available
        return deployed / vault.assets_total
    
    def _get_coverage_ratio(self, loan_broker: LoanBroker) -> float:
        """
        Calculate first-loss capital coverage ratio.
        
        Returns:
            Coverage ratio (e.g., 1.5 = 150%)
        """
        return loan_broker.coverage_ratio
    
    def estimate_annual_cost(
        self,
        coverage_amount: int,
        vault: Vault,
        loan_broker: LoanBroker
    ) -> Dict[str, int]:
        """
        Estimate annual insurance cost.
        
        Args:
            coverage_amount: Coverage in drops
            vault: Vault state
            loan_broker: LoanBroker state
        
        Returns:
            Dictionary with cost estimates for different terms
        """
        # Calculate for 90-day term (typical)
        result_90 = self.calculate_premium(
            coverage_amount=coverage_amount,
            term_days=90,
            vault=vault,
            loan_broker=loan_broker
        )
        
        # Annualize
        premium_90 = result_90['premium']
        annual_cost = (premium_90 / 90) * 365
        
        return {
            'annual_cost': int(annual_cost),
            'quarterly_cost': premium_90,
            'monthly_cost': int(premium_90 / 3),
            'effective_annual_rate': result_90['annual_rate_effective'],
            'risk_tier': result_90['risk_tier']
        }
