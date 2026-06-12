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
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    other: [{ rel: 'manifest', url: '/site.webmanifest' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className={`${dmSans.className} bg-white text-[#0f2439]`}>
        <WalletProvider>
          <Nav />
          {children}
          <Footer />
        </WalletProvider>
      </body>
    </html>
  )
}
