export type ChainId = 'xrpl' | 'flare' | 'xrpl_evm' | 'xdc' | 'polygon' | 'stellar' | 'hedera' | 'algorand' | 'solana';
export type ChainStatus = 'E2E verified' | 'Contract deployed' | 'Account funded' | 'Testnet-ready';
export type ChainLogoId = 'xrpl' | 'flare' | 'xrpl_evm' | 'xdc' | 'polygon' | 'stellar' | 'hedera' | 'algorand' | 'solana';

export type ChainAction = {
  label: string;
  href: string;
};

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
  proof: string;
  endpoint: string;
  finality: string;
  integrationSurface: string;
  sampleAddress: string;
  deploymentRef: string;
  policyArtifact: string;
  policyPrefix: string;
  walletActions: ChainAction[];
  liveMode: 'wallet-live' | 'testnet-surface';
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
    status: 'E2E verified',
    wallet: 'Xaman, Crossmark, GemWallet',
    primitive: 'NFToken policy plus XLS-66 vault state',
    primitiveRef: 'Policy NFT taxon 281',
    proof: 'F01-F06 verified on Altnet',
    endpoint: '/claims/file',
    finality: '3-ledger confirmation',
    integrationSurface: '@wardprotocol/sdk / xrpl',
    sampleAddress: 'rWardDemo7p9Xls66Altnet',
    deploymentRef: 'F01-F06 Altnet verified',
    policyArtifact: 'XLS-20 policy NFT',
    policyPrefix: 'NFT-281',
    walletActions: [
      { label: 'Connect Xaman', href: 'https://xaman.app/' },
      { label: 'Open GemWallet', href: 'https://gemwallet.app/' },
      { label: 'XRPL Altnet', href: 'https://xrpl.org/docs/concepts/networks-and-servers/parallel-networks' },
    ],
    liveMode: 'wallet-live',
    accent: '#9fc6ff',
    accentSoft: 'rgba(159,198,255,0.16)',
  },
  {
    id: 'flare',
    logo: 'flare',
    name: 'Flare',
    shortName: 'Flare',
    network: 'Coston2',
    status: 'Contract deployed',
    wallet: 'MetaMask, WalletConnect',
    primitive: 'WardResolver contract plus vault state',
    primitiveRef: 'Coston2 WardResolver contract',
    proof: 'Coston2 contract deployed',
    endpoint: '/conformance/flare/run',
    finality: 'EVM block confirmation',
    integrationSurface: '@wardprotocol/sdk / flare',
    sampleAddress: '0xWardDemoFlareVault',
    deploymentRef: '0x7912593b...',
    policyArtifact: 'WardResolver policy contract',
    policyPrefix: 'FLR-POLICY',
    walletActions: [
      { label: 'MetaMask', href: 'https://metamask.io/' },
      { label: 'Coston2 faucet', href: 'https://faucet.flare.network/coston2' },
      { label: 'Flare explorer', href: 'https://coston2-explorer.flare.network/' },
    ],
    liveMode: 'testnet-surface',
    accent: '#e91e63',
    accentSoft: 'rgba(233,30,99,0.16)',
  },
  {
    id: 'xrpl_evm',
    logo: 'xrpl_evm',
    name: 'XRPL EVM',
    shortName: 'XRPL EVM',
    network: 'Sidechain testnet',
    status: 'E2E verified',
    wallet: 'MetaMask, WalletConnect',
    primitive: 'EVM policy contract plus XRPL-aligned vault state',
    primitiveRef: 'Sidechain policy contract',
    proof: 'Sidechain contract deployed and E2E verified',
    endpoint: '/conformance/xrpl-evm/run',
    finality: 'EVM block confirmation',
    integrationSurface: '@wardprotocol/sdk / xrpl-evm',
    sampleAddress: '0xWardDemoXrplEvmVault',
    deploymentRef: '0xdaad34e8...',
    policyArtifact: 'XRPL EVM policy contract',
    policyPrefix: 'XEVM-POLICY',
    walletActions: [
      { label: 'MetaMask', href: 'https://metamask.io/' },
      { label: 'XRPL EVM docs', href: 'https://opensource.ripple.com/docs/evm-sidechain/' },
      { label: 'Explorer', href: 'https://explorer.testnet.xrplevm.org/' },
    ],
    liveMode: 'testnet-surface',
    accent: '#9fc6ff',
    accentSoft: 'rgba(159,198,255,0.16)',
  },
  {
    id: 'xdc',
    logo: 'xdc',
    name: 'XDC',
    shortName: 'XDC',
    network: 'Apothem',
    status: 'Contract deployed',
    wallet: 'MetaMask, XDC Pay',
    primitive: 'ERC policy token plus vault contract state',
    primitiveRef: 'XDC policy contract',
    proof: 'Apothem contract deployed',
    endpoint: '/conformance/xdc/run',
    finality: 'block finality window',
    integrationSurface: '@wardprotocol/sdk / xdc',
    sampleAddress: 'xdc8a4fWardDemoVault',
    deploymentRef: '0x68ec2fc5...',
    policyArtifact: 'XDC policy contract',
    policyPrefix: 'XDC-POLICY',
    walletActions: [
      { label: 'XDC Pay', href: 'https://chromewebstore.google.com/detail/xdc-pay/bocpokimicclpaiekenaeelehdjllofo' },
      { label: 'Apothem faucet', href: 'https://faucet.apothem.network/' },
      { label: 'Apothem explorer', href: 'https://explorer.apothem.network/' },
    ],
    liveMode: 'testnet-surface',
    accent: '#fcd34d',
    accentSoft: 'rgba(252,211,77,0.16)',
  },
  {
    id: 'polygon',
    logo: 'polygon',
    name: 'Polygon',
    shortName: 'Polygon',
    network: 'Amoy',
    status: 'Contract deployed',
    wallet: 'MetaMask, WalletConnect',
    primitive: 'ERC policy token plus pool contract state',
    primitiveRef: 'Polygon policy contract',
    proof: 'Amoy contract deployed',
    endpoint: '/conformance/polygon/run',
    finality: 'block confirmation read',
    integrationSurface: '@wardprotocol/sdk / polygon',
    sampleAddress: '0xWardDemoPolygonVault',
    deploymentRef: '0x2c5897f4...',
    policyArtifact: 'Polygon policy contract',
    policyPrefix: 'MATIC-POLICY',
    walletActions: [
      { label: 'MetaMask', href: 'https://metamask.io/' },
      { label: 'Amoy faucet', href: 'https://faucet.polygon.technology/' },
      { label: 'Amoy explorer', href: 'https://amoy.polygonscan.com/' },
    ],
    liveMode: 'testnet-surface',
    accent: '#d8b4fe',
    accentSoft: 'rgba(216,180,254,0.16)',
  },
  {
    id: 'stellar',
    logo: 'stellar',
    name: 'Stellar',
    shortName: 'Stellar',
    network: 'Testnet lending contracts',
    status: 'Account funded',
    wallet: 'Freighter, WalletConnect',
    primitive: 'Soroban contract state plus claimant balance',
    primitiveRef: 'Soroban policy record',
    proof: 'Friendbot verified testnet account',
    endpoint: '/conformance/stellar/run',
    finality: 'finalized ledger read',
    integrationSurface: '@wardprotocol/sdk / stellar',
    sampleAddress: 'GWARDDEMO7STELLARVAULT',
    deploymentRef: '4b655c2b...',
    policyArtifact: 'Soroban policy record',
    policyPrefix: 'XLM-POLICY',
    walletActions: [
      { label: 'Freighter', href: 'https://www.freighter.app/' },
      { label: 'Stellar lab', href: 'https://lab.stellar.org/' },
      { label: 'Testnet explorer', href: 'https://stellar.expert/explorer/testnet' },
    ],
    liveMode: 'testnet-surface',
    accent: '#7dd3fc',
    accentSoft: 'rgba(125,211,252,0.16)',
  },
  {
    id: 'algorand',
    logo: 'algorand',
    name: 'Algorand',
    shortName: 'Algorand',
    network: 'Testnet',
    status: 'Account funded',
    wallet: 'Pera, Defly',
    primitive: 'ASA policy asset plus application local state',
    primitiveRef: 'ASA policy asset',
    proof: 'Testnet address funded',
    endpoint: '/conformance/algorand/run',
    finality: 'round finality read',
    integrationSurface: '@wardprotocol/sdk / algorand',
    sampleAddress: 'WARDDEMOALGORANDVAULT',
    deploymentRef: 'EXENEGR6...',
    policyArtifact: 'Algorand ASA policy asset',
    policyPrefix: 'ALGO-POLICY',
    walletActions: [
      { label: 'Pera wallet', href: 'https://perawallet.app/' },
      { label: 'Algorand dispenser', href: 'https://bank.testnet.algorand.network/' },
      { label: 'Testnet explorer', href: 'https://testnet.explorer.perawallet.app/' },
    ],
    liveMode: 'testnet-surface',
    accent: '#86efac',
    accentSoft: 'rgba(134,239,172,0.16)',
  },
  {
    id: 'hedera',
    logo: 'hedera',
    name: 'Hedera',
    shortName: 'Hedera',
    network: 'Testnet',
    status: 'Account funded',
    wallet: 'HashPack, Blade, WalletConnect',
    primitive: 'HTS policy token plus smart-contract vault state',
    primitiveRef: 'Hedera policy token',
    proof: 'Testnet account funded',
    endpoint: '/conformance/hedera/run',
    finality: 'consensus finality read',
    integrationSurface: '@wardprotocol/sdk / hedera',
    sampleAddress: '0.0.5924811',
    deploymentRef: '0.0.5924811',
    policyArtifact: 'Hedera policy token',
    policyPrefix: 'HBAR-POLICY',
    walletActions: [
      { label: 'HashPack', href: 'https://www.hashpack.app/' },
      { label: 'Portal', href: 'https://www.portalhq.io/' },
      { label: 'HashScan testnet', href: 'https://hashscan.io/testnet' },
    ],
    liveMode: 'testnet-surface',
    accent: '#8ff3d8',
    accentSoft: 'rgba(143,243,216,0.18)',
  },
  {
    id: 'solana',
    logo: 'solana',
    name: 'Solana',
    shortName: 'Solana',
    network: 'Devnet',
    status: 'Account funded',
    wallet: 'Phantom, Backpack',
    primitive: 'SPL token account plus program vault state',
    primitiveRef: 'SPL policy mint',
    proof: 'Devnet address funded',
    endpoint: '/conformance/solana/run',
    finality: 'confirmed slot read',
    integrationSurface: '@wardprotocol/sdk / solana',
    sampleAddress: 'WardDemoSo1anaVaU1t9',
    deploymentRef: 'AR4kydgJ...',
    policyArtifact: 'Solana SPL policy mint',
    policyPrefix: 'SOL-POLICY',
    walletActions: [
      { label: 'Phantom', href: 'https://phantom.com/' },
      { label: 'Solana faucet', href: 'https://faucet.solana.com/' },
      { label: 'Devnet explorer', href: 'https://explorer.solana.com/?cluster=devnet' },
    ],
    liveMode: 'testnet-surface',
    accent: '#c4b5fd',
    accentSoft: 'rgba(196,181,253,0.18)',
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
    description: 'The selected rail resolves the policy token, NFT, or contract reference before validation begins.',
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
    description: 'Wallet ownership and claimant identity are verified through the selected integration rail.',
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
    proof: 'Three pilot lanes: XRPL/XLS-66 aligned, one non-XRPL rail, and one institutional credit partner.',
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
    proof: 'Mainnet branch, rail finalization, launch dashboard, pricing, and first conformant vault campaign.',
  },
  {
    phase: '05',
    title: 'Become the category',
    status: '6-18 months',
    headline: 'Make Ward the standard serious credit products integrate before capital scales.',
    proof: 'Certification, multi-chain rails, validation history, security reputation, and institutional readiness.',
  },
];

export const PILOT_READINESS_PHASES = [
  {
    phase: '01',
    window: 'Now',
    title: 'Self-serve conformance review',
    body: 'Expose the specification, demo workspace, SDK/API surfaces, and receipt model so partners can review Ward without a guided sales call.',
  },
  {
    phase: '02',
    window: '30-60 days',
    title: 'XRPL/XLS-66 pilot lane',
    body: 'Use the XRPL Altnet path for wallet validation, policy NFT evidence, 3-ledger confirmation, and unsigned settlement review.',
  },
  {
    phase: '03',
    window: '60-120 days',
    title: 'Cross-chain testnet proof pack',
    body: 'Package Flare, XRPL EVM, XDC, Polygon, Stellar, Algorand, and Solana testnet artifacts into partner-reviewable receipts.',
  },
  {
    phase: '04',
    window: 'Mainnet trigger',
    title: 'Production readiness and certification',
    body: 'Pair the third-party audit path with pilot receipts, mainnet branch readiness, and the public conformance registry.',
  },
];

export const DEMO_EVENTS = [
  'Create sandbox institution wallet',
  'Create demo policy artifact',
  'Bind selected testnet rail',
  'Register project vault and policy reference',
  'Read authoritative ledger state',
  'Run deterministic conformance engine',
  'Generate unsigned settlement packet',
  'Issue Ward Conformance receipt',
];
