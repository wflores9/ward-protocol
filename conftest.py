"""
conftest.py — pytest configuration for Ward Protocol SDK

Provides:
  - asyncio_mode = "auto"  (pytest-asyncio — no decorator needed on every test)
  - Common fixtures: valid_address, valid_address2, valid_nft_id, valid_loan_id
  - Marker registration (mirrors pytest.ini and pyproject.toml)

Ward SDK v0.2.2
"""

import pytest


# ---------------------------------------------------------------------------
# pytest-asyncio: set event loop scope to function (default, safest)
# ---------------------------------------------------------------------------

def pytest_configure(config):
    """Register custom marks to avoid PytestUnknownMarkWarning."""
    config.addinivalue_line("markers", "unit: Unit tests — no XRPL network required")
    config.addinivalue_line("markers", "integration: Integration tests — hit XRPL testnet")
    config.addinivalue_line("markers", "slow: Slow-running tests")


# ---------------------------------------------------------------------------
# Common XRPL test addresses (valid Base58Check, not reserved)
# ---------------------------------------------------------------------------

VALID_ADDRESS  = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
VALID_ADDRESS2 = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"


@pytest.fixture
def valid_address() -> str:
    """A valid XRPL classic address for test use."""
    return VALID_ADDRESS


@pytest.fixture
def valid_address2() -> str:
    """A second valid XRPL classic address for test use."""
    return VALID_ADDRESS2


@pytest.fixture
def valid_nft_id() -> str:
    """A valid 64-char uppercase hex NFTokenID."""
    return "A" * 64


@pytest.fixture
def valid_loan_id() -> str:
    """A valid 64-char uppercase hex loan ledger-object ID."""
    return "B" * 64
