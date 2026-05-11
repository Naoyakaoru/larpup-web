import { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeContextValue {
  isDark: boolean
  mode: ThemeMode
  cycle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, mode: 'system', cycle: () => {} })

const STORAGE_KEY = 'larpup_theme'

function systemIsDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return 'system'
  })

  const [systemDark, setSystemDark] = useState(systemIsDark)

  // Always listen to system changes (for 'system' mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = mode === 'dark' || (mode === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Cycles: system → light → dark → system
  function cycle() {
    setMode(prev => {
      const next: ThemeMode = prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'
      if (next === 'system') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, next)
      }
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, mode, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
