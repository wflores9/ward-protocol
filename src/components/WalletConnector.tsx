'use client'

import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

export default function WalletConnector() {
  const { isConnected, accountInfo, setIsConnected, setAccountInfo } = useWallet()
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      const { WalletManager, XamanAdapter, CrossmarkAdapter, GemWalletAdapter } = await import('xrpl-connect')
      const manager = new WalletManager({
        adapters: [
          new XamanAdapter({ apiKey: process.env.NEXT_PUBLIC_XAMAN_API_KEY || '' }),
          new CrossmarkAdapter(),
          new GemWalletAdapter(),
        ],
        network: 'testnet',
      })

      manager.on('connect', (account: any) => {
        setIsConnected(true)
        setAccountInfo({
          address: account.address,
          network: account.network || 'testnet',
          walletName: account.walletName || 'Wallet',
        })
        setLoading(false)
      })

      manager.on('error', () => setLoading(false))
      await manager.connect()
    } catch (e) {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
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
          <span className="text-[10px] text-sub uppercase tracking-wider">
            {accountInfo.walletName}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-sub hover:text-steel border border-border rounded-md px-3 py-2 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-steel text-ice px-5 py-2.5 rounded-md text-sm font-mono hover:bg-[#122030] transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <span className="w-3 h-3 border border-ice border-t-transparent rounded-full animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </button>
  )
}
