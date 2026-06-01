'use client'

import { useEffect, useRef } from 'react'
import { useWallet } from '../context/WalletContext'
import { useWalletManager } from '../hooks/useWalletManager'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'xrpl-wallet-connector': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'primary-wallet'?: string
          ref?: React.Ref<any>
        },
        HTMLElement
      >
    }
  }
}

export default function WalletConnector() {
  const { isConnected, accountInfo, walletManager } = useWallet()
  const connectorRef = useRef<HTMLElement>(null)
  useWalletManager()

  useEffect(() => {
    import('xrpl-connect').catch(() => {})
  }, [])

  useEffect(() => {
    const el = connectorRef.current
    if (!el || !walletManager) return
    ;(el as any).walletManager = walletManager
  }, [walletManager])

  const handleDisconnect = () => {
    walletManager?.disconnect()
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
    <xrpl-wallet-connector
      ref={connectorRef}
      primary-wallet="xaman"
      style={{
        '--xrpl-connect-primary': '#c8a94a',
        '--xrpl-connect-background': '#0d1f35',
        '--xrpl-connect-text': '#a8c5e8',
        '--xrpl-connect-border-radius': '6px',
      } as React.CSSProperties}
    />
  )
}
