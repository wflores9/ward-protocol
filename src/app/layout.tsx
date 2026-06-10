import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { WalletProvider } from '@/context/WalletContext'
import { MARKETING } from '@/lib/marketingContent'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://wardprotocol.org'),
  title: MARKETING.metaTitle,
  description: MARKETING.metaDescription,
  openGraph: {
    title: MARKETING.metaTitle,
    description: 'Nine on-ledger checks. No oracle. No Ward signature — ever.',
    url: 'https://wardprotocol.org',
    siteName: 'Ward Protocol',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: MARKETING.metaTitle,
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
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className={`${dmSans.className} bg-[#f0f4f8] text-[#0f2439]`}>
        <WalletProvider>
          <Nav />
          {children}
          <Footer />
        </WalletProvider>
      </body>
    </html>
  )
}
