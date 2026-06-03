import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ward Protocol — Use Cases',
  description: 'Deterministic default resolution for institutional lending, milestone escrow, and trade finance on-chain.',
}

const scenarios = [
  {
    id: '01',
    bg: 'bg-white',
    title: 'The borrower does not pay.',
    subtitle: 'What happens to the vault?',
    category: 'Institutional Lending',
    without: 'The vault operator decides what happens. Manually. With discretion. With delay. Depositors wait.',
    with: 'Nine deterministic checks run against live XRPL ledger state the moment the default flag is set. No oracle. No human judgment. No Ward signature. If all nine pass, the escrow releases to the claimant automatically. If any check fails, the claim is rejected with a verifiable reason code — on-chain. The resolution is the same every time, for every institution, regardless of who is running the vault.',
    quote: 'Risks become more programmatic. Observable. Quantifiable. That kind of visibility is what larger institutions look for.',
    attr: 'Asheesh Birla, CEO Evernorth',
    role: 'XRPL Commons · April 2026',
  },
  {
    id: '02',
    bg: 'bg-[#f8fafc]',
    title: 'The condition is not met.',
    subtitle: 'Who decides the escrow outcome?',
    category: 'Milestone & Conditional Escrow',
    without: 'An arbiter decides. A DAO votes. A timer expires. The resolution is discretionary, slow, and contestable.',
    with: 'The resolution conditions are encoded at registration. Ward evaluates them deterministically against on-chain state. Either the conditions are met or they are not. There is no judgment call. The claimant holds the preimage — Ward never does. Ward constructs unsigned transactions. The institution signs. XRPL settles. Disputes are eliminated by design, not by arbitration.',
    quote: 'The ledger itself governs borrowing terms, repayments, and authorization — a key differentiator from other DeFi approaches.',
    attr: 'Ripple Insights',
    role: 'The Next Phase of Institutional DeFi on XRPL · September 2025',
  },
  {
    id: '03',
    bg: 'bg-white',
    title: 'The invoice is not settled.',
    subtitle: 'How does on-chain credit resolve?',
    category: 'Trade Finance & Credit',
    without: 'Resolution falls back to off-chain legal processes. The on-chain record exists but the settlement mechanism does not. Institutions are left bridging two worlds manually.',
    with: 'Default resolution is native to the lending protocol. The same nine checks that govern DeFi lending vaults apply to any XLS-66 credit obligation. The resolution is on-chain, auditable, and independent of jurisdiction. No financial institution will deploy serious capital into on-chain credit without knowing what the downside scenario looks like. Ward defines it.',
    quote: 'A default at one facility does not spill into others, in sharp contrast to pooled DeFi systems where contagion can spread.',
    attr: '24/7 Wall St',
    role: 'XRPL Lending Protocol Coverage · February 2026',
  },
  {
    id: '04',
    bg: 'bg-[#f8fafc]',
    title: 'The regulator asks what happens on default.',
    subtitle: 'What is your answer?',
    category: 'Compliance & Audit',
    without: 'The answer is: it depends. It depends on who runs the vault, what their internal policy is, whether they follow it, and whether anyone is watching. There is no standard answer. There is no audit trail. There is no on-chain proof. Regulators hate this answer.',
    with: 'The answer is: here is the transaction hash. Nine checks ran against live blockchain state at this ledger index. Steps 1 through 9 passed. The escrow released at this timestamp. Every step is verifiable by any third party, at any time, without asking Ward. The audit trail is the blockchain itself. Ward never held a key. Ward never made a judgment. The ledger decided.',
    quote: 'The protocol is ahead of the compliance tooling.',
    attr: 'XRPL Zone Paris Working Group',
    role: 'April 14, 2026',
  },
]

const signals = [
  { text: 'Risks become more programmatic. Observable. Quantifiable. That kind of visibility is what larger institutions look for.', attr: 'Asheesh Birla, CEO Evernorth', role: 'XRPL Commons · April 2026' },
  { text: 'The protocol is ahead of the compliance tooling.', attr: 'XRPL Zone Paris Working Group', role: 'April 14, 2026' },
  { text: 'XLS-66 + Ward = risk-managed credit infrastructure institutions need before deploying serious capital.', attr: 'XRP Cipher Podcast', role: 'April 2026' },
  { text: 'In Ward We Trust.', attr: 'Grape (@RealGrapedrop)', role: 'XRPL Developer · 44K views' },
]

export default function UseCasesPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b border-gold/20 bg-white px-6 md:px-12 py-14">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs uppercase tracking-[.15em] text-ice2 mb-3 font-mono">Ward Protocol — Use Cases</div>
          <h1 className="font-condensed font-black text-5xl md:text-6xl text-steel mb-4 leading-none">
            The question every institution asks.
          </h1>
          <p className="text-base text-sub max-w-2xl leading-relaxed">
            What happens when the borrower does not pay? Today, there is no standard answer on-chain.
            Every vault operator builds their own resolution logic — or ignores the risk entirely.
            Ward Protocol is the answer. Deterministic. Auditable. On-chain.
          </p>
        </div>
      </div>

      {/* Plain English */}
      <section className="bg-[#f8fafc] px-6 md:px-12 py-16 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-mono text-[#c8a94a] uppercase tracking-widest mb-3">Ward Protocol — Plain English</div>
          <h2 className="font-condensed font-black text-4xl text-steel mb-2">No jargon. Just the problem and the answer.</h2>
          <p className="text-sm text-sub mb-10 max-w-2xl">
            You don&apos;t need to know what XLS-66 is. You just need to know what happens when something goes wrong.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              {
                icon: '⚠️',
                title: 'Billions in loans. No standard for what happens when they go wrong.',
                body: 'Digital lending is moving on-chain. Institutions are deploying real capital into blockchain-based loan vaults. But nobody has defined what happens when a borrower defaults. Every platform handles it differently — or not at all.',
              },
              {
                icon: '🔄',
                title: 'Manual decisions. Slow resolution. Human error.',
                body: 'Today, when a digital loan defaults, someone has to decide what happens. That means delays, disputes, and inconsistency. It means counterparty risk. It means institutional capital sitting in limbo while humans argue.',
              },
              {
                icon: '🛡️',
                title: 'Nine checks. Automatic resolution. No one in the middle.',
                body: 'Ward Protocol defines exactly what happens on default — before it happens. Nine conditions are checked automatically against the blockchain. If they pass, funds are released. If they don\'t, the claim is rejected. No delays. No disputes. No Ward signature — ever.',
              },
            ].map(card => (
              <div key={card.icon} className="bg-white border border-gray-100 rounded-md p-6 shadow-sm">
                <div className="text-3xl mb-4">{card.icon}</div>
                <div className="font-condensed font-black text-base text-steel mb-3 leading-snug">{card.title}</div>
                <p className="text-sm text-sub leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="bg-steel text-ice font-mono text-xs font-semibold px-5 py-3 text-left">Without Ward</th>
                  <th className="bg-steel text-ice font-mono text-xs font-semibold px-5 py-3 text-left">With Ward</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Manual decision by vault operator',  'Automatic 9-step on-chain validation'],
                  ['Outcome varies by platform',         'Same outcome every time, every institution'],
                  ['Disputes require arbitration',       'Disputes eliminated by design'],
                  ['Off-chain legal fallback',           'Fully on-chain resolution'],
                  ['No audit trail',                     'Every check verifiable on the ledger'],
                  ['Counterparty risk',                  'ward_signed = False — no Ward keys'],
                ].map(([without, with_], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                    <td className="px-5 py-3 text-sub border-t border-gray-100">{without}</td>
                    <td className="px-5 py-3 border-t border-gray-100 font-medium" style={{ color: '#00cc66' }}>{with_}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Scenarios */}
      {scenarios.map(s => (
        <section key={s.id} className={`${s.bg} px-6 md:px-12 py-16 border-b border-gray-100`}>
          <div className="max-w-4xl mx-auto">
            <div className="text-xs font-mono text-[#c8a94a] uppercase tracking-widest mb-2">
              Scenario {s.id} — {s.category}
            </div>
            <h2 className="font-condensed font-black text-4xl text-steel mb-1">{s.title}</h2>
            <p className="text-lg text-sub mb-8">{s.subtitle}</p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#fff5f5] border border-red-100 rounded-md p-5">
                <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-3">Without Ward</div>
                <p className="text-sm text-sub leading-relaxed">{s.without}</p>
              </div>
              <div className="bg-[#f0fdf6] border border-green-100 rounded-md p-5">
                <div className="text-[10px] font-mono text-[#00cc66] uppercase tracking-widest mb-3">With Ward</div>
                <p className="text-sm text-steel font-medium leading-relaxed">{s.with}</p>
              </div>
            </div>

            <blockquote className="border-l-2 border-[#c8a94a] pl-5">
              <p className="text-sm text-steel italic mb-2">&ldquo;{s.quote}&rdquo;</p>
              <footer className="text-xs text-sub font-mono">{s.attr} · {s.role}</footer>
            </blockquote>
          </div>
        </section>
      ))}

      {/* Ecosystem signal */}
      <section className="bg-steel px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-mono text-[#c8a94a] uppercase tracking-widest mb-3">Ecosystem Signal</div>
          <h2 className="font-condensed font-black text-4xl text-ice mb-2">They described it before we built it.</h2>
          <p className="text-sm text-dim mb-10 max-w-xl">
            Independent commentary from builders, analysts, and operators in the XRPL ecosystem. None of these were prompted.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {signals.map(q => (
              <div key={q.attr} className="bg-deep border border-border rounded-md p-5">
                <p className="text-sm text-ice leading-relaxed mb-4">&ldquo;{q.text}&rdquo;</p>
                <div className="text-xs text-[#c8a94a] font-mono">{q.attr}</div>
                <div className="text-xs text-dim font-mono">{q.role}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-dim">These are independent comments, not formal endorsements.</p>
        </div>
      </section>

      {/* Core invariant CTA */}
      <section className="bg-white px-6 md:px-12 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs font-mono text-[#c8a94a] uppercase tracking-widest mb-3">The Core Invariant</div>
          <h2 className="font-condensed font-black text-4xl text-steel mb-4">ward_signed = False — always.</h2>
          <p className="text-sm text-sub max-w-2xl mx-auto leading-relaxed mb-8">
            Ward constructs unsigned transactions. Institutions sign. XRPL settles. Ward is never a counterparty,
            never a custodian, never a signatory. In every scenario above, the institution retains full control
            of the signing key.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/spec" className="btn-primary">View Specification →</Link>
            <Link href="/demo" className="btn-ghost">Try the Demo</Link>
          </div>
        </div>
      </section>
    </>
  )
}
