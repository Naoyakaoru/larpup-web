import { useTheme } from '../contexts/ThemeContext'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  const { isDark } = useTheme()
  return (
    <img
      src={isDark ? '/logo-dark.png' : '/logo.png'}
      alt="LarpUp Logo"
      className={`object-contain h-8 w-auto ${className}`}
    />
  )
}
