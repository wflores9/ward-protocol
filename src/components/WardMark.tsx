interface WardMarkProps {
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export default function WardMark({ size = 44, shape = 'circle', className }: WardMarkProps) {
  const bg =
    shape === 'circle' ? (
      <circle cx="50" cy="50" r="50" fill="#0f2439" />
    ) : (
      <rect width="100" height="100" rx="9" fill="#0f2439" />
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ward Protocol"
      role="img"
      className={className}
    >
      {bg}
      {/* W: filled polygon traced from master. Outer pentagon minus two notch triangles (evenodd). */}
      <path
        fillRule="evenodd"
        fill="#a7c5e5"
        d="M 25,25 L 75,25 L 62,70 L 50,43 L 38,70 Z M 34.5,25 L 45.6,25 L 38,70 Z M 54.4,25 L 65.5,25 L 62,70 Z"
      />
      {/* Gold underline bar */}
      <rect x="32.5" y="77" width="35" height="1.5" fill="#b8973a" rx="0.5" />
    </svg>
  );
}
