# Ward Protocol — Mainnet Readiness Assessment

**Date:** 2026-06-10  
**Version:** 0.2.6  
**Status:** NOT READY FOR MAINNET — 4 blockers open

---

## Blocker Summary

| # | Blocker | File(s) | Remediation |
|---|---------|---------|-------------|
| B1 | Testnet URL is the default for all five core modules | validator.py, resolver.py, settlement.py, pool.py, vault_monitor.py, client.py | Require `WARD_XRPL_URL` / `WARD_XRPL_WS` env vars; no hardcoded default |
| B2 | Rate limiter is in-memory — bypassed across instances or restarts | primitives.py | Migrate to Redis-backed sliding window |
| B3 | Settlement lock falls back to in-memory on Redis unavail | settlement.py | Make Redis mandatory in production; add `WARD_REQUIRE_REDIS=true` guard |
| B4 | Coverage registry is per-instance in-memory | pool.py | Migrate to Redis-backed hash or deduplicate via claim validator gate |

---

## B1 — Testnet URL Defaults

### Current State

Every public-facing constructor accepts a `url` parameter with a testnet default:

```python
# ward/validator.py:72
class ClaimValidator:
    def __init__(self, url: str = DEFAULT_TESTNET_URL) -> None:

# ward/resolver.py:58
class Resolver:
    def __init__(self, url: str = DEFAULT_TESTNET_URL) -> None:

# ward/settlement.py:102
class EscrowSettlement:
    def __init__(self, xrpl_url: str = DEFAULT_TESTNET_URL) -> None:

# ward/pool.py:83
class PoolHealthMonitor:
    def __init__(self, url: str = DEFAULT_TESTNET_URL, ...) -> None:

# ward/vault_monitor.py:102
class VaultMonitor:
    def __init__(self, ..., websocket_url: str = DEFAULT_TESTNET_WS, ...) -> None:

# ward/client.py:71
class WardClient:
    def __init__(self, url: str = DEFAULT_TESTNET_URL) -> None:
```

Where `DEFAULT_TESTNET_URL = "https://s.altnet.rippletest.net:51234/"` (ward/constants.py:100).

### Risk

An operator who deploys without explicitly passing mainnet URLs will silently connect to Altnet. Claim validation will succeed against testnet-only ledger state. This is an undetectable misconfiguration that would appear to be working correctly.

### Remediation

**Option A (recommended):** Add `WARD_XRPL_URL` / `WARD_XRPL_WS` environment variable reads with no fallback in production mode. Add `WARD_ENV=production` guard that raises `ConfigurationError` if env vars are absent.

**Option B:** Remove testnet default from constructors — require explicit URL. All existing tests pass explicit URLs, so test coverage is unaffected.

**Option C:** Add a deployment check script (`scripts/preflight_check.py`) that validates URLs point to mainnet before accepting traffic.

---

## B2 — In-Memory Rate Limiter

### Current State

```python
# ward/primitives.py:239-296
_rate_limit_lock: threading.Lock = threading.Lock()
_rate_limit_windows: dict = {}  # nft_token_id -> deque[float]
```

The sliding-window rate limiter (≤3 claims/NFT/300s) lives entirely in this dict. The `threading.Lock` is not multiprocessing-safe.

### Risk

- Multi-process deployments (gunicorn workers, Railway instances) each maintain separate windows — the limit is effectively multiplied by worker count.
- A process restart resets all windows — a burst of claims immediately after a restart bypasses the limit entirely.
- An attacker who triggers a worker restart (OOM, deploy) gets a window reset.

### Remediation

Migrate `check_rate_limit()` and `record_rate_limit_call()` to Redis with `ZADD` / `ZRANGEBYSCORE` / `ZREMRANGEBYSCORE` pattern. TTL on the sorted set ensures cleanup. This is a ~50-line change to `ward/primitives.py`.

---

## B3 — Settlement Lock Redis Dependency

### Current State

```python
# ward/settlement.py:46-58
_settlement_redis = None
try:
    import redis as _redis
    _settlement_redis = _redis.Redis.from_url(...)
    _settlement_redis.ping()
except Exception as _redis_exc:
    logger.warning("Redis unavailable for settlement locks...")
    _settlement_redis = None
```

When Redis is unavailable, settlement falls back to a per-instance `threading.Lock`. The `_SETTLEMENT_LOCK_TTL = 3600` (1 hour) is enforced only in Redis mode.

### Risk

Without Redis, two concurrent settlement requests for the same claim on different workers can both pass the lock check and attempt double-settlement. The XRPL ledger's atomic operations provide the final safety net (the second NFTokenBurn will fail), but this creates a failed transaction that wastes drops and requires investigation.

### Remediation

Add `WARD_REQUIRE_REDIS` environment variable. When set, raise `ConfigurationError` at module import if Redis is unavailable. Recommended for all production deployments.

---

## B4 — In-Memory Coverage Registry

### Current State

```python
# ward/pool.py:88
self._coverage_registry: Dict[str, int] = {}
```

`PoolHealthMonitor` maintains per-instance coverage state. The `set_coverage()` and `clear_coverage()` calls (invoked by the API on policy purchase and settlement) only update the local instance's registry.

### Risk

On multi-instance deployments, pool-level coverage checks may miss or double-count active policies depending on which instance handled the purchase vs. the claim.

### Remediation

The existing `ward/coverage.py` module provides an on-chain coverage registry that reads from XRPL. Evaluate whether `PoolHealthMonitor._coverage_registry` can be replaced by direct on-chain reads, or migrate to Redis-backed registry consistent with keys/registry patterns.

---

## Non-Blocking Gaps

### ALLOWED_WS_URLS includes Altnet

```python
# ward/constants.py:140
ALLOWED_WS_URLS: frozenset = frozenset({
    "wss://s.altnet.rippletest.net:51233/",  # testnet — must be audited at deploy time
    "wss://xrplcluster.com/",
    "wss://s1.ripple.com/",
    "wss://s2.ripple.com/",
})
```

The Rust `ALLOWED_WS_URLS` (monitor.rs) mirrors this. Including Altnet is correct for testnet support. For mainnet, consider a separate `MAINNET_ALLOWED_WS_URLS` constant and validate against it when `WARD_ENV=production`.

### submit_with_retry() Still Present

`ward/primitives.py:459` — function body exists and is callable despite being marked DEPRECATED. Now emits `DeprecationWarning`. Must be removed before mainnet GA.

### ward_client.py (Legacy Root File)

`/home/user/ward-protocol/ward_client.py` exists at the repo root. This appears to be a pre-modularization legacy file. It should be audited and either removed or marked explicitly as deprecated.

### XRPL Reserve Constants

```python
XRPL_BASE_RESERVE_DROPS = 20_000_000  # 20 XRP
XRPL_OWNER_RESERVE_DROPS = 2_000_000  # 2 XRP per owned object
```

These are hardcoded in `ward/constants.py`. XRPL reserve requirements can change via amendment. For mainnet, consider reading these from the `server_info` RPC response and caching with a TTL, or at minimum adding a startup validation that compares the constant against the live ledger.

---

## Mainnet Go-Live Checklist

- [ ] **B1**: Remove testnet defaults from all six constructors; require env var
- [ ] **B2**: Migrate rate limiter to Redis ZADD/ZRANGEBYSCORE
- [ ] **B3**: Add `WARD_REQUIRE_REDIS=true` guard; prohibit in-memory fallback in prod
- [ ] **B4**: Evaluate on-chain coverage read vs. Redis-backed registry
- [ ] Remove `submit_with_retry()` function body (keep stub that raises immediately)
- [ ] Audit and remove or archive `ward_client.py` root-level legacy file
- [ ] Add preflight check script that validates all URLs point to mainnet
- [ ] Confirm XRPL reserve constants match current live mainnet `server_info`
- [ ] Ensure Redis is provisioned and `WARD_REDIS_URL` is set in all production environments
- [ ] All 537 Python / 22 Rust / 53 TypeScript tests green on mainnet network config
- [ ] Load test multi-instance deployment with Redis to verify rate limiter correctness
