'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'

const ALTNET_RPC = 'https://s.altnet.rippletest.net:51234/'
const WARD_POLICY_TAXON = 281
const WARD_API = 'https://api.wardprotocol.org'
const INST_KEY = process.env.NEXT_PUBLIC_WARD_INST_KEY || ''

interface PolicyNFT {
  nft_token_id: string
  uri: string
}

interface ValidationResult {
  approved: boolean
  steps_passed: number
  rejection_reason?: string
  claim_payout_drops?: number
}

async function fetchWardNFTs(address: string): Promise<PolicyNFT[]> {
  const res = await fetch(ALTNET_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_nfts',
      params: [{ account: address, ledger_index: 'validated' }]
    })
  })
  const data = await res.json()
  const nfts = data?.result?.account_nfts || []
  return nfts
    .filter((n: any) => n.NFTokenTaxon === WARD_POLICY_TAXON)
    .map((n: any) => ({ nft_token_id: n.NFTokenID, uri: n.URI || '' }))
}

async function runValidation(
  claimant: string,
  nft_token_id: string,
): Promise<ValidationResult> {
  const res = await fetch(`${WARD_API}/claims/file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Institution-Key': INST_KEY,
    },
    body: JSON.stringify({
      claimant_address: claimant,
      policy_nft_id: nft_token_id,
      vault_id: claimant,
      condition_hex: '00'.repeat(32),
    })
  })
  const data = await res.json()
  if (!res.ok) {
    return {
      approved: false,
      steps_passed: data?.detail?.steps_passed || 0,
      rejection_reason: data?.detail?.message || data?.message || 'Validation failed',
    }
  }
  return {
    approved: data.approved || false,
    steps_passed: data.steps_passed || 0,
    rejection_reason: data.rejection_reason,
    claim_payout_drops: data.claim_payout_drops,
  }
}

export default function LiveValidator() {
  const { isConnected, accountInfo } = useWallet()
  const [nfts, setNfts] = useState<PolicyNFT[]>([])
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [selectedNft, setSelectedNft] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !accountInfo) {
      setNfts([])
      setResult(null)
      setSelectedNft(null)
      return
    }
    setLoading(true)
    setError(null)
    fetchWardNFTs(accountInfo.address)
      .then(found => {
        setNfts(found)
        if (found.length > 0) setSelectedNft(found[0].nft_token_id)
      })
      .catch(() => setError('Failed to fetch NFTs from Altnet'))
      .finally(() => setLoading(false))
  }, [isConnected, accountInfo])

  if (!isConnected || !accountInfo) return null

  const handleValidate = async () => {
    if (!selectedNft || !accountInfo) return
    setValidating(true)
    setResult(null)
    setError(null)
    try {
      const res = await runValidation(accountInfo.address, selectedNft)
      setResult(res)
    } catch (e: any) {
      setError(e?.message || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 border-b border-gold/20">
      <div className="text-sm uppercase tracking-[.15em] text-[#c8a94a] mb-2 font-mono">
        Live Validation — {accountInfo.address.slice(0, 8)}...{accountInfo.address.slice(-6)}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-sub">
          <span className="w-3 h-3 border border-sub border-t-transparent rounded-full animate-spin" />
          Checking wallet for Ward policy NFTs...
        </div>
      )}

      {!loading && nfts.length === 0 && (
        <div className="bg-[#fffdf5] border border-[#c8a94a]/30 rounded-md p-4">
          <div className="text-sm font-bold text-steel mb-1">No Ward policy NFT found</div>
          <p className="text-sm text-sub leading-relaxed">
            This wallet does not hold a Ward Protocol policy NFT (taxon 281) on Altnet.
            A policy NFT is required to run claim validation. Ward correctly rejects
            wallets without on-chain coverage — this is the system working as designed.
          </p>
          <p className="text-sm text-sub mt-2">
            <span className="text-steel font-mono">ward_signed = False</span> — all checks
            read live XRPL ledger state.
          </p>
        </div>
      )}

      {!loading && nfts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f0fff8] border border-green rounded-md px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-[#00cc66]" />
              <span className="text-sm font-bold text-steel">{nfts.length} Ward policy NFT{nfts.length > 1 ? 's' : ''} found</span>
            </div>
            <button
              onClick={handleValidate}
              disabled={validating}
              className="inline-flex items-center gap-2 bg-steel text-ice px-4 py-2 rounded-md text-sm font-mono hover:bg-[#122030] transition-colors disabled:opacity-50"
            >
              {validating ? (
                <>
                  <span className="w-3 h-3 border border-ice border-t-transparent rounded-full animate-spin" />
                  Running 9-step validation...
                </>
              ) : 'Run Live Validation →'}
            </button>
          </div>

          <div className="font-mono text-sm text-sub">
            NFT: {selectedNft?.slice(0, 16)}...{selectedNft?.slice(-8)}
          </div>

          {result && (
            <div className={`rounded-md border p-4 ${result.approved ? 'border-green bg-[#f0fff8]' : 'border-[#c8a94a]/40 bg-[#fffdf5]'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-sm font-bold ${result.approved ? 'text-[#00994d]' : 'text-steel'}`}>
                  {result.approved ? '✓ WARD-CONFORMANT' : `${result.steps_passed} / 9 Steps Passed`}
                </div>
                {!result.approved && (
                  <span className="text-sm font-bold px-2 py-0.5 rounded border text-dim bg-p2 border-border">
                    NOT CONFORMANT
                  </span>
                )}
              </div>
              {result.rejection_reason && (
                <p className="text-sm text-sub font-mono">{result.rejection_reason}</p>
              )}
              {result.approved && result.claim_payout_drops && (
                <p className="text-sm text-sub">
                  Payout: <span className="text-steel font-mono">{(result.claim_payout_drops / 1_000_000).toFixed(2)} XRP</span>
                </p>
              )}
              <p className="text-sm text-sub mt-2 font-mono">ward_signed = False — all checks read live XRPL Altnet state</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 font-mono">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
