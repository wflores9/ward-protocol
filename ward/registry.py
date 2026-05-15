"""
ward/registry.py — Institution vault registry.

Maps institution key hashes to lists of registered vault addresses.
In-memory for now — persistent store recommended for production.

ward_signed = False — always.
"""

import asyncio
import hashlib
import logging
from collections import defaultdict
from typing import Optional

from ward.primitives import WardError, validate_xrpl_address
from ward.constants import VaultRegistration

logger = logging.getLogger(__name__)

_registry: dict[str, list[VaultRegistration]] = defaultdict(list)
_registry_lock = asyncio.Lock()

_VALID_TIERS = frozenset({"starter", "standard", "enterprise"})


def _hash_key(institution_key: str) -> str:
    """SHA-256 hash of institution key — never store raw keys."""
    return hashlib.sha256(institution_key.encode()).hexdigest()


async def register_vault(
    institution_key: str,
    vault_address: str,
    tier: str = "starter",
    label: str = "",
    ledger_time: int = 0,
) -> VaultRegistration:
    """
    Register a vault address under an institution key.
    One institution key can have multiple vault addresses.
    Raises WardError if vault_address is already registered under this key.
    """
    validate_xrpl_address(vault_address)
    if tier not in _VALID_TIERS:
        raise WardError(f"Invalid tier: {tier!r}. Must be one of {sorted(_VALID_TIERS)}")

    key_hash = _hash_key(institution_key)

    async with _registry_lock:
        existing = _registry[key_hash]
        for entry in existing:
            if entry["vault_address"] == vault_address:
                raise WardError(
                    f"Vault {vault_address} already registered under this institution key"
                )

        entry: VaultRegistration = {
            "vault_address": vault_address,
            "institution_key_hash": key_hash,
            "registered_at": ledger_time,
            "tier": tier,
            "label": label or vault_address[:8] + "...",
        }
        _registry[key_hash].append(entry)
        logger.info(
            "Vault registered: %s (tier=%s, institution=%s...)",
            vault_address, tier, key_hash[:8],
        )
        return entry


async def get_vaults(institution_key: str) -> list[VaultRegistration]:
    """Return all vault registrations for an institution key."""
    key_hash = _hash_key(institution_key)
    async with _registry_lock:
        return list(_registry.get(key_hash, []))


async def get_vault(
    institution_key: str,
    vault_address: str,
) -> Optional[VaultRegistration]:
    """Return a specific vault registration, or None if not found."""
    vaults = await get_vaults(institution_key)
    for v in vaults:
        if v["vault_address"] == vault_address:
            return v
    return None


async def deregister_vault(
    institution_key: str,
    vault_address: str,
) -> bool:
    """Remove a vault registration. Returns True if removed, False if not found."""
    key_hash = _hash_key(institution_key)
    async with _registry_lock:
        before = len(_registry[key_hash])
        _registry[key_hash] = [
            v for v in _registry[key_hash]
            if v["vault_address"] != vault_address
        ]
        removed = len(_registry[key_hash]) < before
        if removed:
            logger.info("Vault deregistered: %s", vault_address)
        return removed


async def list_all_institutions() -> dict[str, list[VaultRegistration]]:
    """Return full registry — admin use only."""
    async with _registry_lock:
        return dict(_registry)


def clear_registry() -> None:
    """Clear all registrations — for testing only."""
    _registry.clear()
