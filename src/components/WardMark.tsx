import Image from 'next/image';

interface WardMarkProps {
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export default function WardMark({ size = 44, shape = 'square', className }: WardMarkProps) {
  const src = size <= 96 ? '/brand/ward-nav-88.png' : '/brand/ward-mark-square.png';

  return (
    <span
      className={`${className || ''} relative block shrink-0 overflow-hidden ${shape === 'circle' ? 'rounded-full' : 'rounded-[12px]'}`}
      style={{ width: size, height: size }}
      aria-label="Ward Protocol"
      role="img"
    >
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" priority={size > 80} />
    </span>
  );
}
