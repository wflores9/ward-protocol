import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ward Integration Console | Multi-Chain Conformance Demo',
  description: 'Self-demo Ward as a real integration console: provision a sandbox wallet, select an integration rail, run nine on-ledger checks, and export a conformance receipt.',
  openGraph: {
    title: 'Ward Integration Console',
    description: 'Run the conformance and default-resolution layer for tokenized credit across eight testnet rails.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Integration Console',
    description: 'Provision a sandbox wallet, select a testnet rail, and export a Ward conformance receipt.',
  },
};
