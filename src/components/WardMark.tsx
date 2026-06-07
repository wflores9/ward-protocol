export default function WardMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect width="20" height="20" rx="3" fill="#0d1f35" />
      <path
        d="M10 3L4 6.5v4C4 14.1 6.7 17.3 10 18c3.3-.7 6-3.9 6-8.5v-4L10 3z"
        fill="white"
        fillOpacity={0.9}
      />
    </svg>
  )
}
