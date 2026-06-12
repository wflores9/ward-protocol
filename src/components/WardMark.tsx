interface WardMarkProps {
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export default function WardMark({ size = 44, shape = 'circle', className }: WardMarkProps) {
  return (
    <img
      src="/brand/ward-nav-88.png"
      width={size}
      height={size}
      alt="Ward Protocol"
      className={className}
      style={{
        borderRadius: shape === 'circle' ? '50%' : undefined,
        display: 'block',
      }}
    />
  );
}
