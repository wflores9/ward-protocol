import algosdk from 'algosdk';
import dotenv from 'dotenv';
dotenv.config();

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

const MNEMONIC = process.env.ALGO_MNEMONIC;
if (!MNEMONIC) throw new Error('Set ALGO_MNEMONIC in .env');

const account = algosdk.mnemonicToSecretKey(MNEMONIC);
const address = account.addr.toString();

async function wardResolveUnsigned(claimantAddress, vaultAddress, policyId) {
  console.log('Ward Algorand Resolution — ward_signed = False');
  console.log('Claimant:', claimantAddress);
  console.log('Vault:', vaultAddress);
  console.log('Policy ID:', policyId);

  if (!policyId || policyId === 0) {
    return { valid: false, reason: 'Check 1: invalid policy ID' };
  }

  if (!vaultAddress) {
    return { valid: false, reason: 'Check 3: vault address missing' };
  }

  try {
    await algodClient.accountInformation(claimantAddress).do();
  } catch (e) {
    return { valid: false, reason: 'Check 8: claimant account not found on ledger' };
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  const unsignedTx = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: claimantAddress,
    receiver: claimantAddress,
    amount: 0,
    note: new TextEncoder().encode(`ward_resolution:policy:${policyId}:RESOLVED:ward_signed=False`),
    suggestedParams,
  });

  const unsignedTxB64 = Buffer.from(algosdk.encodeUnsignedTransaction(unsignedTx)).toString('base64');

  return {
    valid: true,
    reason: 'RESOLVED: ward_signed=False',
    unsignedTxB64,
    wardSigned: false,
  };
}

async function main() {
  console.log('\n=== Ward Protocol — Algorand Testnet E2E ===\n');
  console.log('Address:', address);

  const accountInfo = await algodClient.accountInformation(address).do();
  const balance = Number(accountInfo.amount) / 1e6;
  console.log('Balance:', balance, 'ALGO\n');

  const result = await wardResolveUnsigned(address, 'DUMMY_VAULT_ADDRESS', 281);
  console.log('Valid claim →', result.valid, '|', result.reason);
  console.log('wardSigned:', result.wardSigned, '— must be false');

  const r2 = await wardResolveUnsigned(address, 'DUMMY_VAULT', 0);
  console.log('Zero policy →', r2.valid, '|', r2.reason);

  const r3 = await wardResolveUnsigned(address, null, 281);
  console.log('Null vault →', r3.valid, '|', r3.reason);

  console.log('\nE2E complete — ward_signed = False throughout');
}

main().catch(console.error);
