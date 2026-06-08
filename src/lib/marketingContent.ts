/**
 * Centralized marketing copy for Ward Protocol.
 * Update here — changes propagate everywhere automatically.
 * Do NOT import this into spec/, docs/, demo/, or any technical pages.
 */

export const MARKETING = {
  // Hero
  eyebrow: 'INSTITUTIONAL TOKENIZED CREDIT · CONFORMANCE STANDARD',
  headline: 'Deterministic default-resolution infrastructure for institutional tokenized credit.',
  subheadline:
    'Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults, preserve the signer boundary, and export reviewable conformance receipts serious partners can inspect.',
  statusLine: 'v0.2.6 · 8 testnet rails · 529 tests across Python, Rust, and TypeScript · June 2026 hardening complete.',

  // Brand
  tagline: 'Deterministic default-resolution infrastructure for institutional tokenized credit.',
  invariant: 'ward_signed = False — always.',

  // Meta
  metaTitle: 'Ward Protocol | Deterministic Default-Resolution Infrastructure',
  metaDescription:
    'Ward Protocol is deterministic default-resolution infrastructure for institutional tokenized credit: reviewable conformance, unsigned settlement packets, and ward_signed = False.',

  // Status
  version: 'v0.2.6',
  network: 'XRPL Altnet',
  tests: '436/436',
} as const
