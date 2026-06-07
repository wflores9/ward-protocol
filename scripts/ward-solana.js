import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const SECRET_KEY = process.env.SOLANA_SECRET_KEY;
if (!SECRET_KEY) throw new Error('Set SOLANA_SECRET_KEY in .env');

const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(SECRET_KEY)));
const publicKey = keypair.publicKey.toString();

async function wardResolveUnsigned(claimantPubkey, vaultPubkey, policyId) {
  console.log('Ward Solana Resolution — ward_signed = False');
  console.log('Claimant:', claimantPubkey);
  console.log('Vault:', vaultPubkey);
  console.log('Policy ID:', policyId);

  // Check 1 — Policy ID valid
  if (!policyId || policyId === 0) {
    return { valid: false, reason: 'Check 1: invalid policy ID' };
  }

  // Check 3 — Vault address valid
  if (!vaultPubkey) {
    return { valid: false, reason: 'Check 3: vault address missing' };
  }

  // Check 8 — Claimant account exists on ledger
  try {
    const accountInfo = await connection.getAccountInfo(new PublicKey(claimantPubkey));
    if (!accountInfo) return { valid: false, reason: 'Check 8: claimant account not found on ledger' };
  } catch (e) {
    return { valid: false, reason: 'Check 8: invalid claimant address' };
  }

  // Build unsigned resolution transaction — ward_signed = False
  const { blockhash } = await connection.getLatestBlockhash();
  const transaction = new Transaction({
    recentBlockhash: blockhash,
    feePayer: new PublicKey(claimantPubkey),
  }).add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(claimantPubkey),
      toPubkey: new PublicKey(claimantPubkey),
      lamports: 0,
    })
  );

  // NEVER sign — ward_signed = False always
  const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
  const unsignedB64 = serialized.toString('base64');

  return {
    valid: true,
    reason: 'RESOLVED: ward_signed=False',
    unsignedB64,
    wardSigned: false,
  };
}

async function main() {
  console.log('\n=== Ward Protocol — Solana Devnet E2E ===\n');
  console.log('Address:', publicKey);

  const balance = await connection.getBalance(keypair.publicKey);
  console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL\n');

  // Valid resolution
  const result = await wardResolveUnsigned(publicKey, 'AR4kydgJXmmppGGDS1ZDCroAP94LRRsFcw5Vf6CFTRMj', 281);
  console.log('Valid claim →', result.valid, '|', result.reason);
  console.log('wardSigned:', result.wardSigned, '— must be false');

  // Check 1 failure
  const r2 = await wardResolveUnsigned(publicKey, 'AR4kydgJXmmppGGDS1ZDCroAP94LRRsFcw5Vf6CFTRMj', 0);
  console.log('Zero policy →', r2.valid, '|', r2.reason);

  // Check 3 failure
  const r3 = await wardResolveUnsigned(publicKey, null, 281);
  console.log('Null vault →', r3.valid, '|', r3.reason);

  console.log('\nE2E complete — ward_signed = False throughout');
}

main().catch(console.error);
