import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://wardprotocol.org'),
  title: 'Ward Protocol — Default Protection for Institutional Lending on XRPL',
  description:
    'Ward Protocol is the open specification for default protection on XLS-66 lending vaults on the XRP Ledger. Nine on-ledger checks. No oracle. No Ward signature — ever.',
  openGraph: {
    title: 'Ward Protocol — Default Protection for Institutional Lending on XRPL',
    description: 'Nine on-ledger checks. No oracle. No Ward signature — ever.',
    url: 'https://wardprotocol.org',
    siteName: 'Ward Protocol',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ward Protocol — Default Protection for Institutional Lending on XRPL',
    description: 'Nine on-ledger checks. No oracle. No Ward signature — ever.',
  },
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
