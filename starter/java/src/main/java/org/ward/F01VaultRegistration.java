package org.ward;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.github.cdimascio.dotenv.Dotenv;
import org.xrpl.xrpl4j.client.JsonRpcClientErrorException;
import org.xrpl.xrpl4j.client.XrplClient;
import org.xrpl.xrpl4j.codec.addresses.UnsignedByteArray;
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
import org.xrpl.xrpl4j.model.transactions.NfTokenMint;
import org.xrpl.xrpl4j.model.transactions.XrpCurrencyAmount;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;

/**
 * F·01 — Vault Registration (Java / xrpl4j v6.0.0)
 *
 * Registers an XLS-66 lending vault with Ward Protocol and mints
 * the vault-policy NFT on XRPL Testnet.
 *
 * Ward returns an UNSIGNED NfTokenMint transaction.
 * This class signs it locally — ward_signed = false.
 *
 * Run:
 *   mvn exec:java -Dexec.mainClass=org.ward.F01VaultRegistration
 */
public class F01VaultRegistration {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient   HTTP   = HttpClient.newHttpClient();

    public static void main(String[] args) throws Exception {
        Dotenv env = Dotenv.configure().ignoreIfMissing().load();

        String rpcUrl   = env.get("XRPL_JSON_RPC_URL", WardConstants.DEFAULT_TESTNET_URL);
        String wardApi  = env.get("WARD_API_BASE",      "https://api.wardprotocol.org");
        String instKey  = env.get("INSTITUTION_API_KEY", "");
        String seedStr  = env.get("TESTNET_WALLET_SEED", "");

        // Generate or restore wallet
        Seed seed = seedStr.isEmpty()
            ? Seed.ed25519Seed()
            : Seed.fromBase58EncodedSecret(seedStr);
        PrivateKey privateKey = seed.deriveKeyPair().privateKey();
        Address    address    = seed.deriveKeyPair().publicKey().deriveAddress();

        System.out.println("F·01 — Vault Registration");
        System.out.println("  Institution address : " + address.value());
        System.out.println("  XRPL endpoint       : " + rpcUrl);

        // --- Step 1: Register vault with Ward Protocol ---
        System.out.println("\n[1/3] Registering vault …");
        ObjectNode regBody = MAPPER.createObjectNode();
        regBody.put("institution_address",  address.value());
        regBody.put("collateral_currency",  "XRP");
        regBody.put("min_collateral_ratio", 1.5);

        JsonNode regResp = wardPost(wardApi + "/vaults", regBody, instKey);
        String vaultId = regResp.has("vault_id")
            ? regResp.get("vault_id").asText()
            : regResp.path("id").asText("demo-vault");
        System.out.println("  vault_id : " + vaultId);

        // --- Step 2: Fetch unsigned NFTokenMint for vault-policy NFT ---
        System.out.println("\n[2/3] Fetching unsigned vault registration transaction …");
        ObjectNode txBody = MAPPER.createObjectNode();
        txBody.put("vault_id", vaultId);
        txBody.put("account",  address.value());

        JsonNode txResp      = wardPost(wardApi + "/vaults/transaction", txBody, instKey);
        JsonNode unsignedTx  = txResp.has("unsigned_tx") ? txResp.get("unsigned_tx") : txResp;

        // Core invariant: Ward must NOT have signed the transaction
        if (unsignedTx.has("TxnSignature") && !unsignedTx.get("TxnSignature").asText().isEmpty()) {
            throw new IllegalStateException("ward_signed invariant violated — TxnSignature present");
        }
        System.out.println("  ✓ ward_signed = false — unsigned transaction received");
        System.out.println("  TransactionType : " + unsignedTx.path("TransactionType").asText());

        // Verify NFTokenTaxon
        int taxon = unsignedTx.path("NFTokenTaxon").asInt(-1);
        if (taxon != WardConstants.WARD_POLICY_TAXON) {
            throw new IllegalStateException(
                "Expected NFTokenTaxon=" + WardConstants.WARD_POLICY_TAXON + ", got " + taxon
            );
        }
        System.out.println("  ✓ NFTokenTaxon = " + taxon + " (WARD_POLICY_TAXON)");

        // Verify TF_TRANSFERABLE is absent
        int flags = unsignedTx.path("Flags").asInt(0);
        if ((flags & WardConstants.TF_TRANSFERABLE) != 0) {
            throw new IllegalStateException("TF_TRANSFERABLE must be absent from policy NFT flags");
        }
        System.out.println("  ✓ TF_TRANSFERABLE absent from flags (0x" + Integer.toHexString(flags) + ")");

        // --- Step 3: Build, sign, and submit the NFTokenMint ---
        System.out.println("\n[3/3] Signing and submitting to XRPL …");
        XrplClient xrplClient = new XrplClient(rpcUrl);

        AccountInfoResult acctInfo = xrplClient.accountInfo(
            AccountInfoRequestParams.builder()
                .account(address)
                .ledgerSpecifier(LedgerSpecifier.CURRENT)
                .build()
        );

        NfTokenMint nftMint = NfTokenMint.builder()
            .account(address)
            .fee(XrpCurrencyAmount.ofDrops(12))
            .sequence(acctInfo.accountData().sequence())
            .lastLedgerSequence(
                acctInfo.ledgerCurrentIndex()
                    .orElseThrow(() -> new RuntimeException("no ledger index"))
                    .unsignedIntegerValue()
                    .plus(com.google.common.primitives.UnsignedInteger.valueOf(4))
            )
            .nfTokenTaxon(com.google.common.primitives.UnsignedInteger.valueOf(
                WardConstants.WARD_POLICY_TAXON
            ))
            .flags(org.xrpl.xrpl4j.model.flags.NfTokenMintFlags.builder()
                .tfBurnable(true)
                .build())
            .uri(Optional.ofNullable(unsignedTx.path("URI").asText(null))
                .map(org.xrpl.xrpl4j.model.transactions.NfTokenUri::of))
            .build();

        SignatureService<PrivateKey>      sigService = new BcSignatureService();
        SingleSignedTransaction<NfTokenMint> signed = sigService.sign(privateKey, nftMint);

        SubmitResult<NfTokenMint> result = xrplClient.submit(signed);
        System.out.println("  result : " + result.engineResult());
        System.out.println("  hash   : " + result.transactionResult().transaction().hash()
            .map(Object::toString).orElse("(pending)"));

        System.out.println("\nF·01 complete — vault registered, policy NFT minted.");
        System.out.println("ward_signed = false — Ward never held signing keys.");
    }

    static JsonNode wardPost(String url, ObjectNode body, String apiKey) throws Exception {
        String json = MAPPER.writeValueAsString(body);
        HttpRequest.Builder rb = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json));
        if (!apiKey.isEmpty()) {
            rb.header("X-Institution-Key", apiKey);
        }
        HttpResponse<String> resp = HTTP.send(rb.build(), HttpResponse.BodyHandlers.ofString());
        return MAPPER.readTree(resp.body());
    }
}
