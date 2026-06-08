export type ChainId = 'xrpl' | 'stellar' | 'hedera' | 'solana' | 'xdc' | 'algorand' | 'polygon';
export type ChainStatus = 'Live Altnet' | 'Testnet-ready' | 'Adapter preview';
export type ChainLogoId = 'xrpl' | 'stellar' | 'hedera' | 'solana' | 'xdc' | 'algorand' | 'polygon';

export type ChainAdapter = {
  id: ChainId;
  logo: ChainLogoId;
  name: string;
  shortName: string;
  network: string;
  status: ChainStatus;
  wallet: string;
  primitive: string;
  primitiveRef: string;
  endpoint: string;
  finality: string;
  adapterPackage: string;
  sampleAddress: string;
  recentRuns: string;
  accent: string;
  accentSoft: string;
};

export type IntegrationProfile = {
  id: string;
  name: string;
  sector: string;
  vault: string;
  claim: string;
  value: string;
  integrationGoal: string;
};

export const CHAIN_ADAPTERS: ChainAdapter[] = [
  {
    id: 'xrpl',
    logo: 'xrpl',
    name: 'XRPL Altnet',
    shortName: 'XRPL',
    network: 'XLS-66 lending vaults',
    status: 'Live Altnet',
    wallet: 'Xaman, Crossmark, GemWallet',
    primitive: 'NFToken policy plus XLS-66 vault state',
    primitiveRef: 'NFTokenTaxon=281',
    endpoint: '/claims/file',
    finality: '3-ledger confirmation',
    adapterPackage: '@wardprotocol/adapter-xrpl',
    sampleAddress: 'rWardDemo7p9Xls66Altnet',
    recentRuns: '317',
    accent: '#9fc6ff',
    accentSoft: 'rgba(159,198,255,0.16)',
  },
  {
    id: 'stellar',
    logo: 'stellar',
    name: 'Stellar',
    shortName: 'Stellar',
    network: 'Testnet lending contracts',
    status: 'Testnet-ready',
    wallet: 'Freighter, WalletConnect',
    primitive: 'Soroban contract state plus claimant balance',
    primitiveRef: 'contract_data:ward_policy',
    endpoint: '/conformance/stellar/run',
    finality: 'finalized ledger read',
    adapterPackage: '@wardprotocol/adapter-stellar',
    sampleAddress: 'GWARDDEMO7STELLARVAULT',
    recentRuns: '142',
    accent: '#7dd3fc',
    accentSoft: 'rgba(125,211,252,0.16)',
  },
  {
    id: 'hedera',
    logo: 'hedera',
    name: 'Hedera',
    shortName: 'Hedera',
    network: 'HBAR testnet',
    status: 'Testnet-ready',
    wallet: 'HashPack, Blade',
    primitive: 'HTS policy serial plus mirror-node vault state',
    primitiveRef: 'token_serial:ward_policy',
    endpoint: '/conformance/hedera/run',
    finality: 'mirror-node consensus',
    adapterPackage: '@wardprotocol/adapter-hedera',
    sampleAddress: '0.0.660281',
    recentRuns: '118',
    accent: '#a7f3d0',
    accentSoft: 'rgba(167,243,208,0.16)',
  },
  {
    id: 'solana',
    logo: 'solana',
    name: 'Solana',
    shortName: 'Solana',
    network: 'Devnet',
    status: 'Testnet-ready',
    wallet: 'Phantom, Backpack',
    primitive: 'SPL token account plus program vault state',
    primitiveRef: 'metadata.mint:ward_policy',
    endpoint: '/conformance/solana/run',
    finality: 'confirmed slot read',
    adapterPackage: '@wardprotocol/adapter-solana',
    sampleAddress: 'WardDemoSo1anaVaU1t9',
    recentRuns: '201',
    accent: '#c4b5fd',
    accentSoft: 'rgba(196,181,253,0.18)',
  },
  {
    id: 'xdc',
    logo: 'xdc',
    name: 'XDC',
    shortName: 'XDC',
    network: 'Apothem',
    status: 'Testnet-ready',
    wallet: 'MetaMask, XDC Pay',
    primitive: 'ERC policy token plus vault contract state',
    primitiveRef: 'wardPolicyToken.ownerOf',
    endpoint: '/conformance/xdc/run',
    finality: 'block finality window',
    adapterPackage: '@wardprotocol/adapter-xdc',
    sampleAddress: 'xdc8a4fWardDemoVault',
    recentRuns: '96',
    accent: '#fcd34d',
    accentSoft: 'rgba(252,211,77,0.16)',
  },
  {
    id: 'algorand',
    logo: 'algorand',
    name: 'Algorand',
    shortName: 'Algorand',
    network: 'Testnet',
    status: 'Testnet-ready',
    wallet: 'Pera, Defly',
    primitive: 'ASA policy asset plus application local state',
    primitiveRef: 'asa_id:ward_policy',
    endpoint: '/conformance/algorand/run',
    finality: 'round finality read',
    adapterPackage: '@wardprotocol/adapter-algorand',
    sampleAddress: 'WARDDEMOALGORANDVAULT',
    recentRuns: '134',
    accent: '#86efac',
    accentSoft: 'rgba(134,239,172,0.16)',
  },
  {
    id: 'polygon',
    logo: 'polygon',
    name: 'Polygon',
    shortName: 'Polygon',
    network: 'Amoy',
    status: 'Testnet-ready',
    wallet: 'MetaMask, WalletConnect',
    primitive: 'ERC policy token plus pool contract state',
    primitiveRef: 'wardPolicy.balanceOf',
    endpoint: '/conformance/polygon/run',
    finality: 'block confirmation read',
    adapterPackage: '@wardprotocol/adapter-polygon',
    sampleAddress: '0xWardDemoPolygonVault',
    recentRuns: '176',
    accent: '#d8b4fe',
    accentSoft: 'rgba(216,180,254,0.16)',
  },
];

export const INTEGRATION_PROFILES: IntegrationProfile[] = [
  {
    id: 'institutional-vault',
    name: 'Institutional lending vault',
    sector: 'Tokenized credit',
    vault: 'XLS-66 revolving credit facility',
    claim: 'Borrower default after missed settlement window',
    value: '$25M monitored facility',
    integrationGoal: 'Give depositors a deterministic default path before capital moves.',
  },
  {
    id: 'trade-finance',
    name: 'Trade finance program',
    sector: 'Invoice and receivables',
    vault: 'Pool-backed invoice credit vault',
    claim: 'Invoice not settled by maturity date',
    value: '$8.4M coverage pool',
    integrationGoal: 'Convert an operational default into a verifiable on-ledger resolution event.',
  },
  {
    id: 'protocol-credit',
    name: 'Credit protocol launch',
    sector: 'DeFi infrastructure',
    vault: 'Multi-chain collateralized loan market',
    claim: 'Vault health below policy threshold',
    value: '$12M pilot capacity',
    integrationGoal: 'Ship a credit market with a conformance receipt investors can inspect.',
  },
];

export const CONFORMANCE_CHECKS = [
  {
    id: '01',
    label: 'Policy artifact located',
    description: 'The adapter resolves the policy token, NFT, or contract reference before validation begins.',
  },
  {
    id: '02',
    label: 'Coverage window active',
    description: 'Coverage dates are compared against chain time or finalized ledger state, not server time.',
  },
  {
    id: '03',
    label: 'Vault binding confirmed',
    description: 'Claimant, vault, and policy references must agree before a claim can proceed.',
  },
  {
    id: '04',
    label: 'Default signal verified',
    description: 'Ward treats event streams as hints and re-reads authoritative ledger state.',
  },
  {
    id: '05',
    label: 'Loss math bounded',
    description: 'The vault loss must be greater than zero and capped before payout construction.',
  },
  {
    id: '06',
    label: 'Coverage pool solvent',
    description: 'The pool balance, reserve rules, and coverage cap are checked before settlement.',
  },
  {
    id: '07',
    label: 'Policy still live',
    description: 'The policy artifact has not been burned, closed, transferred, or invalidated.',
  },
  {
    id: '08',
    label: 'Claimant ownership proven',
    description: 'Wallet ownership and claimant identity are verified through the selected chain adapter.',
  },
  {
    id: '09',
    label: 'Signer boundary preserved',
    description: 'Ward returns unsigned settlement instructions. The institution signs. Ward never decides or settles.',
  },
];

export const ROADMAP_PHASES = [
  {
    phase: '01',
    title: 'Package the standard',
    status: 'Now',
    headline: 'Make deterministic default resolution impossible to misunderstand.',
    proof: 'Site narrative, docs, chain matrix, conformance language, security page, and pilot packet.',
  },
  {
    phase: '02',
    title: 'Win production pilots',
    status: '30-90 days',
    headline: 'Move from promising infrastructure to used infrastructure.',
    proof: 'Three pilot lanes: XRPL/XLS-66 aligned, one non-XRPL adapter, and one institutional credit partner.',
  },
  {
    phase: '03',
    title: 'External trust',
    status: '60-120 days',
    headline: 'Turn internal security maturity into buyer confidence.',
    proof: 'Third-party audit scope, threat model, incident response, and partner-run conformance suite.',
  },
  {
    phase: '04',
    title: 'Mainnet launch',
    status: 'XLS-66 dependent',
    headline: 'Be ready before the mainnet market is ready.',
    proof: 'Mainnet branch, adapter finalization, launch dashboard, pricing, and first conformant vault campaign.',
  },
  {
    phase: '05',
    title: 'Become the category',
    status: '6-18 months',
    headline: 'Make Ward the standard serious credit products integrate before capital scales.',
    proof: 'Certification, multi-chain adapters, validation history, security reputation, and institutional readiness.',
  },
];

export const DEMO_EVENTS = [
  'Create sandbox institution wallet',
  'Attach selected chain adapter',
  'Register project vault and policy reference',
  'Read authoritative ledger state',
  'Run deterministic conformance engine',
  'Generate unsigned settlement packet',
  'Issue Ward Conformance receipt',
];
