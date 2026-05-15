"""
ward/keys.py — Institution API key management.

Keys are generated with cryptographic randomness.
Only SHA-256 hashes are stored — raw keys never persisted.
Each key is scoped to a tier and has an optional expiry.

ward_signed = False — always.
"""

import asyncio
import hashlib
import logging
import secrets
import time
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)

KEY_PREFIX = "ward_"
KEY_BYTES = 32  # 256 bits of entropy

_VALID_TIERS = frozenset({"starter", "standard", "enterprise"})


@dataclass
class KeyRecord:
    key_hash: str  # SHA-256 of raw key — never store raw
    tier: str  # starter / standard / enterprise
    label: str  # institution name or identifier
    created_at: int  # Unix timestamp
    expires_at: Optional[int] = None  # None = no expiry
    revoked: bool = False
    last_used_at: Optional[int] = None
    vault_count: int = 0


# In-memory key store — keyed by SHA-256 hash
_key_store: dict[str, KeyRecord] = {}
_store_lock = asyncio.Lock()


def _hash_key(raw_key: str) -> str:
    """SHA-256 hash of raw key. Constant-time safe."""
    return hashlib.sha256(raw_key.encode()).hexdigest()


def generate_key(tier: str = "starter", label: str = "") -> str:
    """
    Generate a cryptographically secure institution key.
    Returns the RAW key — caller must store it securely.
    The raw key is never stored here.
    """
    if tier not in _VALID_TIERS:
        raise ValueError(f"Invalid tier: {tier!r}")
    raw = KEY_PREFIX + secrets.token_urlsafe(KEY_BYTES)
    return raw


async def register_key(
    raw_key: str,
    tier: str = "starter",
    label: str = "",
    expires_at: Optional[int] = None,
) -> KeyRecord:
    """
    Register a key hash in the store.
    Raw key must be provided to hash — it is not stored.
    """
    if not raw_key.startswith(KEY_PREFIX):
        raise ValueError(f"Key must start with '{KEY_PREFIX}'")

    key_hash = _hash_key(raw_key)

    async with _store_lock:
        if key_hash in _key_store:
            raise ValueError("Key already registered")

        record = KeyRecord(
            key_hash=key_hash,
            tier=tier,
            label=label,
            created_at=int(time.time()),
            expires_at=expires_at,
        )
        _key_store[key_hash] = record
        logger.info(
            "Key registered: tier=%s label=%r hash=%s...",
            tier,
            label,
            key_hash[:8],
        )
        return record


async def verify_key(raw_key: str) -> Optional[KeyRecord]:
    """
    Verify a raw key and return its record if valid.
    Returns None if key is invalid, revoked, or expired.
    Updates last_used_at on success.
    """
    key_hash = _hash_key(raw_key)

    async with _store_lock:
        record = _key_store.get(key_hash)
        if record is None:
            return None
        if record.revoked:
            logger.warning("Revoked key used: %s...", key_hash[:8])
            return None
        if record.expires_at and int(time.time()) > record.expires_at:
            logger.warning("Expired key used: %s...", key_hash[:8])
            return None
        record.last_used_at = int(time.time())
        return record


async def revoke_key(raw_key: str) -> bool:
    """Revoke a key. Returns True if found and revoked."""
    key_hash = _hash_key(raw_key)
    async with _store_lock:
        record = _key_store.get(key_hash)
        if record is None:
            return False
        record.revoked = True
        logger.info("Key revoked: %s...", key_hash[:8])
        return True


async def rotate_key(
    old_raw_key: str, tier: Optional[str] = None
) -> tuple[str, KeyRecord]:
    """
    Generate a new key, register it with same tier/label as old key.
    Old key is NOT automatically revoked — caller must revoke it.
    Returns (new_raw_key, new_record).
    """
    old_hash = _hash_key(old_raw_key)
    async with _store_lock:
        old_record = _key_store.get(old_hash)
        if old_record is None:
            raise ValueError("Old key not found")

    new_raw = generate_key(tier=tier or old_record.tier, label=old_record.label)
    new_record = await register_key(
        new_raw,
        tier=tier or old_record.tier,
        label=old_record.label,
    )
    return new_raw, new_record


async def list_keys() -> list[KeyRecord]:
    """List all key records — admin use only. Never returns raw keys."""
    async with _store_lock:
        return list(_key_store.values())


def clear_keys() -> None:
    """Clear all key records — for testing only."""
    _key_store.clear()
