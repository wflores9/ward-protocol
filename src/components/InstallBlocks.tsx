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
        <article key={block.id} id={block.id} className="site-panel-muted rounded-[32px] p-7 scroll-mt-28">
          <p className="font-mono text-sm font-bold text-[#d4a93e]">{block.label}</p>
          <div className="relative mt-5">
            <pre className="overflow-hidden whitespace-pre-wrap break-all rounded-[24px] border border-white/10 bg-[#07131a]/70 p-5 pr-20 font-mono text-sm leading-7 text-[#c8dce8]">
              <code>{block.command}</code>
            </pre>
            <button
              onClick={() => copy(block.id, block.command)}
              aria-label={copied === block.id ? 'Copied' : `Copy ${block.label} command`}
              className="absolute right-3 top-3 rounded-[14px] border border-white/10 bg-white/[0.06] px-3 py-2 font-mono text-xs font-bold text-[#c8dce8] transition hover:bg-white/[0.12] hover:text-white"
            >
              {copied === block.id ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="site-copy mt-5">{block.body}</p>
        </article>
      ))}
    </div>
  );
}
