import type { ChainLogoId } from '@/lib/wardPlatform';

type Props = {
  id: ChainLogoId;
  className?: string;
  label?: string;
};

const LOGOS: Record<ChainLogoId, { src: string; alt: string; padding: string; background: string }> = {
  xrpl: {
    src: '/chain-logos/xrpl.png',
    alt: 'XRPL logo',
    padding: 'p-2',
    background: 'bg-white',
  },
  xrpl_evm: {
    src: '/chain-logos/xrpl-evm.png',
    alt: 'XRPL EVM Sidechain logo',
    padding: 'p-1',
    background: 'bg-black',
  },
  stellar: {
    src: '/chain-logos/stellar.png',
    alt: 'Stellar logo',
    padding: 'p-2',
    background: 'bg-white',
  },
  hedera: {
    src: '/chain-logos/hedera.png',
    alt: 'Hedera logo',
    padding: 'p-2',
    background: 'bg-white',
  },
  solana: {
    src: '/chain-logos/solana.png',
    alt: 'Solana logo',
    padding: 'p-1',
    background: 'bg-white',
  },
  xdc: {
    src: '/chain-logos/xdc.png',
    alt: 'XDC Network logo',
    padding: 'p-2',
    background: 'bg-white',
  },
  algorand: {
    src: '/chain-logos/algorand.png',
    alt: 'Algorand logo',
    padding: 'p-2',
    background: 'bg-white',
  },
  polygon: {
    src: '/chain-logos/polygon.png',
    alt: 'Polygon logo',
    padding: 'p-1',
    background: 'bg-white',
  },
};

export default function ChainLogo({ id, className = 'h-10 w-10', label }: Props) {
  const logo = LOGOS[id];

  return (
    <span
      className={`${className} ${logo.background} ${logo.padding} flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#14242b]/10`}
    >
      <img
        src={logo.src}
        alt={label || logo.alt}
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </span>
  );
}
