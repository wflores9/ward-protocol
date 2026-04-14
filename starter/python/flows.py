import os
import json
import urllib.request


def _env(name: str, default: str) -> str:
    v = os.getenv(name)
    return v if v else default


def _post(url: str, payload: dict, headers: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={**headers, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _get(url: str) -> dict:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def register_vault(api_base: str, institution_address: str, institution_key: str | None) -> dict:
    headers = {}
    if institution_key:
        headers["X-Institution-Key"] = institution_key
    return _post(
        api_base + "/vaults",
        {"institution_address": institution_address, "collateral_currency": "XRP", "min_collateral_ratio": 1.5},
        headers,
    )


def mint_policy_nft(api_base: str, vault_id: str, depositor_address: str, institution_key: str | None) -> dict:
    headers = {}
    if institution_key:
        headers["X-Institution-Key"] = institution_key
    return _post(
        api_base + "/policies/purchase",
        {"vault_id": vault_id, "depositor_address": depositor_address, "coverage_drops": 10_000_000, "duration_days": 90},
        headers,
    )


def file_claim(api_base: str, vault_id: str, policy_nft_id: str, claimant_address: str, institution_key: str | None) -> dict:
    headers = {}
    if institution_key:
        headers["X-Institution-Key"] = institution_key
    return _post(
        api_base + "/claims/file",
        {
            "vault_id": vault_id,
            "policy_nft_id": policy_nft_id,
            "claimant_address": claimant_address,
            "condition_hex": "00" * 32,
        },
        headers,
    )


def main() -> None:
    api_base = _env("WARD_API_BASE", "http://127.0.0.1:8000").rstrip("/")
    institution_key = os.getenv("INSTITUTION_API_KEY")

    print("# health")
    print(json.dumps(_get(api_base + "/health"), indent=2))

    print("\n# network/status")
    print(json.dumps(_get(api_base + "/network/status"), indent=2))

    vault = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
    print("\n# dashboard vault health")
    print(json.dumps(_get(api_base + f"/dashboard/vault/{vault}/health"), indent=2))

    # The following calls demonstrate the flow shapes (unsigned tx responses in spec_mode).
    institution_addr = "rN7n3473SaZBCG4dFL83w7PB5mZGGUmaz"
    depositor_addr = "rN7n3473SaZBCG4dFL83w7PB5mZGGUmaz"
    claimant_addr = depositor_addr

    print("\n# register_vault()")
    print(json.dumps(register_vault(api_base, institution_addr, institution_key), indent=2))

    print("\n# mint_policy_nft()")
    print(json.dumps(mint_policy_nft(api_base, vault, depositor_addr, institution_key), indent=2))

    print("\n# file_claim()")
    print(json.dumps(file_claim(api_base, vault, "A" * 64, claimant_addr, institution_key), indent=2))


if __name__ == "__main__":
    main()

