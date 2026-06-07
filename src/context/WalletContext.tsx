'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AccountInfo {
  address: string
  network: string
  walletName: string
}

interface WalletContextType {
  walletManager: any | null
  isConnected: boolean
  accountInfo: AccountInfo | null
  setWalletManager: (manager: any) => void
  setIsConnected: (connected: boolean) => void
  setAccountInfo: (info: AccountInfo | null) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletManager, setWalletManagerState] = useState<any | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)

  const setWalletManager = useCallback((manager: any) => {
    setWalletManagerState(manager)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        walletManager,
        isConnected,
        accountInfo,
        setWalletManager,
        setIsConnected,
        setAccountInfo,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
