interface LogoProps {
  variant?: 'default' | 'white'
  className?: string
}

export default function Logo({ variant = 'default', className = '' }: LogoProps) {
  const c = variant === 'white' ? '#ffffff' : '#F59E0B'

  return (
    <svg
      viewBox="0 0 172 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LarpUp"
    >
      {/* 爪印 */}
      {/* 趾墊 x4 */}
      <ellipse cx="10" cy="10" rx="4.5" ry="5.5" fill={c} transform="rotate(-20 10 10)" />
      <ellipse cx="20" cy="7"  rx="4.5" ry="5.5" fill={c} transform="rotate(-5 20 7)" />
      <ellipse cx="30" cy="8"  rx="4.5" ry="5.5" fill={c} transform="rotate(10 30 8)" />
      <ellipse cx="39" cy="13" rx="4.5" ry="5.5" fill={c} transform="rotate(25 39 13)" />
      {/* 掌墊 */}
      <ellipse cx="24" cy="28" rx="12" ry="10" fill={c} />

      {/* 文字 */}
      <text
        x="52"
        y="31"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="28"
        fill={c}
        letterSpacing="-0.5"
      >
        LarpUp
      </text>
    </svg>
  )
}
