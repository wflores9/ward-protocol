import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://wardprotocol.org'),
  title: 'Ward Protocol — Default Protection for XLS-66 Lending Vaults',
  description:
    'Ward Protocol is the open specification for deterministic default protection on XLS-66 lending vaults on the XRP Ledger.',
  openGraph: {
    title: 'Ward Protocol',
    description: 'Trustless default protection for XRPL institutional lending vaults.',
    url: 'https://wardprotocol.org',
    siteName: 'Ward Protocol',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Ward Protocol', description: 'Trustless default protection for XRPL institutional lending vaults.' },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
