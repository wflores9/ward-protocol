import type { ChainLogoId } from '@/lib/wardPlatform';

type Props = {
  id: ChainLogoId;
  className?: string;
  label?: string;
};

export default function ChainLogo({ id, className = 'h-10 w-10', label }: Props) {
  const accessibleLabel = label || `${id} logo`;

  if (id === 'solana') {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
        <rect width="64" height="64" rx="14" fill="#101d23" />
        <path d="M17 20h30l-5 6H12l5-6Z" fill="#8cffd2" />
        <path d="M17 30h30l-5 6H12l5-6Z" fill="#c4b5fd" />
        <path d="M17 40h30l-5 6H12l5-6Z" fill="#fcd34d" />
      </svg>
    );
  }

  if (id === 'polygon') {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
        <rect width="64" height="64" rx="14" fill="#101d23" />
        <path d="M23 23l9-5 9 5v11l-9 5-9-5V23Z" fill="none" stroke="#d8b4fe" strokeWidth="4" />
        <path d="M32 18l9 5 8-5 9 5v11l-9 5-8-5" fill="none" stroke="#d8b4fe" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === 'stellar') {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
        <rect width="64" height="64" rx="14" fill="#101d23" />
        <circle cx="32" cy="32" r="16" fill="none" stroke="#7dd3fc" strokeWidth="4" />
        <path d="M17 42 47 22" stroke="#7dd3fc" strokeWidth="5" strokeLinecap="round" />
        <path d="M13 35 43 15" stroke="#d2e1dd" strokeWidth="3" strokeLinecap="round" opacity=".72" />
      </svg>
    );
  }

  if (id === 'algorand') {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
        <rect width="64" height="64" rx="14" fill="#101d23" />
        <path d="M21 47 35 15h8L50 47h-8l-2-9H29l-4 9h-4Z" fill="#86efac" />
        <path d="M31 32h16" stroke="#101d23" strokeWidth="4" />
      </svg>
    );
  }

  if (id === 'hedera') {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
        <rect width="64" height="64" rx="14" fill="#101d23" />
        <rect x="18" y="16" width="28" height="32" rx="2" fill="none" stroke="#a7f3d0" strokeWidth="4" />
        <path d="M24 26h24M24 38h24M26 16v32M38 16v32" stroke="#a7f3d0" strokeWidth="4" />
      </svg>
    );
  }

  if (id === 'xdc') {
    return (
      <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
        <rect width="64" height="64" rx="14" fill="#101d23" />
        <path d="M18 18h28l8 14-8 14H18L10 32l8-14Z" fill="none" stroke="#fcd34d" strokeWidth="4" />
        <text x="32" y="37" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fcd34d" fontFamily="DM Sans, Arial">XDC</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={accessibleLabel} className={className}>
      <rect width="64" height="64" rx="14" fill="#101d23" />
      <path d="M20 20c5 0 8 5 12 10 4-5 7-10 12-10h4c-6 0-10 7-15 13 5 6 9 13 15 13h-4c-5 0-8-5-12-10-4 5-7 10-12 10h-4c6 0 10-7 15-13-5-6-9-13-15-13h4Z" fill="#9fc6ff" />
    </svg>
  );
}
