/**
 * Centralized marketing copy for Ward Protocol.
 * Update here — changes propagate everywhere automatically.
 * Do NOT import this into spec/, docs/, demo/, or any technical pages.
 */

import { WARD_MARKETING_STATS } from '@/lib/wardMetrics'

export const MARKETING = {
  // Hero
  eyebrow: 'INSTITUTIONAL TOKENIZED CREDIT · CONFORMANCE STANDARD',
  headline: 'Deterministic default-resolution infrastructure for institutional tokenized credit.',
  subheadline:
    'Ward gives lenders, vault operators, and credit protocols a deterministic way to validate defaults, preserve the signer boundary, and export reviewable conformance receipts serious partners can inspect.',
  statusLine: `${WARD_MARKETING_STATS.chainAdapters} chains · ${WARD_MARKETING_STATS.testsPassing} tests across Python, Rust, and TypeScript · June 2026 hardening complete.`,

  // Brand
  tagline: 'Deterministic default-resolution infrastructure for institutional tokenized credit.',
  invariant: 'ward_signed = False — always.',

  // Meta
  metaTitle: 'Ward Protocol | Deterministic Default-Resolution Infrastructure',
  metaDescription:
    'Ward Protocol is deterministic default-resolution infrastructure for institutional tokenized credit: reviewable conformance, unsigned settlement packets, and ward_signed = False.',

  // Status
  version: 'registry-sourced',
  network: 'XRPL Altnet',
  tests: `${WARD_MARKETING_STATS.testsPassing}/${WARD_MARKETING_STATS.testsPassing}`,
} as const
