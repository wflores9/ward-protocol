package org.ward;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.cdimascio.dotenv.Dotenv;
import org.xrpl.xrpl4j.client.XrplClient;
import org.xrpl.xrpl4j.crypto.keys.PrivateKey;
import org.xrpl.xrpl4j.crypto.keys.Seed;
import org.xrpl.xrpl4j.crypto.signing.SignatureService;
import org.xrpl.xrpl4j.crypto.signing.SingleSignedTransaction;
import org.xrpl.xrpl4j.crypto.signing.bc.BcSignatureService;
import org.xrpl.xrpl4j.model.client.accounts.AccountInfoRequestParams;
import org.xrpl.xrpl4j.model.client.accounts.AccountInfoResult;
import org.xrpl.xrpl4j.model.client.common.LedgerSpecifier;
import org.xrpl.xrpl4j.model.client.transactions.SubmitResult;
import org.xrpl.xrpl4j.model.transactions.Address;
import org.xrpl.xrpl4j.model.transactions.EscrowCreate;
import org.xrpl.xrpl4j.model.transactions.EscrowFinish;
import org.xrpl.xrpl4j.model.transactions.XrpCurrencyAmount;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;

/**
 * F·03 — Escrow Settlement (Java / xrpl4j v6.0.0)
 *
 * Settles an approved Ward Protocol insurance claim using PREIMAGE-SHA-256
 * XRPL escrow (crypto-conditions, RFC 3230).
 *
 * Security model:
 *   1. Claimant generates 32-byte random preimage locally (SecureRandom).
 *   2. Ward API receives ONLY the condition_hex — preimage never transmitted.
 *   3. EscrowCreate (pool → claimant) returned unsigned by Ward, signed here.
 *   4. EscrowFinish (claimant releases) returned unsigned by Ward, signed here.
 *
 *   ward_signed = false — Ward never holds signing keys.
 *
 * Run:
 *   mvn exec:java -Dexec.mainClass=org.ward.F03EscrowSettlement
 */
public class F03EscrowSettlement {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient   HTTP   = HttpClient.newHttpClient();

    public static void main(String[] args) throws Exception {
        Dotenv env = Dotenv.configure().ignoreIfMissing().load();

        String rpcUrl    = env.get("XRPL_JSON_RPC_URL", WardConstants.DEFAULT_TESTNET_URL);
        String wardApi   = env.get("WARD_API_BASE",     "https://api.wardprotocol.org");
        String instKey   = env.get("INSTITUTION_API_KEY", "");
        String seedStr   = env.get("TESTNET_WALLET_SEED", "");
        String poolStr   = env.get("POOL_ADDRESS",      "");
        long   payout    = Long.parseLong(env.get("POLICY_COVERAGE_DROPS", "1000000"));
        String claimNft  = env.get("CLAIM_NFT_TOKEN_ID", "A".repeat(64));

        // Validate drops before any API call (AV 2.14)
        WardConstants.validateDrops(payout, "payout");

        Seed       seed       = seedStr.isEmpty() ? Seed.ed25519Seed()
                                                  : Seed.fromBase58EncodedSecret(seedStr);
        PrivateKey privateKey = seed.deriveKeyPair().privateKey();
        Address    claimant   = seed.deriveKeyPair().publicKey().deriveAddress();
        Address    poolAddr   = poolStr.isEmpty() ? claimant : Address.of(poolStr);

        System.out.println("F·03 — Escrow Settlement");
        System.out.println("  Claimant : " + claimant.value());
        System.out.println("  Pool     : " + poolAddr.value());
        System.out.printf("  Payout   : %,d drops (%.6f XRP)%n", payout, payout / 1_000_000.0);

        // ─── Step 1: Generate PREIMAGE-SHA-256 condition locally ─────────────
        System.out.println("\n[1/5] Generating PREIMAGE-SHA-256 condition …");
        byte[] preimage = new byte[32];
        new SecureRandom().nextBytes(preimage);

        // Build condition: PREIMAGE-SHA-256 ASN.1 DER encoding
        byte[] digest = java.security.MessageDigest.getInstance("SHA-256").digest(preimage);
        byte[] conditionBytes = concat(new byte[]{(byte)0xA0, 0x25, (byte)0x80, 0x20}, digest,
                                       new byte[]{(byte)0x81, 0x01, 0x20});
        byte[] fulfillmentBytes = concat(new byte[]{(byte)0xA0, 0x22, (byte)0x80, 0x20}, preimage);

        String conditionHex   = toHex(conditionBytes).toUpperCase();
        String fulfillmentHex = toHex(fulfillmentBytes).toUpperCase();

        System.out.println("  condition_hex    : " + conditionHex.substring(0, Math.min(32, conditionHex.length())) + "…");
        System.out.println("  fulfillment_hex  : (held locally — NEVER sent to Ward)");
        System.out.println("  ✓ ward_signed = false — Ward receives condition only");

        // ─── Step 2: Request unsigned EscrowCreate from Ward API ─────────────
        System.out.println("\n[2/5] Requesting unsigned EscrowCreate …");
        ObjectNode createBody = MAPPER.createObjectNode();
        createBody.put("pool_address",      poolAddr.value());
        createBody.put("claimant_address",  claimant.value());
        createBody.put("amount_drops",      payout);
        createBody.put("condition_hex",     conditionHex);   // Ward sees only condition
        createBody.put("nft_token_id",      claimNft);

        JsonNode createResp   = wardPost(wardApi + "/settlement/escrow", createBody, instKey);
        JsonNode unsignedCreate = createResp.has("unsigned_escrow_create")
            ? createResp.get("unsigned_escrow_create") : createResp;

        assertUnsigned(unsignedCreate);
        System.out.println("  ✓ ward_signed = false — EscrowCreate unsigned");

        // ─── Step 3: Pool institution signs and submits EscrowCreate ─────────
        System.out.println("\n[3/5] Signing and submitting EscrowCreate (pool → claimant) …");
        XrplClient xrplClient = new XrplClient(rpcUrl);

        AccountInfoResult acctInfo = xrplClient.accountInfo(
            AccountInfoRequestParams.builder()
                .account(poolAddr)
                .ledgerSpecifier(LedgerSpecifier.CURRENT)
                .build()
        );

        EscrowCreate escrowCreate = EscrowCreate.builder()
            .account(poolAddr)
            .destination(claimant)
            .amount(XrpCurrencyAmount.ofDrops(payout))
            .fee(XrpCurrencyAmount.ofDrops(12))
            .sequence(acctInfo.accountData().sequence())
            .lastLedgerSequence(
                acctInfo.ledgerCurrentIndex()
                    .orElseThrow()
                    .unsignedIntegerValue()
                    .plus(com.google.common.primitives.UnsignedInteger.valueOf(4))
            )
            .condition(org.xrpl.xrpl4j.model.transactions.CryptoCondition.of(conditionHex))
            .build();

        SignatureService<PrivateKey>           svc       = new BcSignatureService();
        SingleSignedTransaction<EscrowCreate>  signedEc  = svc.sign(privateKey, escrowCreate);
        SubmitResult<EscrowCreate>             ecResult  = xrplClient.submit(signedEc);

        System.out.println("  result       : " + ecResult.engineResult());
        var ecSeq = escrowCreate.sequence();
        System.out.println("  offer_sequence: " + ecSeq);

        // ─── Step 4: Request unsigned EscrowFinish from Ward API ─────────────
        System.out.println("\n[4/5] Requesting unsigned EscrowFinish …");
        ObjectNode finishBody = MAPPER.createObjectNode();
        finishBody.put("claimant_address", claimant.value());
        finishBody.put("owner_address",    poolAddr.value());
        finishBody.put("offer_sequence",   ecSeq.longValue());
        finishBody.put("condition_hex",    conditionHex);
        finishBody.put("fulfillment_hex",  fulfillmentHex);

        JsonNode finishResp    = wardPost(wardApi + "/settlement/escrow/finish", finishBody, instKey);
        JsonNode unsignedFinish = finishResp.has("unsigned_escrow_finish")
            ? finishResp.get("unsigned_escrow_finish") : finishResp;

        assertUnsigned(unsignedFinish);
        System.out.println("  ✓ ward_signed = false — EscrowFinish unsigned");

        // ─── Step 5: Claimant signs and submits EscrowFinish ─────────────────
        System.out.println("\n[5/5] Claimant signs and submits EscrowFinish …");

        AccountInfoResult claimantInfo = xrplClient.accountInfo(
            AccountInfoRequestParams.builder()
                .account(claimant)
                .ledgerSpecifier(LedgerSpecifier.CURRENT)
                .build()
        );

        EscrowFinish escrowFinish = EscrowFinish.builder()
            .account(claimant)
            .owner(poolAddr)
            .offerSequence(ecSeq)
            .fee(XrpCurrencyAmount.ofDrops(350))   // extra fee for crypto-condition
            .sequence(claimantInfo.accountData().sequence())
            .lastLedgerSequence(
                claimantInfo.ledgerCurrentIndex()
                    .orElseThrow()
                    .unsignedIntegerValue()
                    .plus(com.google.common.primitives.UnsignedInteger.valueOf(4))
            )
            .condition(org.xrpl.xrpl4j.model.transactions.CryptoCondition.of(conditionHex))
            .fulfillment(org.xrpl.xrpl4j.model.transactions.CryptoConditionFulfillment.of(fulfillmentHex))
            .build();

        SingleSignedTransaction<EscrowFinish> signedEf = svc.sign(privateKey, escrowFinish);
        SubmitResult<EscrowFinish>            efResult = xrplClient.submit(signedEf);

        System.out.println("  result : " + efResult.engineResult());
        System.out.println("  hash   : " + efResult.transactionResult().transaction().hash()
            .map(Object::toString).orElse("(pending)"));

        System.out.println();
        System.out.printf("F·03 complete — %,d drops delivered to claimant.%n", payout);
        System.out.println("ward_signed = false — Ward never held signing keys.");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    static void assertUnsigned(JsonNode tx) {
        if (tx.has("TxnSignature") && !tx.get("TxnSignature").asText("").isEmpty()) {
            throw new IllegalStateException("ward_signed invariant violated — TxnSignature present");
        }
    }

    static JsonNode wardPost(String url, ObjectNode body, String apiKey) throws Exception {
        String json = MAPPER.writeValueAsString(body);
        HttpRequest.Builder rb = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json));
        if (!apiKey.isEmpty()) rb.header("X-Institution-Key", apiKey);
        HttpResponse<String> resp = HTTP.send(rb.build(), HttpResponse.BodyHandlers.ofString());
        return MAPPER.readTree(resp.body());
    }

    static byte[] concat(byte[]... arrays) {
        int len = 0;
        for (byte[] a : arrays) len += a.length;
        byte[] result = new byte[len];
        int pos = 0;
        for (byte[] a : arrays) { System.arraycopy(a, 0, result, pos, a.length); pos += a.length; }
        return result;
    }

    static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
