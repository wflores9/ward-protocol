import Image from 'next/image';
import Link from 'next/link';

import ChainLogo from '@/components/ChainLogo';
import MermaidDiagram from '@/components/MermaidDiagram';
import { PILOT_URL } from '@/lib/navigation';
import { CHAIN_ADAPTERS, PILOT_READINESS_PHASES } from '@/lib/wardPlatform';

const proofStats = [
  { value: '634', label: 'tests passing', note: 'Python, Rust, TypeScript' },
  { value: '32', label: 'invariants', note: 'Signer, ledger, routing, receipts' },
  { value: '8', label: 'testnet rails', note: 'XRPL plus cross-chain adapters' },
  { value: '0', label: 'Ward signing keys', note: 'ward_signed = False' },
];

const platformCards = [
  {
    title: 'Conformance engine',
    body: 'Nine deterministic checks convert policy, vault, ownership, coverage, and default evidence into an approval or rejection that can be inspected by risk, engineering, and compliance.',
  },
  {
    title: 'Signer boundary',
    body: 'Ward prepares validation results and unsigned settlement instructions. Institutions sign. The chain settles. Ward never becomes a counterparty, custodian, or signer.',
  },
  {
    title: 'Evidence receipts',
    body: 'Every run exports the evidence path: chain state, failed or passed checks, settlement readiness, and the invariant that no operator can override the result.',
  },
];

const trustRows = [
  ['Mainnet posture', 'XRPL mainnet launch is treated as a dependency on XLS-65 and XLS-66 amendment status, not as a marketing claim.'],
  ['Security standard', 'High-assurance architecture, invariants register, threat model work, and pre-mainnet audit artifacts are part of the buyer packet.'],
  ['Developer path', 'Python SDK, TypeScript SDK, hosted API, and demo receipts give partners a reviewable integration surface.'],
  ['Market wedge', 'Tokenized credit needs default resolution that is deterministic, on-ledger, and separate from the signing institution.'],
];

const architectureChart = `flowchart LR
  A[Institutional credit product] --> B[Ward conformance API or SDK]
  B --> C[Nine on-ledger evidence checks]
  C --> D{Conformance result}
  D -->|approved| E[Unsigned settlement packet]
  D -->|rejected| F[Deterministic rejection reason]
  E --> G[Institution signs]
  G --> H[Chain settles]
  C --> I[Shareable conformance receipt]
  I --> J[Risk, compliance, engineering review]
`;

export default function Home() {
  return (
    <main className="premium-shell">
      <section className="premium-hero">
        <div className="premium-hero-grid" />
        <div className="site-container relative z-10 py-20 md:py-28 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-5xl">
              <div className="premium-kicker">
                <span /> Institutional tokenized credit infrastructure
              </div>
              <h1 className="premium-h1">
                The conformance and default-resolution layer for tokenized credit.
              </h1>
              <p className="premium-lede">
                Ward lets institutions, lending vaults, and credit protocols resolve defaults deterministically, on-ledger, without Ward signing or deciding outcomes.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="premium-button premium-button-primary">
                  Discuss a pilot
                </a>
                <Link href="/demo" className="premium-button premium-button-secondary">
                  Open conformance workspace
                </Link>
                <Link href="/assurance" className="premium-button premium-button-ghost">
                  Review assurance
                </Link>
              </div>
              <div className="premium-trust-strip mt-10">
                <span>ward_signed = False</span>
                <span>9 evidence checks</span>
                <span>XLS-66 mainnet dependent</span>
              </div>
            </div>

            <div className="premium-console" aria-label="Ward conformance receipt preview">
              <div className="premium-console-top">
                <div>
                  <p>Ward Conformance Receipt</p>
                  <h2>Tokenized Credit Vault</h2>
                </div>
                <span>READY</span>
              </div>
              <div className="premium-console-body">
                {[
                  ['Decision source', 'Authoritative ledger state only'],
                  ['Resolution layer', 'Default validation and unsigned settlement packet'],
                  ['Signer boundary', 'Institution signs every settlement action'],
                  ['Audit artifact', 'Shareable conformance receipt'],
                ].map(([label, value]) => (
                  <div key={label} className="premium-console-row">
                    <p>{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <div className="premium-code-line">
                <span>ward_signed</span> = False <em>- always</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-proof">
        <div className="site-container">
          <div className="grid gap-px md:grid-cols-4">
            {proofStats.map((stat) => (
              <article key={stat.label} className="premium-proof-cell">
                <p>{stat.value}</p>
                <h2>{stat.label}</h2>
                <span>{stat.note}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="site-container">
          <div className="premium-section-head">
            <p className="premium-label">Infrastructure standard</p>
            <h2>Ward is not a demo, oracle, or claims app.</h2>
            <p>
              It is the control plane serious credit products use to prove that default handling is deterministic, evidenced, and outside Ward custody.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {platformCards.map((card) => (
              <article key={card.title} className="premium-card">
                <div className="premium-card-rule" />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section premium-section-muted">
        <div className="site-container">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="premium-section-head sticky top-28">
              <p className="premium-label">Chain readiness</p>
              <h2>One conformance model. Chain-native evidence.</h2>
              <p>
                XRPL Altnet is the live wallet lane. Other rails are testnet proof surfaces until their partner-specific integration path is finalized.
              </p>
            </div>
            <div className="premium-chain-grid">
              {CHAIN_ADAPTERS.map((chain) => (
                <article key={chain.id} className="premium-chain-card">
                  <div className="flex items-start justify-between gap-4">
                    <ChainLogo id={chain.logo} label={`${chain.name} logo`} className="h-12 w-12" />
                    <span>{chain.status}</span>
                  </div>
                  <h3>{chain.name}</h3>
                  <p>{chain.network}</p>
                  <small>{chain.integrationSurface}</small>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div className="premium-section-head">
              <p className="premium-label">Architecture</p>
              <h2>Reviewable by design.</h2>
              <p>
                The diagram is rendered from Mermaid source so the architecture remains inspectable text, not a decorative bitmap. It can evolve with the protocol and stay close to the GitHub design docs.
              </p>
              <Link href="/docs" className="premium-inline-link">Open developer docs</Link>
            </div>
            <MermaidDiagram chart={architectureChart} title="Ward conformance architecture" />
          </div>
        </div>
      </section>

      <section className="premium-section premium-section-muted">
        <div className="site-container">
          <div className="premium-section-head">
            <p className="premium-label">Enterprise diligence</p>
            <h2>The buyer packet is evidence, not adjectives.</h2>
          </div>
          <div className="premium-diligence">
            {trustRows.map(([label, body]) => (
              <article key={label}>
                <h3>{label}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="premium-section">
        <div className="site-container">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="premium-section-head">
              <p className="premium-label">Pilot readiness</p>
              <h2>From self-serve review to production certification.</h2>
              <p>
                Ward’s next phase is turning working infrastructure into trusted market infrastructure through pilots, audit scope, and partner-run conformance.
              </p>
            </div>
            <div className="premium-timeline">
              {PILOT_READINESS_PHASES.map((phase) => (
                <article key={phase.phase}>
                  <div>{phase.phase}</div>
                  <section>
                    <span>{phase.window}</span>
                    <h3>{phase.title}</h3>
                    <p>{phase.body}</p>
                  </section>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="premium-final-cta">
        <div className="site-container">
          <div className="premium-final-panel">
            <Image src="/brand/ward-mark-square.png" alt="" width={96} height={96} className="rounded-[22px]" />
            <div>
              <p className="premium-label">Pilots open now</p>
              <h2>Ward is proving that serious credit markets should standardize on deterministic default resolution.</h2>
              <p>Start with the conformance workspace. Move into a pilot packet when the evidence is ready for your team.</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/demo" className="premium-button premium-button-primary">Run the workspace</Link>
                <a href={PILOT_URL} target="_blank" rel="noopener noreferrer" className="premium-button premium-button-secondary">Talk to Ward</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
