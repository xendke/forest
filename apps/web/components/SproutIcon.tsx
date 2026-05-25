export function SproutIcon({
  size = 24,
  color = "#4ce88a",
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="32" cy="55" rx="11" ry="2.5" fill={color} opacity="0.18" />
      <path
        d="M32 52 L32 30"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M32 38 C 22 36, 14 30, 12 20 C 22 19, 30 24, 32 34 Z"
        fill={color}
      />
      <path
        d="M32 32 C 42 30, 50 24, 52 14 C 42 13, 34 18, 32 28 Z"
        fill={color}
        opacity="0.85"
      />
      <path
        d="M32 30 L32 40"
        stroke="#0a1410"
        strokeWidth="0.6"
        opacity="0.4"
      />
    </svg>
  )
}
