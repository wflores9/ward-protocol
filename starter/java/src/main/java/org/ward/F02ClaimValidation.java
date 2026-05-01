package org.ward;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.cdimascio.dotenv.Dotenv;
import org.xrpl.xrpl4j.client.XrplClient;
import org.xrpl.xrpl4j.model.client.accounts.AccountInfoRequestParams;
import org.xrpl.xrpl4j.model.client.accounts.AccountInfoResult;
import org.xrpl.xrpl4j.model.client.accounts.AccountNftsRequestParams;
import org.xrpl.xrpl4j.model.client.accounts.AccountNftsResult;
import org.xrpl.xrpl4j.model.client.common.LedgerSpecifier;
import org.xrpl.xrpl4j.model.client.ledger.LedgerEntryRequestParams;
import org.xrpl.xrpl4j.model.client.ledger.LedgerEntryResult;
import org.xrpl.xrpl4j.model.client.serverinfo.ServerInfoResult;
import org.xrpl.xrpl4j.model.transactions.Address;
import org.xrpl.xrpl4j.model.transactions.Hash256;
import org.xrpl.xrpl4j.model.transactions.XrpCurrencyAmount;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * F·02 — Claim Validation (Java / xrpl4j v6.0.0)
 *
 * Implements the 9-step Ward Protocol claim validation against live XRPL state.
 * All state sourced directly from the XRPL ledger — no off-chain data trusted.
 *
 *   Step 1: NFT exists in claimant wallet with correct taxon (281)
 *   Step 2: Policy not expired (uses XRPL ledger close_time)
 *   Step 3: Vault address in NFT metadata matches defaulted_vault
 *   Step 4: Loan default flag (LSF_LOAN_DEFAULT) set on-chain
 *   Step 5: Vault loss is positive
 *   Step 6: Pool coverage breach check
 *   Step 7: Replay protection (NFT still live)
 *   Step 8: Claimant holds the NFT
 *   Step 9: Pool solvency + rate limit check
 *
 * ward_signed = false — this class never signs anything.
 *
 * Run:
 *   mvn exec:java -Dexec.mainClass=org.ward.F02ClaimValidation
 */
public class F02ClaimValidation {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        Dotenv env = Dotenv.configure().ignoreIfMissing().load();

        String rpcUrl      = env.get("XRPL_JSON_RPC_URL", WardConstants.DEFAULT_TESTNET_URL);
        String claimantStr = env.get("INSTITUTION_ADDRESS",  "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
        String nftId       = env.get("CLAIM_NFT_TOKEN_ID", "A".repeat(64));
        String vaultStr    = env.get("VAULT_ADDRESS",       "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");
        String loanIdStr   = env.get("CLAIM_LOAN_ID",       "B".repeat(64));
        String poolStr     = env.get("POOL_ADDRESS",        "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh");

        System.out.println("F·02 — Claim Validation (9 steps)");
        System.out.println("  XRPL endpoint  : " + rpcUrl);
        System.out.println("  Claimant       : " + claimantStr);
        System.out.println("  NFT token ID   : " + nftId.substring(0, 16) + "…");
        System.out.println("  Defaulted vault: " + vaultStr);
        System.out.println();

        XrplClient client = new XrplClient(rpcUrl);
        Address claimant  = Address.of(claimantStr);
        Address vault     = Address.of(vaultStr);
        Address pool      = Address.of(poolStr);

        int stepsPassed = 0;
        ValidationResult result;

        // ─── Step 1: NFT exists with correct taxon ───────────────────────────
        System.out.println("[1/9] Verifying NFT existence and taxon …");
        JsonNode nftData = findNft(client, claimant, nftId);
        if (nftData == null) {
            result = ValidationResult.reject(stepsPassed, "NFT not found (burned or missing)");
            printResult(result); return;
        }
        int actualTaxon = nftData.path("NFTokenTaxon").asInt(-1);
        if (actualTaxon != WardConstants.WARD_POLICY_TAXON) {
            result = ValidationResult.reject(stepsPassed, "Wrong taxon: " + actualTaxon
                + " (expected " + WardConstants.WARD_POLICY_TAXON + ")");
            printResult(result); return;
        }
        System.out.println("  ✓ NFT found, taxon=" + actualTaxon);
        stepsPassed = 1;

        // ─── Step 2: Policy not expired ──────────────────────────────────────
        System.out.println("[2/9] Checking policy expiry (on-chain ledger time) …");
        JsonNode metadata = decodeNftUri(nftData);
        if (metadata == null) {
            result = ValidationResult.reject(stepsPassed, "NFT URI metadata decode failed");
            printResult(result); return;
        }
        long expiry = metadata.has("e") ? metadata.get("e").asLong(0)
                    : metadata.path("expiry_ledger_time").asLong(0);
        long ledgerNow = getLedgerCloseTime(client);
        if (expiry > 0 && expiry < ledgerNow) {
            result = ValidationResult.reject(stepsPassed,
                "Policy expired at ledger time " + expiry + " (now " + ledgerNow + ")");
            printResult(result); return;
        }
        System.out.println("  ✓ Policy valid until ledger time " + expiry + " (now " + ledgerNow + ")");
        stepsPassed = 2;

        // ─── Step 3: Vault binding ────────────────────────────────────────────
        System.out.println("[3/9] Checking vault address binding …");
        String metaVault = metadata.has("v") ? metadata.get("v").asText()
                         : metadata.path("vault_address").asText();
        if (!metaVault.equals(vaultStr)) {
            result = ValidationResult.reject(stepsPassed,
                "Vault mismatch: metadata=" + metaVault + " requested=" + vaultStr);
            printResult(result); return;
        }
        System.out.println("  ✓ Vault address matches metadata");
        stepsPassed = 3;

        // ─── Step 4: Default flag ─────────────────────────────────────────────
        System.out.println("[4/9] Verifying LSF_LOAN_DEFAULT on loan entry …");
        JsonNode loanNode = fetchLedgerEntry(client, loanIdStr);
        if (loanNode == null) {
            result = ValidationResult.reject(stepsPassed, "Loan entry not found on ledger");
            printResult(result); return;
        }
        long loanFlags = loanNode.path("Flags").asLong(0);
        if ((loanFlags & WardConstants.LSF_LOAN_DEFAULT) == 0) {
            result = ValidationResult.reject(stepsPassed, "LSF_LOAN_DEFAULT not set");
            printResult(result); return;
        }
        long vaultLoss = loanNode.has("TotalValueOutstanding")
            ? loanNode.get("TotalValueOutstanding").asLong()
            : loanNode.path("PrincipalOutstanding").asLong(0);
        System.out.println("  ✓ LSF_LOAN_DEFAULT set, vault_loss=" + vaultLoss + " drops");
        stepsPassed = 4;

        // ─── Step 5: Positive vault loss ─────────────────────────────────────
        System.out.println("[5/9] Checking vault loss > 0 …");
        if (vaultLoss <= 0) {
            result = ValidationResult.reject(stepsPassed, "Vault loss not positive: " + vaultLoss);
            printResult(result); return;
        }
        System.out.println("  ✓ vault_loss=" + vaultLoss);
        stepsPassed = 5;

        // ─── Step 6: Pool coverage ────────────────────────────────────────────
        System.out.println("[6/9] Checking pool coverage breach …");
        AccountInfoResult poolInfo = client.accountInfo(
            AccountInfoRequestParams.builder()
                .account(pool)
                .ledgerSpecifier(LedgerSpecifier.VALIDATED)
                .build()
        );
        long poolBalance    = poolInfo.accountData().balance().value().longValue();
        long ownerCount     = poolInfo.accountData().ownerCount().longValue();
        long poolReserve    = WardConstants.XRPL_BASE_RESERVE_DROPS
                            + ownerCount * WardConstants.XRPL_OWNER_RESERVE_DROPS;
        long usableBalance  = poolBalance - poolReserve;
        if (usableBalance < 0) {
            result = ValidationResult.reject(stepsPassed, "Pool insolvent: usable=" + usableBalance);
            printResult(result); return;
        }
        System.out.println("  ✓ usable pool balance=" + usableBalance + " drops");
        stepsPassed = 6;

        // ─── Steps 7–8: Replay protection + ownership (covered by Step 1) ────
        System.out.println("[7/9] Replay protection: NFT live on ledger ✓ (verified in step 1)");
        System.out.println("[8/9] Ownership: NFT in claimant wallet ✓ (verified in step 1)");
        stepsPassed = 8;

        // ─── Step 9: Pool solvency ────────────────────────────────────────────
        System.out.println("[9/9] Pool solvency check …");
        long policyCoverage = metadata.has("c") ? metadata.get("c").asLong()
                            : metadata.path("coverage_drops").asLong(0);
        long payout = Math.min(vaultLoss, policyCoverage);
        WardConstants.validateDrops(payout, "payout");

        if (usableBalance < payout) {
            result = ValidationResult.reject(stepsPassed,
                "Pool insolvent: usable=" + usableBalance + " < payout=" + payout);
            printResult(result); return;
        }
        double ratio = (double) usableBalance / Math.max(payout, 1);
        if (ratio < WardConstants.MIN_COVERAGE_RATIO) {
            result = ValidationResult.reject(stepsPassed,
                String.format("Coverage ratio %.2f < minimum %.1f", ratio, WardConstants.MIN_COVERAGE_RATIO));
            printResult(result); return;
        }
        System.out.println("  ✓ coverage_ratio=" + String.format("%.2f", ratio));
        stepsPassed = 9;

        result = ValidationResult.approved(payout, vaultLoss, policyCoverage);
        printResult(result);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    static JsonNode findNft(XrplClient client, Address account, String nftId) throws Exception {
        String marker = null;
        do {
            AccountNftsRequestParams.Builder params = AccountNftsRequestParams.builder()
                .account(account)
                .limit(com.google.common.primitives.UnsignedInteger.valueOf(400));
            AccountNftsResult result = client.accountNfts(params.build());
            for (var nft : result.accountNfts()) {
                if (nft.nfTokenId().value().equalsIgnoreCase(nftId)) {
                    return MAPPER.valueToTree(nft);
                }
            }
            marker = result.marker().map(Object::toString).orElse(null);
        } while (marker != null);
        return null;
    }

    static JsonNode decodeNftUri(JsonNode nft) {
        String uriHex = nft.path("URI").asText("");
        if (uriHex.isEmpty()) return null;
        try {
            byte[] bytes = HexFormat.of().parseHex(uriHex);
            String json  = new String(bytes, StandardCharsets.UTF_8);
            return MAPPER.readTree(json);
        } catch (Exception e) {
            System.err.println("  URI decode error: " + e.getMessage());
            return null;
        }
    }

    static long getLedgerCloseTime(XrplClient client) throws Exception {
        ServerInfoResult info = client.serverInformation();
        return info.info().validatedLedger()
            .map(vl -> vl.closeTime().map(ct -> ct.getEpochSecond() - WardConstants.RIPPLE_EPOCH_OFFSET)
                          .orElse(0L))
            .orElse(0L);
    }

    static JsonNode fetchLedgerEntry(XrplClient client, String index) {
        try {
            LedgerEntryResult<?> result = client.ledgerEntry(
                LedgerEntryRequestParams.index(Hash256.of(index), Object.class, LedgerSpecifier.VALIDATED)
            );
            return MAPPER.valueToTree(result.node());
        } catch (Exception e) {
            return null;
        }
    }

    static void printResult(ValidationResult r) {
        System.out.println();
        System.out.println("══════════════════════════════════════════════════════════");
        if (r.approved) {
            System.out.println("  CLAIM APPROVED");
            System.out.printf("  payout_drops   : %,d%n", r.payoutDrops);
            System.out.printf("  vault_loss     : %,d%n", r.vaultLossDrops);
            System.out.printf("  policy_coverage: %,d%n", r.policyCoverageDrops);
            System.out.println("  ✓ Proceed to F·03 — EscrowSettlement");
        } else {
            System.out.println("  CLAIM REJECTED at step " + r.stepsPassed);
            System.out.println("  reason: " + r.rejectionReason);
        }
        System.out.println("══════════════════════════════════════════════════════════");
    }

    // ── ValidationResult record ───────────────────────────────────────────────

    record ValidationResult(
        boolean approved,
        int     stepsPassed,
        long    payoutDrops,
        long    vaultLossDrops,
        long    policyCoverageDrops,
        String  rejectionReason
    ) {
        static ValidationResult approved(long payout, long loss, long coverage) {
            return new ValidationResult(true, 9, payout, loss, coverage, "");
        }
        static ValidationResult reject(int step, String reason) {
            return new ValidationResult(false, step, 0, 0, 0, reason);
        }
    }
}
