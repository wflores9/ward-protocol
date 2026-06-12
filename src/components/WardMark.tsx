// Geometric bold W mark — navy bg · ice W · gold bar.
// Colors match design tokens in globals.css:
//   navy  = #0f2439   ice = #a7c5e5   gold = #b8973a

interface WardMarkProps {
  /** Rendered square size in px. SVG scales proportionally. Default 44. */
  size?: number;
  /** 'circle' = nav/footer pill; 'square' = favicon/manifest context. */
  shape?: 'circle' | 'square';
  className?: string;
}

export default function WardMark({ size = 44, shape = 'circle', className }: WardMarkProps) {
  // All geometry lives in a 44×44 viewBox.
  // W: 7-point polyline, symmetric, bold square caps, rounded joins.
  //   Outer tops:      x=7/37,  y=10
  //   Valley bottoms:  x=13.5/30.5, y=32
  //   Inner peaks:     x=19/25, y=19.5
  //   Centre notch:    x=22,    y=27
  // Gold bar: y=35–37.5, x=7–37 (full W width)
  const bg =
    shape === 'circle' ? (
      <circle cx="22" cy="22" r="22" fill="#0f2439" />
    ) : (
      <rect width="44" height="44" rx="4" fill="#0f2439" />
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ward Protocol"
      role="img"
      className={className}
    >
      {bg}
      <polyline
        points="7,10 13.5,32 19,19.5 22,27 25,19.5 30.5,32 37,10"
        stroke="#a7c5e5"
        strokeWidth="3.7"
        strokeLinecap="square"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="7" y="35" width="30" height="2.5" fill="#b8973a" rx="0.5" />
    </svg>
  );
}
