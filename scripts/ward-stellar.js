import * as StellarSdk from '@stellar/stellar-sdk';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

const SECRET_KEY = process.env.STELLAR_SECRET_KEY;
if (!SECRET_KEY) throw new Error('Set STELLAR_SECRET_KEY in .env');

const keypair = StellarSdk.Keypair.fromSecret(SECRET_KEY);
const publicKey = keypair.publicKey();

async function wardResolveUnsigned(claimantPublicKey, vaultPublicKey, policyId) {
  console.log('Ward Stellar Resolution — ward_signed = False');
  console.log('Claimant:', claimantPublicKey);
  console.log('Vault:', vaultPublicKey);
  console.log('Policy ID:', policyId);

  // Check 1 — Policy ID valid
  if (!policyId || policyId === 0) {
    return { valid: false, reason: 'Check 1: invalid policy ID' };
  }

  // Check 3 — Vault address valid
  if (!vaultPublicKey) {
    return { valid: false, reason: 'Check 3: vault address missing' };
  }

  // Check 8 — Claimant account exists on ledger
  try {
    await server.loadAccount(claimantPublicKey);
  } catch (e) {
    return { valid: false, reason: 'Check 8: claimant account not found on ledger' };
  }

  // Build unsigned resolution transaction — ward_signed = False
  const claimantAccount = await server.loadAccount(claimantPublicKey);
  const transaction = new StellarSdk.TransactionBuilder(claimantAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(StellarSdk.Operation.manageData({
      name: 'ward_resolution',
      value: `policy:${policyId}:RESOLVED`,
    }))
    .setTimeout(300)
    .build();

  // NEVER sign — ward_signed = False always
  const unsignedXDR = transaction.toXDR();

  return {
    valid: true,
    reason: 'RESOLVED: ward_signed=False',
    unsignedXDR,
    wardSigned: false,
  };
}

async function main() {
  console.log('\n=== Ward Protocol — Stellar Testnet E2E ===\n');
  console.log('Deployer public key:', publicKey);

  const account = await server.loadAccount(publicKey);
  console.log('Balance:', account.balances[0].balance, 'XLM\n');

  // Valid resolution
  const result = await wardResolveUnsigned(publicKey, 'GDUMMY_VAULT_ADDRESS_PLACEHOLDER', 281);
  console.log('Valid claim →', result.valid, '|', result.reason);
  console.log('wardSigned:', result.wardSigned, '— must be false');

  // Check 1 failure
  const r2 = await wardResolveUnsigned(publicKey, 'GDUMMY', 0);
  console.log('Zero policy →', r2.valid, '|', r2.reason);

  // Check 3 failure
  const r3 = await wardResolveUnsigned(publicKey, null, 281);
  console.log('Null vault →', r3.valid, '|', r3.reason);

  console.log('\nE2E complete — ward_signed = False throughout');
}

main().catch(console.error);
