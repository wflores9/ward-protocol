"""LoanBroker state model for XLS-66 lending."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class LoanBroker:
    """
    Represents an XLS-66 LoanBroker ledger object.
    
    Tracks lending activity, first-loss capital, and coverage ratios.
    """
    loan_broker_id: str
    owner: str
    vault_id: str
    debt_total: int
    debt_maximum: int
    cover_available: int
    cover_rate_minimum: float  # Basis points / 10000
    cover_rate_liquidation: float  # Basis points / 10000
    management_fee_rate: int
    owner_count: int
    ledger_index: int
    
    @property
    def minimum_cover_required(self) -> int:
        """Calculate minimum first-loss capital required."""
        return int(self.debt_total * self.cover_rate_minimum)
    
    @property
    def max_liquidation_coverage(self) -> int:
        """Calculate maximum coverage on liquidation."""
        return int(self.minimum_cover_required * self.cover_rate_liquidation)
    
    @property
    def is_adequately_covered(self) -> bool:
        """Check if first-loss capital meets minimum requirements."""
        return self.cover_available >= self.minimum_cover_required
    
    @property
    def coverage_ratio(self) -> float:
        """
        Calculate coverage ratio.
        
        Returns:
            Ratio of available cover to minimum required (e.g., 1.5 = 150%)
        """
        if self.minimum_cover_required == 0:
            return float('inf')
        return self.cover_available / self.minimum_cover_required
    
    @classmethod
    def from_ledger_entry(cls, ledger_entry: dict) -> 'LoanBroker':
        """
        Create LoanBroker instance from XRPL ledger_entry response.
        
        Args:
            ledger_entry: Response from ledger_entry RPC call
        
        Returns:
            LoanBroker instance
        """
        node = ledger_entry.get('node', ledger_entry)
        
        # Convert basis points to decimal
        cover_rate_min = int(node.get('CoverRateMinimum', 0)) / 10000
        cover_rate_liq = int(node.get('CoverRateLiquidation', 0)) / 10000
        
        return cls(
            loan_broker_id=node.get('index', ''),
            owner=node.get('Owner', ''),
            vault_id=node.get('VaultID', ''),
            debt_total=int(node.get('DebtTotal', 0)),
            debt_maximum=int(node.get('DebtMaximum', 0)),
            cover_available=int(node.get('CoverAvailable', 0)),
            cover_rate_minimum=cover_rate_min,
            cover_rate_liquidation=cover_rate_liq,
            management_fee_rate=int(node.get('ManagementFeeRate', 0)),
            owner_count=int(node.get('OwnerCount', 0)),
            ledger_index=int(ledger_entry.get('ledger_index', 0))
        )
