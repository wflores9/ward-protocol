"""Vault state model for XLS-65 vaults."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Vault:
    """
    Represents an XLS-65 Vault ledger object.
    
    Tracks pooled depositor funds and loss exposure.
    """
    vault_id: str
    owner: str
    account: str  # Pseudo-account address
    asset: dict  # Asset type (XRP, IOU, or MPT)
    assets_total: int
    assets_available: int
    loss_unrealized: int
    shares_total: int
    share_mpt_id: str
    ledger_index: int
    
    @property
    def real_vault_value(self) -> int:
        """
        Calculate real vault value accounting for unrealized losses.
        
        Returns:
            AssetsTotal - LossUnrealized (in drops)
        """
        return self.assets_total - self.loss_unrealized
    
    @property
    def share_value(self) -> float:
        """
        Calculate current share value.
        
        Uses XLS-65 formula:
        ShareValue = (AssetsTotal - LossUnrealized) / SharesTotal
        
        Returns:
            Share value in XRP (or asset units)
        """
        if self.shares_total == 0:
            return 0.0
        
        DROPS_PER_XRP = 1_000_000
        value_drops = self.real_vault_value / self.shares_total
        return value_drops / DROPS_PER_XRP
    
    @property
    def utilization_rate(self) -> float:
        """
        Calculate vault utilization rate.
        
        Returns:
            (AssetsTotal - AssetsAvailable) / AssetsTotal
        """
        if self.assets_total == 0:
            return 0.0
        
        deployed = self.assets_total - self.assets_available
        return deployed / self.assets_total
    
    @property
    def impairment_ratio(self) -> float:
        """
        Calculate impairment ratio.
        
        Returns:
            LossUnrealized / AssetsTotal
        """
        if self.assets_total == 0:
            return 0.0
        
        return self.loss_unrealized / self.assets_total
    
    @classmethod
    def from_ledger_entry(cls, ledger_entry: dict) -> 'Vault':
        """
        Create Vault instance from XRPL ledger_entry response.
        
        Args:
            ledger_entry: Response from ledger_entry RPC call
        
        Returns:
            Vault instance
        """
        node = ledger_entry.get('node', ledger_entry)
        
        return cls(
            vault_id=node.get('index', ''),
            owner=node.get('Owner', ''),
            account=node.get('Account', ''),
            asset=node.get('Asset', {}),
            assets_total=int(node.get('AssetsTotal', 0)),
            assets_available=int(node.get('AssetsAvailable', 0)),
            loss_unrealized=int(node.get('LossUnrealized', 0)),
            shares_total=int(node.get('SharesTotal', 0)),
            share_mpt_id=node.get('ShareMPTID', ''),
            ledger_index=int(ledger_entry.get('ledger_index', 0))
        )
