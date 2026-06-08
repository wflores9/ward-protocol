import type { ChainLogoId } from '@/lib/wardPlatform';

type Props = {
  id: ChainLogoId;
  className?: string;
  label?: string;
};

const LOGO_FRAMES: Record<ChainLogoId, { alt: string; background: string }> = {
  xrpl: { alt: 'XRPL logo', background: 'bg-white' },
  flare: { alt: 'Flare logo', background: 'bg-[#e62058]' },
  xrpl_evm: { alt: 'XRPL EVM logo', background: 'bg-[#10151d]' },
  stellar: { alt: 'Stellar logo', background: 'bg-white' },
  solana: { alt: 'Solana logo', background: 'bg-[#0c1020]' },
  xdc: { alt: 'XDC Network logo', background: 'bg-white' },
  algorand: { alt: 'Algorand logo', background: 'bg-white' },
  polygon: { alt: 'Polygon logo', background: 'bg-white' },
  hedera: { alt: 'Hedera logo', background: 'bg-white' },
};

function LogoGlyph({ id }: { id: ChainLogoId }) {
  switch (id) {
    case 'xrpl':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <path d="M16 20c4.8 0 7.8 1.9 11.1 5.8l9.7 12.3c2.4 3 4.6 4.2 8.4 4.2h3.8" fill="none" stroke="#111827" strokeWidth="5" strokeLinecap="round" />
          <path d="M48 20c-4.8 0-7.8 1.9-11.1 5.8l-9.7 12.3c-2.4 3-4.6 4.2-8.4 4.2H15" fill="none" stroke="#111827" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'flare':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="#e62058" />
          <path d="M21 22h22l-7.6 8.3h6.8L26 48h8.3l-4.8-9H22l7.5-8.4h-7.2L21 22z" fill="#fff" />
        </svg>
      );
    case 'xrpl_evm':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <rect x="3" y="3" width="58" height="58" rx="18" fill="#10151d" />
          <path d="M17 22c4 0 6.8 1.5 9.5 4.8l8.1 10c1.9 2.4 3.8 3.5 7 3.5h5.4" fill="none" stroke="#9fc6ff" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M47 22c-4 0-6.8 1.5-9.5 4.8l-8.1 10c-1.9 2.4-3.8 3.5-7 3.5H17" fill="none" stroke="#9fc6ff" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M19 50h26" stroke="#d4a93e" strokeWidth="3.6" strokeLinecap="round" />
        </svg>
      );
    case 'stellar':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#fff" />
          <path d="M17 37.5h20.2c5.2 0 8.6-2.2 11.8-7.2" fill="none" stroke="#111827" strokeWidth="4.4" strokeLinecap="round" />
          <path d="M20.5 28.5h20.2c5.2 0 8.6-2.2 11.8-7.2" fill="none" stroke="#111827" strokeWidth="4.4" strokeLinecap="round" />
          <circle cx="45.6" cy="24.8" r="3.2" fill="#111827" />
        </svg>
      );
    case 'xdc':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <path d="M16 18 28.8 32 16 46h7.5L32 36.8 40.5 46H48L35.2 32 48 18h-7.5L32 27.2 23.5 18H16Z" fill="#1b86ff" />
        </svg>
      );
    case 'polygon':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <path d="m22.2 22.2 10.1-5.8 10.1 5.8v11.6l-10.1 5.8-10.1-5.8z" fill="none" stroke="#8247e5" strokeWidth="4.6" strokeLinejoin="round" />
          <path d="m39 31.2 10.1-5.8 8.7 5v11.6l-10.1 5.8-8.7-5" fill="none" stroke="#8247e5" strokeWidth="4.6" strokeLinejoin="round" />
        </svg>
      );
    case 'algorand':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <path d="M35.3 12 21.8 38.9h6.3L39.5 16h.6l2.8 11H35l-3.3 6.1h12.7l3.2 18.9h6.2L45.8 12h-10.5Z" fill="#111827" />
        </svg>
      );
    case 'hedera':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#fff" />
          <path d="M22 16h20M22 48h20M25 20v24M39 20v24M25 29.2h14M25 34.8h14" fill="none" stroke="#111827" strokeWidth="4.2" strokeLinecap="round" />
        </svg>
      );
    case 'solana':
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="solana-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#14f195" />
              <stop offset="1" stopColor="#9945ff" />
            </linearGradient>
          </defs>
          <path d="M18 18h28l-6.5 7H11.5L18 18Z" fill="url(#solana-gradient)" />
          <path d="M24.5 28.5h28l-6.5 7H18l6.5-7Z" fill="url(#solana-gradient)" />
          <path d="M18 39h28l-6.5 7H11.5l6.5-7Z" fill="url(#solana-gradient)" />
        </svg>
      );
  }
}

export default function ChainLogo({ id, className = 'h-10 w-10', label }: Props) {
  const logo = LOGO_FRAMES[id];

  return (
    <span
      className={`${className} ${logo.background} flex shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[#14242b]/10 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
      aria-label={label || logo.alt}
    >
      <LogoGlyph id={id} />
    </span>
  );
}
