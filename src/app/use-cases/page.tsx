import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Use Cases | Tokenized Credit Conformance Infrastructure',
  description:
    'How Ward Protocol becomes the conformance and default-resolution layer for institutional lending, trade finance, compliance, and tokenized credit workflows.',
  openGraph: {
    title: 'Ward Use Cases',
    description: 'Default resolution and conformance infrastructure for tokenized credit markets.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Use Cases',
    description: 'See where deterministic default resolution becomes required infrastructure.',
  },
}

const scenarios = [
  {
    id: '01',
    category: 'Institutional Lending',
    title: 'The borrower does not pay.',
    question: 'What happens to the vault?',
    pressure:
      'The vault operator decides manually. Depositors wait. Legal, operations, and engineering all become part of the incident.',
    ward:
      'Ward runs nine deterministic checks against live XRPL ledger state when the default flag is set. If every check passes, the escrow release is prepared. If any check fails, the rejection reason is verifiable on-chain.',
    proof: 'Same outcome, same checks, same audit trail.',
  },
  {
    id: '02',
    category: 'Milestone Escrow',
    title: 'The condition is not met.',
    question: 'Who decides the outcome?',
    pressure:
      'An arbiter decides. A DAO votes. A timer expires. The system falls back to human discretion at the exact moment certainty matters.',
    ward:
      'Resolution conditions are registered before capital moves. Ward evaluates those conditions against ledger state and returns unsigned transactions. The institution signs. XRPL settles.',
    proof: 'No arbiter, no Ward key, no judgment call.',
  },
  {
    id: '03',
    category: 'Trade Finance',
    title: 'The invoice is not settled.',
    question: 'How does on-chain credit resolve?',
    pressure:
      'The on-chain record exists, but the settlement mechanism falls back to off-chain legal processes and fragmented operational work.',
    ward:
      'Ward gives XLS-66 credit obligations a standard default path. Resolution is native to the protocol, auditable by third parties, and independent of any single operator.',
    proof: 'Credit can move on-chain with a defined downside path.',
  },
  {
    id: '04',
    category: 'Compliance & Audit',
    title: 'The regulator asks what happened.',
    question: 'What is your answer?',
    pressure:
      'The answer is usually: it depends. It depends on the vault, the operator, internal policy, manual judgment, and whether anyone can reconstruct the trail.',
    ward:
      'The answer becomes a transaction hash, a ledger index, and nine checks that can be verified without asking Ward. The audit trail is the blockchain itself.',
    proof: 'A clean, inspectable answer for institutional review.',
  },
]

const signals = [
  {
    text: 'Risks become more programmatic. Observable. Quantifiable. That kind of visibility is what larger institutions look for.',
    attr: 'Asheesh Birla, CEO Evernorth',
  },
  {
    text: 'The protocol is ahead of the compliance tooling.',
    attr: 'XRPL Zone Paris Working Group',
  },
  {
    text: 'XLS-66 + Ward = risk-managed credit infrastructure institutions need before deploying serious capital.',
    attr: 'XRP Cipher Podcast',
  },
]

export default function UseCasesPage() {
  return (
    <main className="bg-[#f6f4ee] text-[#14242b]">
      <section className="relative overflow-hidden bg-[#14242b] px-6 py-20 text-[#f7faf8] md:px-10 lg:px-12">
        <div className="absolute inset-0 grid-overlay opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(182,215,206,0.10),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(212,169,62,0.08),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_460px]">
          <div>
            <div className="mb-5 font-mono text-sm font-bold text-[#d4a93e]">
              Tokenized Credit Use Cases
            </div>
            <h1 className="mb-6 max-w-3xl text-4xl font-black leading-tight text-[#f7faf8] md:text-6xl">
              Default resolution, designed for tokenized credit at institutional scale.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#d2e1dd] md:text-xl">
              Ward gives tokenized credit a standard answer to the hardest question:
              what happens when something goes wrong? The answer is deterministic,
              auditable, and never dependent on Ward holding a key.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/spec" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">View Specification</Link>
              <Link href="/demo" className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10">Open Integration Console</Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#b6d7ce]/15 bg-[#f7faf8]/10 p-7 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-mono text-sm text-[#c7d8d4]">WARD RESOLUTION LAYER</span>
              <span className="rounded-md border border-[#d4a93e]/30 bg-[#d4a93e]/15 px-3 py-1 font-mono text-sm font-bold text-[#d4a93e]">
                XLS-66
              </span>
            </div>
            <div className="space-y-4">
              {['Vault state confirmed', 'Policy NFT verified', 'Default flag checked', 'Escrow path prepared'].map((item, i) => (
                <div key={item} className="flex items-center gap-4 rounded-md border border-[#b6d7ce]/10 bg-[#101d23]/70 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#d4a93e]/15 font-mono text-sm font-bold text-[#d4a93e]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-base font-bold text-[#f7faf8]">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-md border-l-4 border-[#d4a93e] bg-[#101d23] p-5">
              <div className="mb-2 font-mono text-sm text-[#9fb7b1]">Core invariant</div>
              <div className="font-mono text-lg font-bold text-[#d4a93e]">ward_signed = False</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] px-6 py-20 md:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <div className="mb-4 font-mono text-sm font-bold text-[#9b6d13]">
              Plain English
            </div>
            <h2 className="mb-5 text-4xl font-black leading-tight text-[#14242b] md:text-5xl">
              The missing operating standard for on-chain credit.
            </h2>
            <p className="text-lg leading-8 text-[#3f534d]">
              Institutions do not need more dashboards. They need predictable resolution.
              Ward turns the default path into a technical standard that can be reviewed,
              repeated, and trusted.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Before capital moves', 'The vault, policy, and settlement rules are registered in a way Ward can evaluate deterministically.'],
              ['When default happens', 'Ward checks ledger state, not opinions. The result is either a valid unsigned transaction or a verifiable rejection reason.'],
              ['After resolution', 'The institution keeps signing control. The blockchain keeps the audit trail. Ward remains outside custody and settlement.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border border-[#14242b]/10 bg-white p-7 shadow-sm">
                <h3 className="mb-3 text-xl font-extrabold text-[#14242b]">{title}</h3>
                <p className="text-base leading-7 text-[#52665f]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#14242b] px-6 py-20 text-[#f7faf8] md:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <div className="mb-4 font-mono text-sm font-bold text-[#d4a93e]">
              Production Scenarios
            </div>
            <h2 className="mb-5 text-4xl font-black leading-tight text-[#f7faf8] md:text-5xl">
              Four institutional moments where Ward moves center stage.
            </h2>
            <p className="text-lg leading-8 text-[#c7d8d4]">
              Each use case is the same promise in a different operating environment:
              less discretion, more proof, and a resolution path the market can inspect.
            </p>
          </div>

          <div className="space-y-6">
            {scenarios.map((s) => (
              <article key={s.id} className="rounded-lg border border-[#b6d7ce]/10 bg-[#f7faf8]/10 p-6 shadow-xl shadow-black/10 md:p-8">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-[#d4a93e] px-3 py-1 font-mono text-sm font-bold text-[#14242b]">{s.id}</span>
                  <span className="font-mono text-sm font-bold text-[#d4a93e]">{s.category}</span>
                </div>
                <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <h3 className="mb-3 text-3xl font-black leading-tight text-white md:text-4xl">{s.title}</h3>
                    <p className="text-xl font-semibold text-[#b6d7ce]">{s.question}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-red-300/25 bg-red-950/20 p-5">
                      <div className="mb-3 font-mono text-sm font-semibold uppercase text-red-200">
                        Without Ward
                      </div>
                      <p className="text-base leading-7 text-[#f0d3d3]">{s.pressure}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-300/25 bg-emerald-950/20 p-5">
                      <div className="mb-3 font-mono text-sm font-semibold uppercase text-emerald-200">
                        With Ward
                      </div>
                      <p className="text-base leading-7 text-[#d8f3e6]">{s.ward}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 rounded-md border border-[#d4a93e]/25 bg-[#d4a93e]/10 px-5 py-4 font-mono text-sm font-bold text-[#d4a93e]">
                  {s.proof}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4ee] px-6 py-20 md:px-10 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <div className="mb-4 font-mono text-sm font-bold text-[#9b6d13]">
              Ecosystem Signal
            </div>
            <h2 className="mb-5 text-4xl font-black leading-tight text-[#14242b] md:text-5xl">
              The market is already describing the need.
            </h2>
            <p className="text-lg leading-8 text-[#3f534d]">
              The language around institutional DeFi keeps returning to the same themes:
              visibility, repeatability, and risk controls that can survive scrutiny.
            </p>
          </div>
          <div className="grid gap-4">
            {signals.map((q) => (
              <blockquote key={q.attr} className="rounded-lg border border-[#14242b]/10 bg-white p-6 shadow-sm">
                <p className="mb-5 text-lg leading-8 text-[#14242b]">&ldquo;{q.text}&rdquo;</p>
                <footer className="font-mono text-sm font-bold text-[#9b6d13]">{q.attr}</footer>
              </blockquote>
            ))}
            <p className="font-mono text-sm text-[#52665f]">Independent comments, not formal endorsements.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#14242b] px-6 py-20 text-center text-[#f7faf8] md:px-10 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 font-mono text-sm font-bold text-[#d4a93e]">
            Ward Center Stage
          </div>
          <h2 className="mb-5 text-4xl font-black leading-tight text-[#f7faf8] md:text-5xl">
            The default path should be as engineered as the lending product.
          </h2>
          <p className="mx-auto mb-9 max-w-2xl text-lg leading-8 text-[#c7d8d4]">
            Ward Protocol is not a button, a bot, or a back-office workaround.
            It is the resolution layer institutions can build around.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/spec" className="inline-flex min-h-12 items-center rounded-md bg-[#f7faf8] px-6 py-3 text-base font-bold text-[#14242b] transition hover:bg-white">Read the Spec</Link>
            <Link href="/build" className="inline-flex min-h-12 items-center rounded-md border border-[#b6d7ce]/30 px-6 py-3 text-base font-bold text-[#f7faf8] transition hover:border-[#b6d7ce] hover:bg-[#b6d7ce]/10">Build with Ward</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
