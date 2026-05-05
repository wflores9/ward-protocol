import Link from 'next/link'
import WardMark from './WardMark'

export default function Footer() {
  return (
    <footer className="border-t border-p2 bg-white px-6 md:px-12 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WardMark size={18} />
          <span className="text-[10px] text-dim font-mono">
            © 2026 Ward Protocol. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/spec"    className="text-[10px] text-dim hover:text-steel transition-colors no-underline">Spec</Link>
          <Link href="/docs"    className="text-[10px] text-dim hover:text-steel transition-colors no-underline">Docs</Link>
          <Link href="/privacy" className="text-[10px] text-dim hover:text-steel transition-colors no-underline">Privacy</Link>
          <Link href="/terms"   className="text-[10px] text-dim hover:text-steel transition-colors no-underline">Terms</Link>
          <a
            href="https://github.com/wflores9/ward-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-dim hover:text-steel transition-colors no-underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
