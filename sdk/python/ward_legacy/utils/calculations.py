"""
XLS-66 Lending Protocol calculations.

Implements formulas from XLS-66 specification for:
- Default loss calculation
- First-loss capital coverage
- Vault depositor impact
"""

from typing import Dict, Optional


def calculate_vault_loss(
    principal_outstanding: int,
    interest_outstanding: int,
    debt_total: int,
    cover_available: int,
    cover_rate_minimum: float,
    cover_rate_liquidation: float
) -> Dict[str, int]:
    """
    Calculate vault depositor loss from XLS-66 loan default.
    
    Formula from XLS-66 specification section 4.2.3:
    
    DefaultAmount = PrincipalOutstanding + InterestOutstanding
    MinimumCover = DebtTotal × CoverRateMinimum
    DefaultCovered = min(
        MinimumCover × CoverRateLiquidation,
        DefaultAmount,
        CoverAvailable
    )
    VaultLoss = DefaultAmount - DefaultCovered
    
    Args:
        principal_outstanding: Remaining principal in drops
        interest_outstanding: Accrued interest in drops
        debt_total: Total LoanBroker debt in drops
        cover_available: First-loss capital available in drops
        cover_rate_minimum: Minimum coverage ratio (e.g., 0.10 for 10%)
        cover_rate_liquidation: Liquidation ratio (e.g., 0.50 for 50%)
    
    Returns:
        Dictionary with:
            - default_amount: Total amount owed
            - minimum_cover: Required minimum coverage
            - default_covered: Amount covered by first-loss capital
            - vault_loss: Uninsured loss to vault depositors
    """
    default_amount = principal_outstanding + interest_outstanding
    
    minimum_cover = int(debt_total * cover_rate_minimum)
    
    default_covered = min(
        int(minimum_cover * cover_rate_liquidation),
        default_amount,
        cover_available
    )
    
    vault_loss = default_amount - default_covered
    
    return {
        "default_amount": default_amount,
        "minimum_cover": minimum_cover,
        "default_covered": default_covered,
        "vault_loss": vault_loss
    }


def calculate_share_value_impact(
    assets_total_before: int,
    loss_unrealized: int,
    shares_total: int,
    vault_loss: int
) -> Dict[str, float]:
    """
    Calculate impact of vault loss on depositor share values.
    
    Uses XLS-65 share value formula:
    ShareValue = (AssetsTotal - LossUnrealized) / SharesTotal
    
    Args:
        assets_total_before: Vault.AssetsTotal before default (drops)
        loss_unrealized: Vault.LossUnrealized (impaired loans, drops)
        shares_total: Total vault shares issued
        vault_loss: Loss from default (drops)
    
    Returns:
        Dictionary with:
            - share_value_before: Share value before default (XRP)
            - share_value_after: Share value after default (XRP)
            - loss_per_share: Loss per share (XRP)
            - loss_percentage: Percentage loss
    """
    DROPS_PER_XRP = 1_000_000
    
    # Share value before default
    value_before_drops = (assets_total_before - loss_unrealized) / shares_total
    value_before = value_before_drops / DROPS_PER_XRP
    
    # Share value after default
    assets_total_after = assets_total_before - vault_loss
    value_after_drops = (assets_total_after - loss_unrealized) / shares_total
    value_after = value_after_drops / DROPS_PER_XRP
    
    # Calculate loss metrics
    loss_per_share = value_before - value_after
    loss_percentage = (loss_per_share / value_before) * 100 if value_before > 0 else 0
    
    return {
        "share_value_before": value_before,
        "share_value_after": value_after,
        "loss_per_share": loss_per_share,
        "loss_percentage": loss_percentage
    }


def drops_to_xrp(drops: int) -> float:
    """Convert drops to XRP."""
    return drops / 1_000_000


def xrp_to_drops(xrp: float) -> int:
    """Convert XRP to drops."""
    return int(xrp * 1_000_000)
