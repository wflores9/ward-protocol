"""Shared configuration guards for institutional-grade chain adapters."""

from __future__ import annotations


def require_non_placeholder(
    value: str,
    *,
    field_name: str,
    invalid_values: set[str],
) -> str:
    """Reject placeholder configuration that would silently misroute funds."""
    if value in invalid_values:
        raise ValueError(
            f"{field_name} must be explicitly configured; placeholder defaults are blocked"
        )
    return value
