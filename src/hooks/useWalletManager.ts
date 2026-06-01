'use client'

import { useEffect } from 'react'
import { useWallet } from '../context/WalletContext'

export function useWalletManager() {
  const { setWalletManager, setIsConnected, setAccountInfo } = useWallet()

  useEffect(() => {
    let manager: any

    const init = async () => {
      const { WalletManager, XamanAdapter, CrossmarkAdapter, GemWalletAdapter } = await import('xrpl-connect')

      manager = new WalletManager({
        adapters: [
          new XamanAdapter({ apiKey: process.env.NEXT_PUBLIC_XAMAN_API_KEY || '' }),
          new CrossmarkAdapter(),
          new GemWalletAdapter(),
        ],
        network: 'testnet',
        autoConnect: true,
      })

      setWalletManager(manager)

      manager.on('connect', (account: any) => {
        setIsConnected(true)
        setAccountInfo({
          address: account.address,
          network: account.network || 'testnet',
          walletName: account.walletName || 'Unknown',
        })
      })

      manager.on('disconnect', () => {
        setIsConnected(false)
        setAccountInfo(null)
      })
    }

    init()

    return () => {
      manager?.removeAllListeners?.()
    }
  }, [])
}
