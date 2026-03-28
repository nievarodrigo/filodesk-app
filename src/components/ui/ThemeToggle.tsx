'use client'

import { useTheme } from './ThemeProvider'
import styles from './ui.module.css'

interface Props {
  onToggle?: () => void
}

export default function ThemeToggle({ onToggle }: Props) {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={() => {
        toggle()
        onToggle?.()
      }}
      className={styles.themeToggle}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
