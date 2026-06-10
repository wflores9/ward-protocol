'use client';

import { useState } from 'react';

const installBlocks = [
  {
    id: 'python-sdk',
    label: 'Python SDK',
    command: 'pip install ward-protocol==0.2.6',
    body: 'Validator services, vault monitors, conformance jobs, and institutional backend flows.',
  },
  {
    id: 'typescript-sdk',
    label: 'TypeScript SDK',
    command: 'npm install @wardprotocol/sdk',
    body: 'Product consoles, dashboards, rail orchestration, and receipt export.',
  },
  {
    id: 'hosted-api',
    label: 'Hosted API',
    command: 'POST https://api.wardprotocol.org/conformance/run',
    body: 'Pilot integrations where teams want Ward-managed infrastructure and enterprise onboarding.',
  },
] as const;

export default function InstallBlocks() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (id: string, command: string) => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(command);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
  };

  return (
    <div className="mt-14 grid gap-6 lg:grid-cols-3">
      {installBlocks.map((block) => (
        <article
          key={block.id}
          id={block.id}
          className="scroll-mt-28 rounded-xl border bg-white p-6 shadow-[0_1px_3px_rgba(15,36,57,0.08)]"
          style={{ borderColor: 'rgba(167,197,229,0.4)' }}
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#a7c5e5]">{block.label}</p>
          <div className="relative mt-4">
            <pre
              className="overflow-hidden whitespace-pre-wrap break-all rounded-lg border p-4 pr-20 font-mono text-sm leading-7 text-[#0f2439]"
              style={{ borderColor: 'rgba(167,197,229,0.35)', background: '#f8fafc' }}
            >
              <code>{block.command}</code>
            </pre>
            <button
              onClick={() => copy(block.id, block.command)}
              aria-label={copied === block.id ? 'Copied' : `Copy ${block.label} command`}
              className="absolute right-3 top-3 rounded-md border px-3 py-1.5 font-mono text-xs font-semibold text-[#5a7a99] transition hover:border-[rgba(167,197,229,0.6)] hover:text-[#0f2439]"
              style={{ borderColor: 'rgba(167,197,229,0.4)', background: '#ffffff' }}
            >
              {copied === block.id ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mt-5 text-[15px] leading-[1.75] text-[#5a7a99]">{block.body}</p>
        </article>
      ))}
    </div>
  );
}
