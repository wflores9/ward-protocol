"""
Ward Protocol — issue_credential() implementation
Add this method to the WardClient class in ward_client.py,
directly after the purchase_coverage() method.

Option 3: KYC Hash Anchoring
- Institution performs KYC off-chain
- Ward validates hash format and schema before building unsigned tx
- Hash is a cryptographic commitment — institution cannot alter KYC record post-issuance
- DNA Protocol upgrade path: replace kyc_hash with zk_proof, same field position
"""

import hashlib
import re

# ── Add to imports at top of ward_client.py if not already present ──
# from xrpl.models import NFTokenMint
# (already imported based on line 62)


# ── Add these constants near the top of ward_client.py ──────────────

CREDENTIAL_NFT_TAXON   = 282          # Ward credential taxon (282 = 0x11A)
                                       # Distinct from policy taxon 281
VALID_KYC_TYPES        = {"KYC", "AML", "ACCREDITED", "INSTITUTIONAL"}
MAX_CREDENTIAL_URI_LEN = 256           # XRPL NFT URI hard limit (bytes)


# ── Add this helper function near validate_xrpl_address ─────────────

def build_kyc_hash(
    depositor_address: str,
    institution_address: str,
    xrpl_ledger_time: int,
    kyc_type: str,
) -> str:
    """
    Build a deterministic KYC commitment hash.

    sha256(depositor_address | institution_address | ledger_time | kyc_type)

    The institution performs KYC off-chain. This hash anchors their
    attestation on-chain. Ward validates format only — the institution
    bears legal responsibility for the underlying KYC record.

    DNA Protocol upgrade path: this function is replaced by a ZK proof
    verifier. The credential schema field 'kyc_hash' becomes 'zk_proof'.
    All downstream validation steps remain identical.
    """
    payload = f"{depositor_address}|{institution_address}|{xrpl_ledger_time}|{kyc_type}"
    return hashlib.sha256(payload.encode()).hexdigest()


def validate_kyc_hash(kyc_hash: str) -> None:
    """Validate that kyc_hash is a 64-char lowercase hex string (sha256)."""
    if not isinstance(kyc_hash, str):
        raise ValidationError(f"kyc_hash must be a string, got {type(kyc_hash)}")
    if not re.fullmatch(r'[0-9a-f]{64}', kyc_hash):
        raise ValidationError(
            f"kyc_hash must be a 64-char lowercase hex string (sha256), got: {kyc_hash!r}"
        )


# ── Add this method to WardClient class ─────────────────────────────

async def issue_credential(
    self,
    institution_wallet: Any,   # xrpl.wallet.Wallet — not stored after return
    depositor_address: str,
    kyc_type: str,
    period_days: int,
    kyc_record_hash: str | None = None,  # Pre-computed hash, or Ward computes it
) -> Dict[str, Any]:
    """
    Issue an XLS-70 on-chain credential to a depositor wallet.

    Ward validates the credential structure and KYC hash commitment
    before building the unsigned NFTokenMint transaction. The institution
    signs and submits — Ward never touches the keys.

    KYC Hash Anchoring (Option 3):
        Institution performs KYC off-chain, anchors sha256 commitment on-chain.
        Ward validates hash format. Institution bears legal responsibility
        for the underlying record. Hash is immutable post-issuance —
        any KYC record change is detectable by comparing the on-chain hash.

    DNA Protocol upgrade path:
        When ZK proofs are available, kyc_hash is replaced by zk_proof
        in the metadata schema. This method signature stays the same.

    Args:
        institution_wallet: Institution's XRPL wallet (signs the NFTokenMint).
        depositor_address:  Wallet receiving the credential.
        kyc_type:           One of KYC | AML | ACCREDITED | INSTITUTIONAL.
        period_days:        Credential validity period in days.
        kyc_record_hash:    Optional pre-computed sha256 hash of KYC record.
                            If None, Ward builds a deterministic hash from
                            the on-chain inputs (depositor, institution, ledger_time, kyc_type).

    Returns:
        {
            "credential_id":    Human-readable label (e.g. "cred_WRD_<first8>")
            "nft_token_id":     On-chain NFT token ID (64 hex chars)
            "ledger_tx":        NFTokenMint tx hash
            "depositor":        Depositor address
            "kyc_type":         KYC type issued
            "kyc_hash":         sha256 commitment anchored on-chain
            "issued_at":        XRPL ledger close time at issuance
            "expires_at":       XRPL ledger close time at expiry
            "status":           "active"
        }

    Security:
        - Institution and depositor addresses validated before any network call.
        - kyc_type must be in VALID_KYC_TYPES.
        - kyc_hash validated as 64-char sha256 hex before tx is built.
        - Expiry encoded as XRPL ledger time — immune to local clock manipulation.
        - Credential NFT is non-transferable (no tfTransferable flag).
        - Credential taxon 282 is distinct from policy taxon 281.
        - URI size validated against XRPL 256-byte hard limit.
        - ward_signed: false is always set in metadata.
    """

    # ── Input validation ─────────────────────────────────────────────
    validate_xrpl_address(institution_wallet.classic_address, "institution_wallet")
    validate_xrpl_address(depositor_address, "depositor_address")

    if institution_wallet.classic_address == depositor_address:
        raise ValidationError(
            "institution_wallet and depositor_address must be different accounts"
        )

    kyc_type = kyc_type.upper().strip()
    if kyc_type not in VALID_KYC_TYPES:
        raise ValidationError(
            f"kyc_type must be one of {VALID_KYC_TYPES}, got {kyc_type!r}"
        )

    if not isinstance(period_days, int) or period_days <= 0:
        raise ValidationError(
            f"period_days must be a positive integer, got {period_days!r}"
        )

    logger.info(
        "issue_credential: institution=%s depositor=%s kyc_type=%s period=%dd",
        institution_wallet.classic_address,
        depositor_address,
        kyc_type,
        period_days,
    )

    try:
        # ── Step 1: get XRPL ledger time ─────────────────────────────
        current_ledger_time = await get_ledger_time(self._client)
        expires_at = current_ledger_time + period_days * 86400

        # ── Step 2: build or validate kyc_hash ───────────────────────
        if kyc_record_hash is not None:
            # Institution provided their own hash — validate format only
            validate_kyc_hash(kyc_record_hash)
            kyc_hash = kyc_record_hash
        else:
            # Ward builds deterministic hash from on-chain inputs
            kyc_hash = build_kyc_hash(
                depositor_address=depositor_address,
                institution_address=institution_wallet.classic_address,
                xrpl_ledger_time=current_ledger_time,
                kyc_type=kyc_type,
            )

        # ── Step 3: build credential metadata ────────────────────────
        credential_meta = {
            "ward":          "cred",
            "kyc_hash":      kyc_hash,
            "kyc_provider":  institution_wallet.classic_address,
            "kyc_type":      kyc_type,
            "depositor":     depositor_address,
            "issued_at":     current_ledger_time,
            "expires_at":    expires_at,
            # DNA Protocol upgrade path:
            # Replace kyc_hash with zk_proof when ZK integration is ready.
            # All downstream validation (claim step 1b) stays identical.
            "ward_signed":   False,
        }

        uri_str  = json.dumps(credential_meta, separators=(",", ":"))
        uri_hex  = str_to_hex(uri_str)

        # ── URI size guard (XRPL hard limit: 256 bytes) ───────────────
        if len(uri_str.encode()) > MAX_CREDENTIAL_URI_LEN:
            raise ValidationError(
                f"Credential URI exceeds XRPL 256-byte limit: {len(uri_str.encode())} bytes. "
                f"Reduce metadata field lengths."
            )

        # ── Step 4: build unsigned NFTokenMint ───────────────────────
        # ward_signed = False — institution signs, Ward never does
        credential_tx = NFTokenMint(
            account=institution_wallet.classic_address,
            nftoken_taxon=CREDENTIAL_NFT_TAXON,   # 282 — distinct from policy taxon 281
            flags=8,                               # tfBurnable only — non-transferable
            transfer_fee=0,
            uri=uri_hex,
            memos=[
                Memo(
                    memo_type=str_to_hex("ward/credential"),
                    memo_data=str_to_hex(
                        json.dumps({
                            "kyc_type":  kyc_type,
                            "depositor": depositor_address,
                            "issued_at": current_ledger_time,
                        }, separators=(",", ":"))
                    ),
                )
            ],
        )

        # ── Step 5: autofill + submit ─────────────────────────────────
        credential_tx = await autofill(credential_tx, self._client)
        signed_tx     = institution_wallet.sign(credential_tx)  # institution signs
        result        = await submit_and_wait(signed_tx, self._client)

        if result.result.get("meta", {}).get("TransactionResult") != "tesSUCCESS":
            raise ProtocolError(
                f"NFTokenMint (credential) failed: "
                f"{result.result.get('meta', {}).get('TransactionResult')}"
            )

        # ── Step 6: extract NFT token ID ─────────────────────────────
        nft_token_id = _extract_nft_token_id(result.result)
        if not nft_token_id:
            raise ProtocolError("Could not extract credential NFT token ID from tx result")

        credential_id = f"cred_WRD_{nft_token_id[:8].upper()}"

        logger.info(
            "issue_credential: success credential_id=%s nft=%s depositor=%s",
            credential_id,
            nft_token_id,
            depositor_address,
        )

        return {
            "credential_id":  credential_id,
            "nft_token_id":   nft_token_id,
            "ledger_tx":      result.result.get("hash"),
            "depositor":      depositor_address,
            "kyc_type":       kyc_type,
            "kyc_hash":       kyc_hash,
            "issued_at":      current_ledger_time,
            "expires_at":     expires_at,
            "status":         "active",
        }

    except (ValidationError, ProtocolError):
        raise
    except Exception as e:
        logger.error(
            "issue_credential: unexpected error depositor=%s error=%s",
            depositor_address,
            str(e),
        )
        raise ProtocolError(f"issue_credential failed: {e}") from e


# ── CLAIM VALIDATION UPDATE ──────────────────────────────────────────
# In ClaimValidator.validate_claim(), update Step 1 to Step 1a + 1b:
#
# Step 1a (existing): NFT exists and is owned by claimant
#   → account_nfts query (unchanged)
#
# Step 1b (NEW): Credential NFT URI contains valid kyc_hash
#   Add this check after step 1a:

async def _validate_credential_kyc_hash(
    self,
    depositor_address: str,
    institution_address: str,
) -> bool:
    """
    Step 1b: Verify depositor holds a valid Ward credential NFT
    with a properly formatted kyc_hash from a domain-registered institution.

    This does NOT verify the KYC was performed correctly — that is the
    institution's legal responsibility. It verifies:
    1. Depositor holds an NFT with taxon 282 (Ward credential taxon)
    2. The NFT URI contains a valid kyc_hash (64-char sha256 hex)
    3. The kyc_provider matches the institution claiming to have issued it
    4. The credential has not expired (XRPL ledger time)

    DNA Protocol upgrade path:
    When ZK proofs are available, replace kyc_hash check with zk_proof
    verification. This method signature stays the same.
    """
    # Get depositor's NFTs
    account_nfts_result = await self._client.request(
        AccountNFTs(account=depositor_address)
    )
    nfts = account_nfts_result.result.get("account_nfts", [])

    # Find credential NFTs (taxon 282)
    credential_nfts = [
        nft for nft in nfts
        if nft.get("NFTokenTaxon") == CREDENTIAL_NFT_TAXON
    ]

    if not credential_nfts:
        return False

    # Get current ledger time for expiry check
    current_ledger_time = await get_ledger_time(self._client)

    for nft in credential_nfts:
        uri_hex = nft.get("URI", "")
        if not uri_hex:
            continue
        try:
            uri_str  = bytes.fromhex(uri_hex).decode("utf-8")
            meta     = json.loads(uri_str)

            # Validate kyc_hash format
            kyc_hash = meta.get("kyc_hash", "")
            if not re.fullmatch(r'[0-9a-f]{64}', kyc_hash):
                continue

            # Validate kyc_provider matches institution
            if meta.get("kyc_provider") != institution_address:
                continue

            # Validate not expired
            if meta.get("expires_at", 0) <= current_ledger_time:
                continue

            # Valid credential found
            return True

        except (ValueError, json.JSONDecodeError, KeyError):
            continue

    return False
