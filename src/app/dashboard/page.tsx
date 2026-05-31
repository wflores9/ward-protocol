import type { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export const metadata: Metadata = {
  title: 'Ward Protocol — Claim Dispute Dashboard',
  description:
    'Active claims, dispute window countdowns, and policy registry for Ward Protocol institutions. All state from XRPL ledger.',
}

export default function DashboardPage() {
  return <DashboardClient />
}
