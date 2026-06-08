import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ward Integration Console | Multi-Chain Conformance Demo',
  description: 'Self-demo Ward as a real integration console: provision a sandbox wallet, attach a chain adapter, run nine on-ledger checks, and export a conformance receipt.',
  openGraph: {
    title: 'Ward Integration Console',
    description: 'Run the conformance and default-resolution layer for tokenized credit across multi-chain adapter lanes.',
    images: [{ url: '/brand/ward-banner.png', width: 1920, height: 480 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Integration Console',
    description: 'Provision a sandbox wallet, attach a chain adapter, and export a Ward conformance receipt.',
  },
};
