import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { WalletProvider } from '@/context/WalletContext'

export const metadata: Metadata = {
  metadataBase: new URL('https://wardprotocol.org'),
  title: 'Ward Protocol — Deterministic Default Resolution for XLS-66 Lending Vaults',
  description:
    'Deterministic default resolution for XLS-66 lending vaults on the XRP Ledger. ward_signed = False — always.',
  openGraph: {
    title: 'Ward Protocol — Deterministic Default Resolution for XLS-66 Lending Vaults',
    description: 'Nine on-ledger checks. No oracle. No Ward signature — ever.',
    url: 'https://wardprotocol.org',
    siteName: 'Ward Protocol',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Protocol — Deterministic Default Resolution for XLS-66 Lending Vaults',
    description: 'Nine on-ledger checks. No oracle. No Ward signature — ever.',
  },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Nav />
          {children}
          <Footer />
        </WalletProvider>
      </body>
    </html>
  )
}
