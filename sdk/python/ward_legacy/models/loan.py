"""Loan state model for XLS-66 loans."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Loan:
    """
    Represents an XLS-66 Loan ledger object.
    
    Tracks loan state including outstanding amounts, payment schedule,
    and default status.
    """
    loan_id: str
    loan_broker_id: str
    borrower: str
    principal_outstanding: int
    total_value_outstanding: int
    interest_outstanding: int
    management_fee_outstanding: int
    next_payment_due_date: Optional[datetime]
    grace_period: int  # seconds
    flags: int
    ledger_index: int
    
    # Flags from XLS-66 spec
    LSF_LOAN_DEFAULT = 0x00010000
    LSF_LOAN_IMPAIRED = 0x00020000
    LSF_LOAN_OVERPAYMENT = 0x00040000
    
    @property
    def is_defaulted(self) -> bool:
        """Check if loan has defaulted."""
        return bool(self.flags & self.LSF_LOAN_DEFAULT)
    
    @property
    def is_impaired(self) -> bool:
        """Check if loan is impaired (early warning signal)."""
        return bool(self.flags & self.LSF_LOAN_IMPAIRED)
    
    @property
    def allows_overpayment(self) -> bool:
        """Check if loan allows overpayment."""
        return bool(self.flags & self.LSF_LOAN_OVERPAYMENT)
    
    @classmethod
    def from_ledger_entry(cls, ledger_entry: dict) -> 'Loan':
        """
        Create Loan instance from XRPL ledger_entry response.
        
        Args:
            ledger_entry: Response from ledger_entry RPC call
        
        Returns:
            Loan instance
        """
        node = ledger_entry.get('node', ledger_entry)
        
        # Parse payment due date if present
        next_payment_due = None
        if 'NextPaymentDueDate' in node:
            # Convert Ripple epoch to datetime
            ripple_epoch = node['NextPaymentDueDate']
            unix_epoch = ripple_epoch + 946684800  # Ripple epoch offset
            next_payment_due = datetime.utcfromtimestamp(unix_epoch)
        
        return cls(
            loan_id=node.get('index', ''),
            loan_broker_id=node.get('LoanBrokerID', ''),
            borrower=node.get('Borrower', ''),
            principal_outstanding=int(node.get('PrincipalOutstanding', 0)),
            total_value_outstanding=int(node.get('TotalValueOutstanding', 0)),
            interest_outstanding=int(node.get('InterestOutstanding', 0)),
            management_fee_outstanding=int(node.get('ManagementFeeOutstanding', 0)),
            next_payment_due_date=next_payment_due,
            grace_period=int(node.get('GracePeriod', 0)),
            flags=int(node.get('Flags', 0)),
            ledger_index=int(ledger_entry.get('ledger_index', 0))
        )
