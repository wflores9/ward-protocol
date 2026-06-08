import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ward Conformance Workspace | Multi-Chain Demo',
  description:
    'Run Ward’s multi-chain conformance workspace: select a testnet rail, execute deterministic default-resolution checks, and export an institutional receipt with ward_signed = False.',
  openGraph: {
    title: 'Ward Conformance Workspace',
    description: 'Run deterministic default-resolution infrastructure for tokenized credit across eight testnet rails.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Conformance Workspace',
    description: 'Select a testnet rail, run conformance, and export a Ward receipt with ward_signed = False.',
  },
};
