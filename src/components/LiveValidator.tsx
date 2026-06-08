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
    <div className="mx-auto max-w-4xl border-t border-white/10 px-0 py-8">
      <div className="mb-2 font-mono text-sm uppercase text-[#d4a93e]">
        Live Validation — {accountInfo.address.slice(0, 8)}...{accountInfo.address.slice(-6)}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#9eb0b7]">
          <span className="h-3 w-3 animate-spin rounded-full border border-[#9eb0b7] border-t-transparent" />
          Checking wallet for Ward policy NFTs...
        </div>
      )}

      {!loading && nfts.length === 0 && (
        <div className="rounded-[24px] border border-[#d4a93e]/30 bg-[#d4a93e]/10 p-5">
          <div className="mb-1 text-sm font-bold text-white">No wallet-held Ward policy NFT found</div>
          <p className="text-sm leading-relaxed text-[#d0dde0]">
            This wallet does not hold a Ward Protocol policy NFT (taxon 281) on Altnet.
            Live wallet validation needs a wallet-held artifact. The sandbox above can still run
            conformance with a generated demo policy artifact.
          </p>
          <p className="mt-2 text-sm text-[#d0dde0]">
            <span className="font-mono text-white">ward_signed = False</span> — all checks
            read live XRPL ledger state.
          </p>
        </div>
      )}

      {!loading && nfts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#00cc66]/25 bg-[#00cc66]/10 px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-[#00cc66]" />
              <span className="text-sm font-bold text-white">{nfts.length} Ward policy NFT{nfts.length > 1 ? 's' : ''} found</span>
            </div>
            <button
              onClick={handleValidate}
              disabled={validating}
              className="inline-flex items-center gap-2 rounded-full bg-[#f7f9f7] px-5 py-2.5 text-sm font-bold text-[#07131a] transition hover:bg-white disabled:opacity-50"
            >
              {validating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-[#07131a] border-t-transparent" />
                  Running Conformance...
                </>
              ) : 'Run Conformance'}
            </button>
          </div>

          <div className="font-mono text-sm text-[#9eb0b7]">
            NFT: {selectedNft?.slice(0, 16)}...{selectedNft?.slice(-8)}
          </div>

          {result && (
            <div className={`rounded-[24px] border p-5 ${result.approved ? 'border-[#00cc66]/30 bg-[#00cc66]/10' : 'border-[#d4a93e]/30 bg-[#d4a93e]/10'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-sm font-bold ${result.approved ? 'text-[#00cc66]' : 'text-white'}`}>
                  {result.approved ? '✓ WARD-CONFORMANT' : `${result.steps_passed} / 9 Steps Passed`}
                </div>
                {!result.approved && (
                  <span className="rounded border border-white/10 bg-white/[0.08] px-2 py-0.5 text-sm font-bold text-[#d0dde0]">
                    NOT CONFORMANT
                  </span>
                )}
              </div>
              {result.rejection_reason && (
                <p className="font-mono text-sm text-[#d0dde0]">{result.rejection_reason}</p>
              )}
              {result.approved && result.claim_payout_drops && (
                <p className="text-sm text-[#d0dde0]">
                  Payout: <span className="font-mono text-white">{(result.claim_payout_drops / 1_000_000).toFixed(2)} XRP</span>
                </p>
              )}
              <p className="mt-2 font-mono text-sm text-[#d0dde0]">ward_signed = False — all checks read live XRPL Altnet state</p>
            </div>
          )}

          {error && (
            <p className="font-mono text-sm text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
