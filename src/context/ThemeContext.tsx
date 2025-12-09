import { createContext, useContext } from 'react'

export type ThemeMode = 'dark' | 'light'

export interface ThemeContextValue {
  mode: ThemeMode
  toggleMode: () => void
}

export const ThemeModeContext = createContext<ThemeContextValue | null>(null)

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeContext provider')
  }
  return ctx
}
