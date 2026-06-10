'use client'

import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

const WALLETS = [
  { id: 'xaman',     label: 'Xaman',     desc: 'Mobile app' },
  { id: 'crossmark', label: 'Crossmark', desc: 'Browser extension' },
  { id: 'gemwallet', label: 'GemWallet', desc: 'Browser extension' },
]

export default function WalletConnector() {
  const { isConnected, accountInfo, setIsConnected, setAccountInfo } = useWallet()
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = async (adapterId: string) => {
    setLoading(adapterId)
    setError(null)
    try {
      const xrplConnect = await import('xrpl-connect')
      const { WalletManager } = xrplConnect

      const adapters: any[] = []
      if (adapterId === 'xaman') {
        const { XamanAdapter } = xrplConnect
        adapters.push(new XamanAdapter({ apiKey: process.env.NEXT_PUBLIC_XAMAN_API_KEY || '' }))
      } else if (adapterId === 'crossmark') {
        const { CrossmarkAdapter } = xrplConnect
        adapters.push(new CrossmarkAdapter())
      } else if (adapterId === 'gemwallet') {
        const { GemWalletAdapter } = xrplConnect
        adapters.push(new GemWalletAdapter())
      }

      const manager = new WalletManager({ adapters, network: 'testnet' })

      await new Promise<void>((resolve, reject) => {
        manager.on('connect', (account: any) => {
          setIsConnected(true)
          setAccountInfo({
            address: account.address,
            network: account.network || 'testnet',
            walletName: account.walletName || adapterId,
          })
          setShowPicker(false)
          resolve()
        })
        manager.on('error', (e: any) => reject(e))
        manager.connect(adapterId).catch(reject)
      })
    } catch (e: any) {
      setError(e?.message || 'Connection failed')
    } finally {
      setLoading(null)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAccountInfo(null)
  }

  if (isConnected && accountInfo) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[#00cc66]/25 bg-[#00cc66]/10 px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-[#00cc66]" />
          <span className="font-mono text-sm text-[#f7f9f7]">
            {accountInfo.address.slice(0, 8)}...{accountInfo.address.slice(-6)}
          </span>
          <span className="ml-1 text-sm uppercase text-[#a7c5e5]">
            {accountInfo.walletName}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm font-bold text-[#c8dce8] transition hover:bg-white/[0.06] hover:text-white"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-bold text-[#f7f9f7] transition hover:bg-white/[0.08]"
      >
        Connect Wallet
      </button>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-[28px] border border-white/10 bg-[#07131a] p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans text-lg font-black text-white">Select Wallet</h3>
              <button
                onClick={() => { setShowPicker(false); setError(null) }}
                className="text-lg leading-none text-[#a7c5e5] hover:text-white"
              >
                ×
              </button>
            </div>
            <p className="mb-4 font-mono text-sm text-[#a7c5e5]">
              Verify wallet ownership — no transaction submitted. ward_signed = False.
            </p>
            <div className="flex flex-col gap-2">
              {WALLETS.map(w => (
                <button
                  key={w.id}
                  onClick={() => connect(w.id)}
                  disabled={loading !== null}
                  className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-[#d4a93e]/40 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">{w.label}</div>
                    <div className="text-sm text-[#a7c5e5]">{w.desc}</div>
                  </div>
                  {loading === w.id && (
                    <span className="h-4 w-4 animate-spin rounded-full border border-[#f7f9f7] border-t-transparent" />
                  )}
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-3 font-mono text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
