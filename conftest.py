"""
conftest.py — pytest configuration for Ward Protocol SDK

Provides:
  - asyncio_mode = "auto"  (pytest-asyncio — no decorator needed on every test)
  - Common fixtures: valid_address, valid_address2, valid_nft_id, valid_loan_id
  - Marker registration (mirrors pytest.ini and pyproject.toml)
  - _ward_test_network_env autouse fixture: sets WARD_XRPL_URL / WARD_XRPL_WS /
    WARD_NETWORK for every test so constructors that no longer have a default URL
    work without each test explicitly passing one.

Ward SDK v0.2.6
"""

import pytest

# ---------------------------------------------------------------------------
# pytest-asyncio: set event loop scope to function (default, safest)
# ---------------------------------------------------------------------------


def pytest_configure(config):
    """Register custom marks to avoid PytestUnknownMarkWarning."""
    config.addinivalue_line("markers", "unit: Unit tests — no XRPL network required")
    config.addinivalue_line(
        "markers", "integration: Integration tests — hit XRPL testnet"
    )
    config.addinivalue_line("markers", "slow: Slow-running tests")


# ---------------------------------------------------------------------------
# Common XRPL test addresses (valid Base58Check, not reserved)
# ---------------------------------------------------------------------------

VALID_ADDRESS = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
VALID_ADDRESS2 = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"


@pytest.fixture(autouse=True)
def _ward_test_network_env(monkeypatch):
    """
    Set WARD_XRPL_URL / WARD_XRPL_WS / WARD_NETWORK for every test.

    Ward constructors no longer have a hardcoded Altnet default (B1 mainnet fix).
    This fixture ensures all unit tests that call constructors without an explicit
    URL continue to work against testnet without each test having to configure env.
    Tests that need to exercise the ConfigurationError path explicitly should use
    monkeypatch to remove these env vars within their test body.
    """
    monkeypatch.setenv("WARD_XRPL_URL", "https://s.altnet.rippletest.net:51234/")
    monkeypatch.setenv("WARD_XRPL_WS", "wss://s.altnet.rippletest.net:51233/")
    monkeypatch.setenv("WARD_NETWORK", "testnet")


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
