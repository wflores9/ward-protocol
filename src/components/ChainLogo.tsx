import Image from "next/image";
import type { ChainLogoId } from "@/lib/wardPlatform";

type Props = {
  id: ChainLogoId;
  className?: string;
  label?: string;
};

const LOGO_FRAMES: Record<
  ChainLogoId,
  {
    alt: string;
    background: string;
    src: string;
    frameClassName?: string;
    paddingClassName?: string;
    imageClassName?: string;
  }
> = {
  xrpl: {
    alt: "XRPL logo",
    background: "bg-white",
    src: "/chain-logos/xrpl.webp",
    paddingClassName: "p-1",
  },
  flare: {
    alt: "Flare logo",
    background: "bg-[#e62058]",
    src: "/chain-logos/flare.png",
    paddingClassName: "p-0",
    imageClassName: "object-cover",
  },
  xrpl_evm: {
    alt: "XRPL EVM Sidechain logo",
    background: "bg-black",
    src: "/chain-logos/xrpl-evm.avif",
    frameClassName: "!w-28 rounded-[18px]",
    paddingClassName: "p-2",
  },
  xdc: {
    alt: "XDC Network logo",
    background: "bg-white",
    src: "/chain-logos/xdc.png",
    paddingClassName: "p-1.5",
  },
  polygon: {
    alt: "Polygon logo",
    background: "bg-white",
    src: "/chain-logos/polygon.png",
    paddingClassName: "p-1.5",
  },
  stellar: {
    alt: "Stellar logo",
    background: "bg-white",
    src: "/chain-logos/stellar.png",
    paddingClassName: "p-1.5",
  },
  algorand: {
    alt: "Algorand logo",
    background: "bg-white",
    src: "/chain-logos/algorand.webp",
    paddingClassName: "p-0.5",
  },
  solana: {
    alt: "Solana logo",
    background: "bg-[#426e4d]",
    src: "/chain-logos/solana.png",
    paddingClassName: "p-0",
    imageClassName: "scale-[1.18] object-cover",
  },
};

export default function ChainLogo({ id, className = "h-10 w-10", label }: Props) {
  const logo = LOGO_FRAMES[id];

  return (
    <span
      className={`${className} ${logo.background} ${logo.frameClassName || ""} ${logo.paddingClassName || "p-1.5"} relative flex shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-[#14242b]/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
      aria-label={label || logo.alt}
    >
      <span className="relative block h-full w-full">
        <Image
          src={logo.src}
          alt=""
          fill
          aria-hidden="true"
          sizes="112px"
          className={logo.imageClassName || "object-contain"}
        />
      </span>
    </span>
  );
}
