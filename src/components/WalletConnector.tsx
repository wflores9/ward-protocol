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
        <div className="flex items-center gap-2 bg-[#f0fff8] border border-green rounded-md px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#00cc66]" />
          <span className="font-mono text-xs text-steel">
            {accountInfo.address.slice(0, 8)}...{accountInfo.address.slice(-6)}
          </span>
          <span className="text-[10px] text-sub uppercase tracking-wider ml-1">
            {accountInfo.walletName}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-xs text-sub hover:text-steel border border-border rounded-md px-3 py-2 transition-colors"
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
        className="inline-flex items-center gap-2 bg-steel text-ice px-5 py-2.5 rounded-md text-sm font-mono hover:bg-[#122030] transition-colors"
      >
        Connect Wallet
      </button>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-6 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-condensed font-black text-lg text-steel">Select Wallet</h3>
              <button
                onClick={() => { setShowPicker(false); setError(null) }}
                className="text-sub hover:text-steel text-lg leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-sub mb-4 font-mono">
              Verify wallet ownership — no transaction submitted. ward_signed = False.
            </p>
            <div className="flex flex-col gap-2">
              {WALLETS.map(w => (
                <button
                  key={w.id}
                  onClick={() => connect(w.id)}
                  disabled={loading !== null}
                  className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:border-[#c8a94a] hover:bg-[#fffdf5] transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="text-sm font-bold text-steel">{w.label}</div>
                    <div className="text-xs text-sub">{w.desc}</div>
                  </div>
                  {loading === w.id && (
                    <span className="w-4 h-4 border border-steel border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-3 text-xs text-red-500 font-mono">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
