'use client'

import { useEffect, useState } from 'react'

type ClaimStatus = 'PENDING' | 'VALIDATED' | 'REJECTED' | 'SETTLED'
type EscrowStatus = 'OPEN' | 'EXPIRING' | 'EXPIRED'

interface Claim {
  id: string
  nft_token_id: string
  vault_address: string
  claimant: string
  coverage_drops: number
  status: ClaimStatus
  steps_passed: number
  rejection_step?: number
  rejection_reason?: string
  escrow_tx?: string
  filed_at: number
}

interface Escrow {
  id: string
  vault_address: string
  amount_drops: number
  condition_hex: string
  created_at: number
  cancel_after: number
}

interface Policy {
  nft_token_id: string
  vault_address: string
  depositor: string
  coverage_drops: number
  expiry_ms: number
  is_multi_vault: boolean
}

const pad64 = (s: string) => (s + '0'.repeat(64)).slice(0, 64)

const MOCK_CLAIMS: Claim[] = [
  {
    id: 'clm-001',
    nft_token_id: pad64('WARD001A'),
    vault_address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    claimant: 'r3cQTjnW1yZv6goFEDNUtbmQ2mJVGSpgNK',
    coverage_drops: 10_000_000,
    status: 'VALIDATED',
    steps_passed: 9,
    filed_at: Date.now() - 3_600_000,
  },
  {
    id: 'clm-002',
    nft_token_id: pad64('WARD002B'),
    vault_address: 'rN7n3473SaZBCG4dFL83w7PB5vV3mBPFMt',
    claimant: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    coverage_drops: 5_000_000,
    status: 'PENDING',
    steps_passed: 4,
    filed_at: Date.now() - 900_000,
  },
  {
    id: 'clm-003',
    nft_token_id: pad64('WARD003C'),
    vault_address: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGX74',
    claimant: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    coverage_drops: 25_000_000,
    status: 'REJECTED',
    steps_passed: 2,
    rejection_step: 3,
    rejection_reason: 'Cross-vault claim rejected: NFT covers rEuL"¦, claim is against rN7n"¦',
    filed_at: Date.now() - 7_200_000,
  },
  {
    id: 'clm-004',
    nft_token_id: pad64('WARD004D'),
    vault_address: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    claimant: 'r3cQTjnW1yZv6goFEDNUtbmQ2mJVGSpgNK',
    coverage_drops: 8_000_000,
    status: 'SETTLED',
    steps_passed: 9,
    escrow_tx: 'A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2',
    filed_at: Date.now() - 86_400_000,
  },
]

const MOCK_ESCROWS: Escrow[] = [
  {
    id: 'esc-001',
    vault_address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    amount_drops: 10_000_000,
    condition_hex: 'A0258020' + pad64('cond1') + '810100',
    created_at: Date.now() - 3_600_000,
    cancel_after: Date.now() + 3_600_000 * 44,
  },
  {
    id: 'esc-002',
    vault_address: 'rN7n3473SaZBCG4dFL83w7PB5vV3mBPFMt',
    amount_drops: 5_000_000,
    condition_hex: 'A0258020' + pad64('cond2') + '810100',
    created_at: Date.now() - 172_800_000 + 3_600_000,
    cancel_after: Date.now() + 1_800_000,
  },
  {
    id: 'esc-003',
    vault_address: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGX74',
    amount_drops: 3_000_000,
    condition_hex: 'A0258020' + pad64('cond3') + '810100',
    created_at: Date.now() - 180_000_000,
    cancel_after: Date.now() - 7_200_000,
  },
]

const MOCK_POLICIES: Policy[] = [
  {
    nft_token_id: pad64('WARD001A'),
    vault_address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    depositor: 'r3cQTjnW1yZv6goFEDNUtbmQ2mJVGSpgNK',
    coverage_drops: 10_000_000,
    expiry_ms: Date.now() + 7_776_000_000,
    is_multi_vault: false,
  },
  {
    nft_token_id: pad64('WARD005E'),
    vault_address: 'rN7n3473SaZBCG4dFL83w7PB5vV3mBPFMt',
    depositor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    coverage_drops: 15_000_000,
    expiry_ms: Date.now() + 2_592_000_000,
    is_multi_vault: true,
  },
  {
    nft_token_id: pad64('WARD006F'),
    vault_address: 'rEuLyBCvcw4CFmzv8RepSiAoNgF8tTGX74',
    depositor: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    coverage_drops: 15_000_000,
    expiry_ms: Date.now() + 2_592_000_000,
    is_multi_vault: true,
  },
  {
    nft_token_id: pad64('WARD007G'),
    vault_address: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    depositor: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    coverage_drops: 50_000_000,
    expiry_ms: Date.now() + 86_400_000 * 8,
    is_multi_vault: false,
  },
]

function fmtXrp(drops: number) {
  return (drops / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) + ' XRP'
}

function fmtAddr(addr: string) {
  return addr.slice(0, 6) + '"¦' + addr.slice(-4)
}

function fmtNft(id: string) {
  return id.slice(0, 8) + '"¦' + id.slice(-4)
}

function fmtRelTime(ms: number) {
  const diff = Math.floor((Date.now() - ms) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function fmtCountdown(cancelAfter: number, now: number) {
  const remaining = cancelAfter - now
  if (remaining <= 0) return '00:00:00'
  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1_000)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function getEscrowStatus(escrow: Escrow, now: number): EscrowStatus {
  const remaining = escrow.cancel_after - now
  if (remaining <= 0) return 'EXPIRED'
  if (remaining < 7_200_000) return 'EXPIRING'
  return 'OPEN'
}

const STATUS_STYLES: Record<ClaimStatus, string> = {
  PENDING: 'text-gold bg-gold/10 border border-gold/30',
  VALIDATED: 'text-sky-400 bg-sky-400/10 border border-sky-400/30',
  REJECTED: 'text-red-400 bg-red-400/10 border border-red-400/30',
  SETTLED: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
}

const ESCROW_STATUS_STYLES: Record<EscrowStatus, string> = {
  OPEN: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/30',
  EXPIRING: 'text-gold bg-gold/10 border border-gold/30',
  EXPIRED: 'text-red-400 bg-red-400/10 border border-red-400/30',
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-mono font-semibold tracking-wider ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

function EscrowBadge({ status }: { status: EscrowStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-mono font-semibold tracking-wider ${ESCROW_STATUS_STYLES[status]}`}>
      {status}
    </span>
  )
}

function StepProgress({ steps, total = 9 }: { steps: number; total?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 w-3 rounded-sm ${i < steps ? 'bg-ice' : 'bg-white/10'}`}
        />
      ))}
    </div>
  )
}

export default function DashboardClient() {
  const [now, setNow] = useState(Date.now())
  const [refreshedAt, setRefreshedAt] = useState(Date.now())
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(30)

  useEffect(() => {
    const tick = setInterval(() => {
      const t = Date.now()
      setNow(t)
      const elapsed = Math.floor((t - refreshedAt) / 1000)
      const remaining = 30 - (elapsed % 30)
      setSecondsUntilRefresh(remaining)
      if (elapsed > 0 && elapsed % 30 === 0) {
        setRefreshedAt(t)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [refreshedAt])

  const pendingCount = MOCK_CLAIMS.filter((c) => c.status === 'PENDING').length
  const validatedCount = MOCK_CLAIMS.filter((c) => c.status === 'VALIDATED').length
  const settledCount = MOCK_CLAIMS.filter((c) => c.status === 'SETTLED').length
  const expiringCount = MOCK_ESCROWS.filter((e) => getEscrowStatus(e, now) === 'EXPIRING').length
  const totalCoverage = MOCK_POLICIES.reduce((sum, p) => sum + p.coverage_drops, 0)

  const depositorGroups = MOCK_POLICIES.reduce<Record<string, Policy[]>>((acc, p) => {
    if (!acc[p.depositor]) acc[p.depositor] = []
    acc[p.depositor].push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-navy text-white font-mono">
      {/* Header */}
      <header className="border-b border-white/10 bg-mid/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-condensed text-xl font-bold tracking-widest text-ice uppercase">
              Ward Protocol
            </span>
            <span className="text-dim text-sm">"º</span>
            <span className="text-sm text-white/60 font-condensed uppercase tracking-wider">
              Claim Dispute Dashboard
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded font-mono">
              ward_signed = False
            </span>
            <div className="flex items-center gap-2 text-sm text-dim">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span>TESTNET</span>
              <span className="text-white/30">·</span>
              <span>refresh in {secondsUntilRefresh}s</span>
            </div>
          </div>
        </div>
      </header>

      {/* Demo banner */}
      <div className="bg-gold/10 border-b border-gold/20 text-gold text-sm text-center py-2 font-mono">
        DEMO "" mock data · connect api.wardprotocol.org for live XRPL state
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pending Claims', value: pendingCount, accent: 'text-gold' },
            { label: 'Validated', value: validatedCount, accent: 'text-sky-400' },
            { label: 'Settled', value: settledCount, accent: 'text-emerald-400' },
            { label: 'Expiring Windows', value: expiringCount, accent: 'text-red-400' },
          ].map(({ label, value, accent }) => (
            <div key={label} className="bg-mid border border-white/10 rounded-lg px-4 py-4">
              <div className={`text-2xl font-bold font-condensed ${accent}`}>{value}</div>
              <div className="text-sm text-dim mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>

        {/* Active Claims panel */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-condensed text-lg font-bold uppercase tracking-widest text-ice">
              Active Claims
            </h2>
            <span className="text-sm text-dim">{MOCK_CLAIMS.length} total</span>
          </div>
          <div className="bg-mid border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-dim text-sm uppercase tracking-wider">
                  <th className="text-left px-4 py-3">NFT / Vault</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Claimant</th>
                  <th className="text-right px-4 py-3">Coverage</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Steps</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Filed</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CLAIMS.map((claim, i) => (
                  <tr
                    key={claim.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${i === MOCK_CLAIMS.length - 1 ? 'border-none' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-white/80 text-sm font-mono">{fmtNft(claim.nft_token_id)}</div>
                      <div className="text-dim text-sm mt-0.5">{fmtAddr(claim.vault_address)}</div>
                      {claim.rejection_reason && (
                        <div className="text-red-400/70 text-sm mt-1 max-w-xs truncate" title={claim.rejection_reason}>
                          ✕ step {claim.rejection_step}: {claim.rejection_reason}
                        </div>
                      )}
                      {claim.escrow_tx && (
                        <div className="text-emerald-400/70 text-sm mt-1">
                          escrow: {claim.escrow_tx.slice(0, 10)}"¦
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-white/60 text-sm">{fmtAddr(claim.claimant)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-ice text-sm">{fmtXrp(claim.coverage_drops)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="space-y-1">
                        <StepProgress steps={claim.steps_passed} />
                        <span className="text-dim text-sm">{claim.steps_passed}/9</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-dim text-sm">{fmtRelTime(claim.filed_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Two-column row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispute Window tracker */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-condensed text-lg font-bold uppercase tracking-widest text-ice">
                Dispute Windows
              </h2>
              <span className="text-sm text-dim">48h PREIMAGE-SHA-256</span>
            </div>
            <div className="bg-mid border border-white/10 rounded-lg divide-y divide-white/5">
              {MOCK_ESCROWS.map((escrow) => {
                const status = getEscrowStatus(escrow, now)
                const remaining = escrow.cancel_after - now
                const totalWindow = 172_800_000
                const elapsed = totalWindow - Math.max(0, remaining)
                const pct = Math.min(100, Math.max(0, (elapsed / totalWindow) * 100))
                return (
                  <div key={escrow.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-white/70 text-sm font-mono">{fmtAddr(escrow.vault_address)}</div>
                        <div className="text-dim text-sm mt-0.5">{fmtXrp(escrow.amount_drops)}</div>
                      </div>
                      <EscrowBadge status={status} />
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-dim">window elapsed</span>
                        <span className={`font-mono font-bold ${status === 'EXPIRED' ? 'text-red-400' : status === 'EXPIRING' ? 'text-gold' : 'text-emerald-400'}`}>
                          {status === 'EXPIRED' ? 'EXPIRED' : fmtCountdown(escrow.cancel_after, now)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${status === 'EXPIRED' ? 'bg-red-400' : status === 'EXPIRING' ? 'bg-gold' : 'bg-emerald-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-dim text-sm font-mono truncate" title={escrow.condition_hex}>
                      cond: {escrow.condition_hex.slice(0, 20)}"¦
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Policy Registry panel */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-condensed text-lg font-bold uppercase tracking-widest text-ice">
                Policy Registry
              </h2>
              <span className="text-sm text-dim">
                {MOCK_POLICIES.length} active · {fmtXrp(totalCoverage)} total
              </span>
            </div>
            <div className="bg-mid border border-white/10 rounded-lg divide-y divide-white/5">
              {Object.entries(depositorGroups).map(([depositor, policies]) => (
                <div key={depositor} className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-dim uppercase tracking-wider">Depositor</span>
                    <span className="text-white/70 text-sm font-mono">{fmtAddr(depositor)}</span>
                    {policies.some((p) => p.is_multi_vault) && (
                      <span className="text-sm text-gold bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded font-mono">
                        multi-vault
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {policies.map((policy) => {
                      const daysLeft = Math.max(0, Math.floor((policy.expiry_ms - now) / 86_400_000))
                      const expiringSoon = daysLeft < 10
                      return (
                        <div key={policy.nft_token_id} className="flex items-center justify-between bg-navy/50 rounded px-3 py-2">
                          <div>
                            <div className="text-white/60 text-sm font-mono">{fmtNft(policy.nft_token_id)}</div>
                            <div className="text-dim text-sm mt-0.5">{fmtAddr(policy.vault_address)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-ice text-sm font-mono">{fmtXrp(policy.coverage_drops)}</div>
                            <div className={`text-sm mt-0.5 ${expiringSoon ? 'text-red-400' : 'text-dim'}`}>
                              {daysLeft}d left
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-6 flex items-center justify-between text-sm text-dim">
          <span>
            Last refreshed {new Date(refreshedAt).toLocaleTimeString()} · All state from XRPL ledger
          </span>
          <span className="font-mono">ward_signed = False · taxon 281 · PREIMAGE-SHA-256</span>
        </footer>
      </main>
    </div>
  )
}
